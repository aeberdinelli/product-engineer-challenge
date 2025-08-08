import { DynamoDBClient, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

export const APPOINTMENT_MINUTES = 45;
export const REST_MINUTES = 15;
export const CYCLE_MINUTES = APPOINTMENT_MINUTES + REST_MINUTES;

export type Interval = { start: number; end: number };

const client = new DynamoDBClient({});

export const hhmmToMinutes = (hhmm: string): number => {
	const [hours, minutes] = hhmm.split(':').map(Number);
	return hours * 60 + minutes;
};

export const getPsychiatristSchedule = async (psychiatristId: string, date: string): Promise<{ profile: any; scheduleBlocks: Interval[] }> => {
	const psychiatristResponse = await client.send(
		new GetItemCommand({
			TableName: process.env.TABLE_NAME,
			Key: {
				PK: { S: `PSYCHIATRIST#${psychiatristId}` },
				SK: { S: 'PROFILE' }
			}
		})
	);

	if (!psychiatristResponse.Item) {
		throw new Error('NOT_FOUND');
	}

	const profile = unmarshall(psychiatristResponse.Item);
	const weekday = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

	const scheduleBlocks: Interval[] = (profile.schedule || [])
		.filter((scheduleItem: any) => scheduleItem.day === weekday)
		.map((scheduleItem: any) => {
			return {
				start: hhmmToMinutes(scheduleItem.startTime),
				end: hhmmToMinutes(scheduleItem.endTime)
			};
		});

	return { profile, scheduleBlocks };
};

export const getBookedIntervals = async (psychiatristId: string, date: string, includePending: boolean = true): Promise<Interval[]> => {
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

    const intervals: Interval[] = [];

    for (const item of bookedResponse.Items || []) {
		const data = unmarshall(item) as any;

		if (!includePending && data.status === 'PENDING') {
			continue;
		}

		const start = Number(data.startMinutes);
		const end = Number(data.endMinutes);

		// Add rest time after appointment
		intervals.push({
			start,
			end: end + REST_MINUTES
		});
	}

	return intervals;
};
