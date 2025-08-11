import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { v4 as uuid } from 'uuid';
import { Schemy } from 'schemy-ts';
import { marshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({});

// Define schema
const ScheduleSchema = {
	day: {
		type: String,
		required: true,
		enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
	},
	startTime: {
		type: String,
		required: true,
		regex: /^([0-1]\d|2[0-3]):([0-5]\d)$/
	},
	endTime: {
		type: String,
		required: true,
		regex: /^([0-1]\d|2[0-3]):([0-5]\d)$/
	}
};

const AllScheduleSchema = new Schemy({
	online: {
		type: [ScheduleSchema],
	},
	inPerson: {
		type: [ScheduleSchema]
	},
});

const PsychiatristSchema = new Schemy({
	name: {
		type: String,
		required: true,
		min: 2,
		max: 100
	},
	email: {
		type: String,
		required: true,
		regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		min: 5,
		max: 100
	},
	schedule: {
		type: AllScheduleSchema.schema,
		required: true,
	},
	specialty: {
		type: String,
		required: true,
		min: 3,
		max: 50
	},
	timezone: {
		type: String,
		required: true,
		min: 3,
		max: 50
	},
});

export const handler: APIGatewayProxyHandler = async (event) => {
	try {
		if (!event.body) {
			return { 
				statusCode: 400, 
				headers: {
                    'Content-Type': 'application/json'
                },
				body: JSON.stringify({ error: "Missing body" }) 
			};
		}
		
		const body = JSON.parse(event.body);
		
		if (!PsychiatristSchema.validate(body)) {
			return {
				statusCode: 400,
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					error: "Invalid input",
					details: PsychiatristSchema.validationErrors
				})
			};
		}
		
		const id = uuid();
		
		await client.send(new PutItemCommand({
			TableName: process.env.TABLE_NAME,
			Item: marshall({
				PK: `PSYCHIATRIST#${id}`,
				SK: 'PROFILE',
				GSI1PK: `SPECIALTY#${body.specialty}`,
				GSI1SK: `PSYCHIATRIST#${id}`,
				name: body.name,
				specialty: body.specialty,
				email: body.email,
				schedule: body.schedule,
				timezone: body.timezone,
			}, { removeUndefinedValues: true })
		}));
		
		return {
			statusCode: 201,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				id,
				name: body.name,
				email: body.email,
				specialty: body.specialty,
				schedule: body.schedule,
				timezone: body.timezone,
			})
		};
	} catch (err) {
		console.error(err);

		return {
			statusCode: 500,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ error: "Failed to create psychiatrist" })
		};
	}
};
