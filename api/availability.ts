import { DynamoDBClient, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DateTime } from 'luxon';
import { Slot } from './timeUtils';

const client = new DynamoDBClient({});

// Hardcoded for now
const APPOINTMENT_MINUTES = 45;
const REST_MINUTES = 15;
const CYCLE_MINUTES = APPOINTMENT_MINUTES + REST_MINUTES;

type Interval = { start: number; end: number }; // minutes since midnight

const hhmmToMinutes = (hhmm: string): number => {
	const [hours, minutes] = hhmm.split(':').map(Number);
	return hours * 60 + minutes;
};

export const handler: APIGatewayProxyHandler = async (event) => {
	try {
		const psychiatristId = event.pathParameters?.id;
		const date = event.queryStringParameters?.date; // YYYY-MM-DD

		if (!psychiatristId || !date) {
			return {
				statusCode: 400,
				body: JSON.stringify({ error: 'Missing psychiatrist id or date' })
			};
		}

		// Get psychiatrist profile
		const profileResponse = await client.send(
			new GetItemCommand({
				TableName: process.env.TABLE_NAME,
				Key: {
					PK: { S: `PSYCHIATRIST#${psychiatristId}` },
					SK: { S: 'PROFILE' }
				}
			})
		);

		if (!profileResponse.Item) {
			return {
				statusCode: 404,
				body: JSON.stringify({ error: 'Psychiatrist not found' })
			};
		}

		const profile = unmarshall(profileResponse.Item);
		const psychiatristTimezone = profile.timezone || 'UTC';
		const weekday = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

		// Get schedule blocks for that weekday
		const scheduleBlocks: Interval[] = (profile.schedule || [])
			.filter((scheduleItem: any) => scheduleItem.day === weekday)
			.map((scheduleItem: any) => ({
				start: hhmmToMinutes(scheduleItem.startTime),
				end: hhmmToMinutes(scheduleItem.endTime)
			}));

		if (scheduleBlocks.length === 0) {
			return {
				statusCode: 200,
				body: JSON.stringify([])
			};
		}

		// Get booked appointments for that date
		const bookedResponse = await client.send(
			new QueryCommand({
				TableName: process.env.TABLE_NAME,
				IndexName: 'GSI2',
				KeyConditionExpression: 'GSI2PK = :date AND begins_with(GSI2SK, :psychiatrist)',
				ExpressionAttributeValues: {
					':date': { S: `DATE#${date}` },
					':psychiatrist': { S: `PSYCHIATRIST#${psychiatristId}` }
				}
			})
		);

		const bookedIntervals: Interval[] = (bookedResponse.Items || []).map((item) => {
			const data = unmarshall(item);
			return {
				start: hhmmToMinutes(data.startTime),
				end: hhmmToMinutes(data.endTime)
			};
		});

		// Subtract booked intervals from open schedule blocks
		let freeIntervals: Interval[] = scheduleBlocks;

		for (const bookedInterval of bookedIntervals) {
			const updatedFreeIntervals: Interval[] = [];

			for (const openInterval of freeIntervals) {
				const isCompletelyBefore = bookedInterval.end <= openInterval.start;
				const isCompletelyAfter = bookedInterval.start >= openInterval.end;

				if (isCompletelyBefore || isCompletelyAfter) {
					updatedFreeIntervals.push(openInterval);
					continue;
				}

				if (bookedInterval.start > openInterval.start) {
					updatedFreeIntervals.push({
						start: openInterval.start,
						end: Math.min(bookedInterval.start, openInterval.end)
					});
				}

				if (bookedInterval.end < openInterval.end) {
					updatedFreeIntervals.push({
						start: Math.max(bookedInterval.end, openInterval.start),
						end: openInterval.end
					});
				}
			}

			freeIntervals = updatedFreeIntervals;
		}

		// Generate available slots
		const slots: Slot[] = [];

		for (const { start, end } of freeIntervals) {
			for (let currentMinute = start; currentMinute + CYCLE_MINUTES <= end; currentMinute += CYCLE_MINUTES) {
				const slotStartLocal = DateTime.fromISO(date, { zone: psychiatristTimezone }).plus({ minutes: currentMinute });
				const slotEndLocal = slotStartLocal.plus({ minutes: APPOINTMENT_MINUTES });

				slots.push({
					startUtc: slotStartLocal.toUTC().toISO() ?? '',
					endUtc: slotEndLocal.toUTC().toISO() ?? '',
					displayStart: slotStartLocal.toFormat('HH:mm'),
					displayEnd: slotEndLocal.toFormat('HH:mm')
				});
			}
		}

		return {
			statusCode: 200,
			body: JSON.stringify(slots)
		};
	} catch (error) {
		console.error(error);

		return {
			statusCode: 500,
			body: JSON.stringify({ error: 'Failed to get availability' })
		};
	}
};
