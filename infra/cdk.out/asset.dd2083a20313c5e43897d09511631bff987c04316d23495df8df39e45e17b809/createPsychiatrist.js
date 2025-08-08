"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const uuid_1 = require("uuid");
const schemy_ts_1 = require("schemy-ts");
const client = new client_dynamodb_1.DynamoDBClient({});
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
const PsychiatristSchema = new schemy_ts_1.Schemy({
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
        type: [ScheduleSchema],
        required: true,
    },
    specialty: {
        type: String,
        required: true,
        min: 3,
        max: 50
    }
});
const handler = async (event) => {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing body" })
            };
        }
        const body = JSON.parse(event.body);
        if (!PsychiatristSchema.validate(body)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Invalid input",
                    details: PsychiatristSchema.validationErrors
                })
            };
        }
        const id = (0, uuid_1.v4)();
        await client.send(new client_dynamodb_1.PutItemCommand({
            TableName: process.env.TABLE_NAME,
            Item: {
                PK: { S: `PSYCHIATRIST#${id}` },
                SK: { S: 'PROFILE' },
                GSI1PK: { S: `SPECIALTY#${body.specialty}` },
                GSI1SK: { S: `PSYCHIATRIST#${id}` },
                name: { S: body.name },
                specialty: { S: body.specialty }
            }
        }));
        return {
            statusCode: 201,
            body: JSON.stringify({ id, name: body.name, specialty: body.specialty })
        };
    }
    catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to create psychiatrist" })
        };
    }
};
exports.handler = handler;
