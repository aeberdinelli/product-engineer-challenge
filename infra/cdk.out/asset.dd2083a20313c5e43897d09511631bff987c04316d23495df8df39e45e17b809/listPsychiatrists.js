"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({});
const handler = async () => {
    try {
        const result = await client.send(new client_dynamodb_1.ScanCommand({
            TableName: process.env.TABLE_NAME,
            FilterExpression: "SK = :profile",
            ExpressionAttributeValues: {
                ":profile": { S: "PROFILE" }
            }
        }));
        const psychiatrists = result.Items?.map(item => (0, util_dynamodb_1.unmarshall)(item)) || [];
        return {
            statusCode: 200,
            body: JSON.stringify(psychiatrists)
        };
    }
    catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to list psychiatrists" })
        };
    }
};
exports.handler = handler;
