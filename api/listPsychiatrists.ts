import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';

const client = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (event) => {
	try {
		const specialty = event.queryStringParameters?.specialty;
		const appointmentType = event.queryStringParameters?.appointmentType;

		const command = specialty && specialty.trim().length > 0
			? new QueryCommand({
					TableName: process.env.TABLE_NAME,
					IndexName: 'GSI1',
					KeyConditionExpression: 'GSI1PK = :specialtyKey',
					ExpressionAttributeValues: {
						':specialtyKey': { S: `SPECIALTY#${specialty}` }
					}
			  })
			: new ScanCommand({
					TableName: process.env.TABLE_NAME,
					FilterExpression: 'SK = :profile',
					ExpressionAttributeValues: {
						':profile': { S: 'PROFILE' }
					}
			  });

		const response = await client.send(command);

		let psychiatrists = (response.Items || []).map((rawItem) => {
			const item = unmarshall(rawItem);
			const id = String(item.PK).replace('PSYCHIATRIST#', '');

			return {
				id,
				name: item.name,
				email: item.email,
				specialty: item.specialty,
				timezone: item.timezone,
				schedule: item.schedule,
				servicesOffered: item.servicesOffered || []
			};
		});

		if (appointmentType && appointmentType.trim().length > 0) {
			psychiatrists = psychiatrists.filter(p =>
				Array.isArray(p.servicesOffered) && p.servicesOffered.includes(appointmentType)
			);
		}

		return {
			statusCode: 200,
			body: JSON.stringify(psychiatrists)
		};
	} catch (error) {
		console.error(error);

		return {
			statusCode: 500,
			body: JSON.stringify({ error: 'Failed to list psychiatrists' })
		};
	}
};
