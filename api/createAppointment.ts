import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';
import { Slot } from './timeUtils';
import { Schemy } from 'schemy-ts';

const client = new DynamoDBClient({});
const APPOINTMENT_MINUTES = 45;

const CreateAppointmentSchema = new Schemy({
	psychiatristId: {
		type: String,
		required: true
	},
	startUtc: {
		type: String,
		required: true
	}
});

export const handler: APIGatewayProxyHandler = async (event) => {
	try {
		if (!event.body) {
			return {
				statusCode: 400,
				body: JSON.stringify({ error: 'Missing body' })
			};
		}

		const body = JSON.parse(event.body);

		if (!CreateAppointmentSchema.validate(body)) {
			return {
				statusCode: 400,
				body: JSON.stringify({ 
					error: 'Invalid input', 
					details: CreateAppointmentSchema.getValidationErrors() 
				})
			};
		}

		const { psychiatristId, startUtc } = body;

		// Validate psychiatrist exists and get profile
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

		// Convert UTC to psychiatrist local time
		const startLocal = DateTime.fromISO(startUtc, { zone: 'utc' }).setZone(psychiatristTimezone);
		const endLocal = startLocal.plus({ minutes: APPOINTMENT_MINUTES });
		const dateLocalStr = startLocal.toISODate();

		// Prevent double booking
		const bookedResponse = await client.send(
			new QueryCommand({
				TableName: process.env.TABLE_NAME,
				IndexName: 'GSI2',
				KeyConditionExpression: 'GSI2PK = :date AND GSI2SK = :psychiatristSlot',
				ExpressionAttributeValues: {
					':date': { S: `DATE#${dateLocalStr}` },
					':psychiatristSlot': { S: `PSYCHIATRIST#${psychiatristId}#${startLocal.toFormat('HH:mm')}` }
				}
			})
		);

		if ((bookedResponse.Items || []).length > 0) {
			return {
				statusCode: 409,
				body: JSON.stringify({ error: 'Slot already booked' })
			};
		}

		// Store appointment (pending approval)
		const appointmentId = uuid();

		await client.send(
			new PutItemCommand({
				TableName: process.env.TABLE_NAME,
				Item: marshall({
					PK: `APPOINTMENT#${appointmentId}`,
					SK: 'PROFILE',
					GSI1PK: `PSYCHIATRIST#${psychiatristId}`,
					GSI1SK: `DATE#${dateLocalStr}`,
					GSI2PK: `DATE#${dateLocalStr}`,
					GSI2SK: `PSYCHIATRIST#${psychiatristId}#${startLocal.toFormat('HH:mm')}`,
					psychiatristId,
					startTime: startLocal.toFormat('HH:mm'),
					endTime: endLocal.toFormat('HH:mm'),
					date: dateLocalStr,
					status: 'PENDING'
				}, { removeUndefinedValues: true })
			})
		);

		const slot: Slot = {
			startUtc,
			endUtc: endLocal.toUTC().toISO() ?? '',
			displayStart: startLocal.toFormat('HH:mm'),
			displayEnd: endLocal.toFormat('HH:mm')
		};

		return {
			statusCode: 201,
			body: JSON.stringify({
				id: appointmentId,
				status: 'PENDING',
				slot
			})
		};
	} catch (error) {
		console.error(error);

		return {
			statusCode: 500,
			body: JSON.stringify({ error: 'Failed to create appointment' })
		};
	}
};
