"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PsychiatristSchedulerStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigw = __importStar(require("@aws-cdk/aws-apigatewayv2-alpha"));
const integrations = __importStar(require("@aws-cdk/aws-apigatewayv2-integrations-alpha"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const path = __importStar(require("path"));
class PsychiatristSchedulerStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // DynamoDB table
        const table = new dynamodb.Table(this, 'PsychiatristsTable', {
            partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PROVISIONED,
            readCapacity: 1,
            writeCapacity: 1
        });
        // Specialty
        table.addGlobalSecondaryIndex({
            indexName: 'GSI1',
            partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL
        });
        // Availability by date/time
        table.addGlobalSecondaryIndex({
            indexName: 'GSI2',
            partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL
        });
        // Lambda to list psychiatrists
        const listPsychiatristsLambda = new lambda.Function(this, 'ListPsychiatristsLambda', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'listPsychiatrists.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../api/dist')),
            environment: {
                TABLE_NAME: table.tableName
            }
        });
        table.grantReadData(listPsychiatristsLambda);
        // API Gateway HTTP API
        const httpApi = new apigw.HttpApi(this, 'PsychiatristSchedulerApi', {
            apiName: 'PsychiatristSchedulerApi'
        });
        httpApi.addRoutes({
            path: '/psychiatrists',
            methods: [apigw.HttpMethod.GET],
            integration: new integrations.HttpLambdaIntegration('ListPsychiatristsIntegration', listPsychiatristsLambda)
        });
        new cdk.CfnOutput(this, 'ApiEndpoint', {
            value: httpApi.apiEndpoint
        });
    }
}
exports.PsychiatristSchedulerStack = PsychiatristSchedulerStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHN5Y2hpYXRyaXN0LXNjaGVkdWxlci1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBzeWNoaWF0cmlzdC1zY2hlZHVsZXItc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFFbkMsK0RBQWlEO0FBQ2pELHVFQUF5RDtBQUN6RCwyRkFBNkU7QUFDN0UsbUVBQXFEO0FBQ3JELDJDQUE2QjtBQUU3QixNQUFhLDBCQUEyQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3hELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDL0QsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsaUJBQWlCO1FBQ2pCLE1BQU0sS0FBSyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDNUQsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDakUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDNUQsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVztZQUM3QyxZQUFZLEVBQUUsQ0FBQztZQUNmLGFBQWEsRUFBRSxDQUFDO1NBQ2hCLENBQUMsQ0FBQztRQUVILFlBQVk7UUFDWixLQUFLLENBQUMsdUJBQXVCLENBQUM7WUFDN0IsU0FBUyxFQUFFLE1BQU07WUFDakIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDckUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDaEUsY0FBYyxFQUFFLFFBQVEsQ0FBQyxjQUFjLENBQUMsR0FBRztTQUMzQyxDQUFDLENBQUM7UUFFSCw0QkFBNEI7UUFDNUIsS0FBSyxDQUFDLHVCQUF1QixDQUFDO1lBQzdCLFNBQVMsRUFBRSxNQUFNO1lBQ2pCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ3JFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ2hFLGNBQWMsRUFBRSxRQUFRLENBQUMsY0FBYyxDQUFDLEdBQUc7U0FDM0MsQ0FBQyxDQUFDO1FBRUgsK0JBQStCO1FBQy9CLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSx5QkFBeUIsRUFBRTtZQUNwRixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSwyQkFBMkI7WUFDcEMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDbkUsV0FBVyxFQUFFO2dCQUNaLFVBQVUsRUFBRSxLQUFLLENBQUMsU0FBUzthQUMzQjtTQUNELENBQUMsQ0FBQztRQUVILEtBQUssQ0FBQyxhQUFhLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUU3Qyx1QkFBdUI7UUFDdkIsTUFBTSxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSwwQkFBMEIsRUFBRTtZQUNuRSxPQUFPLEVBQUUsMEJBQTBCO1NBQ25DLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxTQUFTLENBQUM7WUFDakIsSUFBSSxFQUFFLGdCQUFnQjtZQUN0QixPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztZQUMvQixXQUFXLEVBQUUsSUFBSSxZQUFZLENBQUMscUJBQXFCLENBQ2xELDhCQUE4QixFQUM5Qix1QkFBdUIsQ0FDdkI7U0FDRCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUN0QyxLQUFLLEVBQUUsT0FBTyxDQUFDLFdBQVc7U0FDMUIsQ0FBQyxDQUFDO0lBQ0osQ0FBQztDQUNEO0FBM0RELGdFQTJEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGFwaWd3IGZyb20gJ0Bhd3MtY2RrL2F3cy1hcGlnYXRld2F5djItYWxwaGEnO1xuaW1wb3J0ICogYXMgaW50ZWdyYXRpb25zIGZyb20gJ0Bhd3MtY2RrL2F3cy1hcGlnYXRld2F5djItaW50ZWdyYXRpb25zLWFscGhhJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgY2xhc3MgUHN5Y2hpYXRyaXN0U2NoZWR1bGVyU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuXHRjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG5cdFx0c3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cdFx0XG5cdFx0Ly8gRHluYW1vREIgdGFibGVcblx0XHRjb25zdCB0YWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnUHN5Y2hpYXRyaXN0c1RhYmxlJywge1xuXHRcdFx0cGFydGl0aW9uS2V5OiB7IG5hbWU6ICdQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG5cdFx0XHRzb3J0S2V5OiB7IG5hbWU6ICdTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG5cdFx0XHRiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUFJPVklTSU9ORUQsXG5cdFx0XHRyZWFkQ2FwYWNpdHk6IDEsXG5cdFx0XHR3cml0ZUNhcGFjaXR5OiAxXG5cdFx0fSk7XG5cdFx0XG5cdFx0Ly8gU3BlY2lhbHR5XG5cdFx0dGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuXHRcdFx0aW5kZXhOYW1lOiAnR1NJMScsXG5cdFx0XHRwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ0dTSTFQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG5cdFx0XHRzb3J0S2V5OiB7IG5hbWU6ICdHU0kxU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuXHRcdFx0cHJvamVjdGlvblR5cGU6IGR5bmFtb2RiLlByb2plY3Rpb25UeXBlLkFMTFxuXHRcdH0pO1xuXHRcdFxuXHRcdC8vIEF2YWlsYWJpbGl0eSBieSBkYXRlL3RpbWVcblx0XHR0YWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG5cdFx0XHRpbmRleE5hbWU6ICdHU0kyJyxcblx0XHRcdHBhcnRpdGlvbktleTogeyBuYW1lOiAnR1NJMlBLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcblx0XHRcdHNvcnRLZXk6IHsgbmFtZTogJ0dTSTJTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG5cdFx0XHRwcm9qZWN0aW9uVHlwZTogZHluYW1vZGIuUHJvamVjdGlvblR5cGUuQUxMXG5cdFx0fSk7XG5cdFx0XG5cdFx0Ly8gTGFtYmRhIHRvIGxpc3QgcHN5Y2hpYXRyaXN0c1xuXHRcdGNvbnN0IGxpc3RQc3ljaGlhdHJpc3RzTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnTGlzdFBzeWNoaWF0cmlzdHNMYW1iZGEnLCB7XG5cdFx0XHRydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcblx0XHRcdGhhbmRsZXI6ICdsaXN0UHN5Y2hpYXRyaXN0cy5oYW5kbGVyJyxcblx0XHRcdGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vYXBpL2Rpc3QnKSksXG5cdFx0XHRlbnZpcm9ubWVudDoge1xuXHRcdFx0XHRUQUJMRV9OQU1FOiB0YWJsZS50YWJsZU5hbWVcblx0XHRcdH1cblx0XHR9KTtcblx0XHRcblx0XHR0YWJsZS5ncmFudFJlYWREYXRhKGxpc3RQc3ljaGlhdHJpc3RzTGFtYmRhKTtcblx0XHRcblx0XHQvLyBBUEkgR2F0ZXdheSBIVFRQIEFQSVxuXHRcdGNvbnN0IGh0dHBBcGkgPSBuZXcgYXBpZ3cuSHR0cEFwaSh0aGlzLCAnUHN5Y2hpYXRyaXN0U2NoZWR1bGVyQXBpJywge1xuXHRcdFx0YXBpTmFtZTogJ1BzeWNoaWF0cmlzdFNjaGVkdWxlckFwaSdcblx0XHR9KTtcblx0XHRcblx0XHRodHRwQXBpLmFkZFJvdXRlcyh7XG5cdFx0XHRwYXRoOiAnL3BzeWNoaWF0cmlzdHMnLFxuXHRcdFx0bWV0aG9kczogW2FwaWd3Lkh0dHBNZXRob2QuR0VUXSxcblx0XHRcdGludGVncmF0aW9uOiBuZXcgaW50ZWdyYXRpb25zLkh0dHBMYW1iZGFJbnRlZ3JhdGlvbihcblx0XHRcdFx0J0xpc3RQc3ljaGlhdHJpc3RzSW50ZWdyYXRpb24nLFxuXHRcdFx0XHRsaXN0UHN5Y2hpYXRyaXN0c0xhbWJkYVxuXHRcdFx0KVxuXHRcdH0pO1xuXHRcdFxuXHRcdG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcGlFbmRwb2ludCcsIHtcblx0XHRcdHZhbHVlOiBodHRwQXBpLmFwaUVuZHBvaW50XG5cdFx0fSk7XG5cdH1cbn1cbiJdfQ==