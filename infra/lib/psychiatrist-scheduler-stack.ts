import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class PsychiatristSchedulerStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);
		
		// DynamoDB table
		const table = new dynamodb.Table(this, 'PsychiatristsTable', {
			partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
			sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
			billingMode: dynamodb.BillingMode.PROVISIONED,
			readCapacity: 1,
			writeCapacity: 1
		});
		
		// Specialty index
		table.addGlobalSecondaryIndex({
			indexName: 'GSI1',
			partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
			sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
			projectionType: dynamodb.ProjectionType.ALL
		});
		
		// Availability by date/time index
		table.addGlobalSecondaryIndex({
			indexName: 'GSI2',
			partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
			sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
			projectionType: dynamodb.ProjectionType.ALL
		});
		
		// Find psychiatrists
		const listPsychiatristsLambda = new NodejsFunction(this, 'ListPsychiatristsLambda', {
			entry: path.join(__dirname, '../../api/listPsychiatrists.ts'),
			handler: 'handler',
			runtime: lambda.Runtime.NODEJS_20_X,
			environment: { TABLE_NAME: table.tableName }
		});
		
		// Create psychiatrist
		const createPsychiatristLambda = new NodejsFunction(this, 'CreatePsychiatristLambda', {
			entry: path.join(__dirname, '../../api/createPsychiatrist.ts'),
			handler: 'handler',
			runtime: lambda.Runtime.NODEJS_20_X,
			environment: { TABLE_NAME: table.tableName }
		});

		// Get availability
		const availabilityLambda = new NodejsFunction(this, 'AvailabilityLambda', {
			entry: path.join(__dirname, '../../api/availability.ts'),
			handler: 'handler',
			runtime: lambda.Runtime.NODEJS_20_X,
			environment: { TABLE_NAME: table.tableName }
		});

		// Create appointment
		const createAppointmentLambda = new NodejsFunction(this, 'CreateAppointmentLambda', {
			entry: path.join(__dirname, '../../api/createAppointment.ts'),
			handler: 'handler',
			runtime: lambda.Runtime.NODEJS_20_X,
			environment: { TABLE_NAME: table.tableName }
		});

		// Approve and reject appointment
		const approveAppointmentLambda = new NodejsFunction(this, 'ApproveAppointmentLambda', {
			entry: path.join(__dirname, '../../api/approveAppointment.ts'),
			handler: 'handler',
			runtime: lambda.Runtime.NODEJS_20_X,
			environment: { TABLE_NAME: table.tableName }
		});
		const rejectAppointmentLambda = new NodejsFunction(this, 'RejectAppointmentLambda', {
			entry: path.join(__dirname, '../../api/rejectAppointment.ts'),
			handler: 'handler',
			runtime: lambda.Runtime.NODEJS_20_X,
			environment: { TABLE_NAME: table.tableName }
		});

		// Grant permissions
		table.grantReadWriteData(approveAppointmentLambda);
		table.grantReadWriteData(rejectAppointmentLambda);
		table.grantReadData(listPsychiatristsLambda);
		table.grantWriteData(createPsychiatristLambda);
		table.grantReadData(availabilityLambda);
		table.grantReadWriteData(createAppointmentLambda);
		
		// API Gateway HTTP API
		const httpApi = new HttpApi(this, 'HttpApi', { apiName: 'PsychiatristSchedulerApi' });
		
		// Routes
		httpApi.addRoutes({
			path: '/psychiatrists',
			methods: [HttpMethod.GET],
			integration: new HttpLambdaIntegration('ListPsychiatristsIntegration', listPsychiatristsLambda)
		});
		httpApi.addRoutes({
			path: '/psychiatrists',
			methods: [HttpMethod.POST],
			integration: new HttpLambdaIntegration('CreatePsychiatristIntegration', createPsychiatristLambda)
		});
		httpApi.addRoutes({
			path: '/psychiatrists/{id}/availability',
			methods: [HttpMethod.GET],
			integration: new HttpLambdaIntegration('AvailabilityIntegration', availabilityLambda)
		});
		httpApi.addRoutes({
			path: '/appointments',
			methods: [HttpMethod.POST],
			integration: new HttpLambdaIntegration('CreateAppointmentIntegration', createAppointmentLambda)
		});
		httpApi.addRoutes({
			path: '/appointments/{id}/approve',
			methods: [HttpMethod.PATCH],
			integration: new HttpLambdaIntegration('ApproveAppointmentIntegration', approveAppointmentLambda)
		});
		httpApi.addRoutes({
			path: '/appointments/{id}/reject',
			methods: [HttpMethod.PATCH],
			integration: new HttpLambdaIntegration('RejectAppointmentIntegration', rejectAppointmentLambda)
		});
		
		new cdk.CfnOutput(this, 'ApiEndpoint', {
			value: httpApi.apiEndpoint
		});
	}
}
