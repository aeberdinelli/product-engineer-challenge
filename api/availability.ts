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
		const rawType = event.queryStringParameters?.type?.toUpperCase();
		const requestedType = rawType === 'ONLINE' || rawType === 'IN_PERSON' ? rawType : 'ALL';

		if (!psychiatristId || !date) {
			return {
				statusCode: 400,
				body: JSON.stringify({ error: 'Missing psychiatrist id or date' })
			};
		}

		// Load psychiatrist profile
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

		// Choose which schedule buckets to use
		const typeToKey: Record<'ONLINE' | 'IN_PERSON', 'online' | 'inPerson'> = {
			ONLINE: 'online',
			IN_PERSON: 'inPerson'
		};

		const typesToProcess: Array<'ONLINE' | 'IN_PERSON'> =
			requestedType === 'ALL' ? ['ONLINE', 'IN_PERSON'] : [requestedType];

		// Build schedule blocks per type for the given weekday
		const scheduleByType: Record<'ONLINE' | 'IN_PERSON', Interval[]> = {
			ONLINE: [],
			IN_PERSON: []
		};

		for (const type of typesToProcess) {
			const key = typeToKey[type];
			const schedules = Array.isArray(profile.schedule?.[key]) ? profile.schedule[key] : [];

			const blocks: Interval[] = schedules
				.filter((scheduleItem: any) => scheduleItem.day === weekday)
				.map((scheduleItem: any) => {
					return {
						start: hhmmToMinutes(scheduleItem.startTime),
						end: hhmmToMinutes(scheduleItem.endTime)
					};
				});

			scheduleByType[type] = blocks;
		}

		// Early out: no working hours for the requested type(s)
		if (
			scheduleByType.ONLINE.length === 0 &&
			scheduleByType.IN_PERSON.length === 0
		) {
			return {
				statusCode: 200,
				body: JSON.stringify([])
			};
		}

		// Fetch booked appointments PER TYPE using new GSI2PK = DATE#<date>#<TYPE>
		const bookedByType: Record<'ONLINE' | 'IN_PERSON', Interval[]> = {
			ONLINE: [],
			IN_PERSON: []
		};

		for (const type of typesToProcess) {
			// If there are no blocks for this type today, skip the query
			if (scheduleByType[type].length === 0) {
				continue;
			}

			const bookedResponse = await client.send(
				new QueryCommand({
					TableName: process.env.TABLE_NAME,
					IndexName: 'GSI2',
					KeyConditionExpression:
						'GSI2PK = :pk AND begins_with(GSI2SK, :psychiatristPrefix)',
					ExpressionAttributeValues: {
						':pk': { S: `DATE#${date}#${type}` },
						':psychiatristPrefix': { S: `PSYCHIATRIST#${psychiatristId}` }
					}
				})
			);

			const intervals: Interval[] = (bookedResponse.Items || []).map((raw) => {
				const item = unmarshall(raw) as any;
				return {
					start: hhmmToMinutes(item.startTime),
					// pad with REST so next slot starts at the next cycle boundary
					end: hhmmToMinutes(item.endTime) + REST_MINUTES
				};
			});

			bookedByType[type] = intervals;
		}

		// For each type, subtract booked intervals from working blocks, then generate slots
		const slots: Slot[] = [];

		for (const type of typesToProcess) {
			const blocks = scheduleByType[type];

			if (blocks.length === 0) {
				continue;
			}

			let freeIntervals: Interval[] = blocks;

			for (const booked of bookedByType[type]) {
				const updated: Interval[] = [];

				for (const open of freeIntervals) {
					const isBefore = booked.end <= open.start;
					const isAfter = booked.start >= open.end;

					if (isBefore || isAfter) {
						updated.push(open);
						continue;
					}

					if (booked.start > open.start) {
						updated.push({
							start: open.start,
							end: Math.min(booked.start, open.end)
						});
					}

					if (booked.end < open.end) {
						updated.push({
							start: Math.max(booked.end, open.start),
							end: open.end
						});
					}
				}

				freeIntervals = updated;
			}

			// Generate cycle-aligned slots
			for (const { start, end } of freeIntervals) {
				for (
					let currentMinute = start;
					currentMinute + CYCLE_MINUTES <= end;
					currentMinute += CYCLE_MINUTES
				) {
					const slotStartLocal = DateTime.fromISO(date, { zone: psychiatristTimezone }).plus({
						minutes: currentMinute
					});
					const slotEndLocal = slotStartLocal.plus({ minutes: APPOINTMENT_MINUTES });

					slots.push({
						startUtc: slotStartLocal.toUTC().toISO() ?? '',
						endUtc: slotEndLocal.toUTC().toISO() ?? '',
						displayStart: slotStartLocal.toFormat('HH:mm'),
						displayEnd: slotEndLocal.toFormat('HH:mm'),
						appointmentType: type
					});
				}
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
