import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const ddb = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (event) => {
	try {
		const id = event.pathParameters?.id;

		if (!id) {
			return { 
				statusCode: 400, 
				body: JSON.stringify({ error: 'Missing appointment id' }) 
			};
		}

		await ddb.send(
			new UpdateItemCommand({
				TableName: process.env.TABLE_NAME,
				Key: {
					PK: { S: `APPOINTMENT#${id}` },
					SK: { S: 'PROFILE' }
				},
				UpdateExpression: 'SET #s = :rejected',
				ConditionExpression: '#s = :pending',
				ExpressionAttributeNames: { '#s': 'status' },
				ExpressionAttributeValues: {
					':pending': { S: 'PENDING' },
					':rejected': { S: 'REJECTED' }
				}
			})
		);

		return { 
			statusCode: 200, 
			body: JSON.stringify({ id, status: 'REJECTED' }) 
		};
	} catch (err) {
		console.error(err);
		
		return { 
			statusCode: 400, 
			body: JSON.stringify({ error: 'Failed to reject appointment' }) 
		};
	}
};
