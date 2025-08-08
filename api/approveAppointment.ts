import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';

const client = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (event) => {
	try {
		const appointmentId = event.pathParameters?.id;
		if (!appointmentId) {
			return { 
                statusCode: 400, 
                body: JSON.stringify({ error: 'Missing appointment id' }) 
            };
		}

		if (!event.body) {
			return { 
                statusCode: 400, 
                body: JSON.stringify({ error: 'Missing body' }) 
            };
		}

		const { psychiatristId } = JSON.parse(event.body);
        
		if (!psychiatristId) {
			return { 
                statusCode: 400, 
                body: JSON.stringify({ error: 'Missing psychiatristId' }) 
            };
		}

		await client.send(
			new UpdateItemCommand({
				TableName: process.env.TABLE_NAME,
				Key: {
					PK: { S: `APPOINTMENT#${appointmentId}` },
					SK: { S: `PSYCHIATRIST#${psychiatristId}` }
				},
				UpdateExpression: 'SET #s = :approved',
				ConditionExpression: '#s = :pending',
				ExpressionAttributeNames: { '#s': 'status' },
				ExpressionAttributeValues: {
					':pending': { S: 'PENDING' },
					':approved': { S: 'APPROVED' }
				}
			})
		);

		return { 
            statusCode: 200, 
            body: JSON.stringify({ appointmentId, status: 'APPROVED' }) 
        };
	} catch (error) {
		console.error(error);

		return { 
            statusCode: 400, 
            body: JSON.stringify({ error: 'Failed to approve appointment' }) 
        };
	}
};
