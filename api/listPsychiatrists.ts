import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';

const client = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (event) => {
	try {
		const specialty = event.queryStringParameters?.specialty;
		const appointmentType = event.queryStringParameters?.appointmentType; // "ONLINE" | "IN_PERSON"
		
		const command =
			specialty && specialty.trim().length > 0
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
					// Only psychiatrist profiles (avoid appointments)
					FilterExpression: 'begins_with(PK, :psy) AND SK = :profile',
					ExpressionAttributeValues: {
						':psy': { S: 'PSYCHIATRIST#' },
						':profile': { S: 'PROFILE' }
					}
				});
		
		const response = await client.send(command);
		
		let psychiatrists = (response.Items || [])
			.map((rawItem) => unmarshall(rawItem))
			.filter((item) => {
				const pk = String(item.PK ?? '');
				const sk = String(item.SK ?? '');
				return pk.startsWith('PSYCHIATRIST#') && sk === 'PROFILE';
			})
			.map((item) => {
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
			psychiatrists = psychiatrists.filter((psychiatrist) => {
				return (
					Array.isArray(psychiatrist.servicesOffered) &&
					psychiatrist.servicesOffered.includes(appointmentType)
				);
			});
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
