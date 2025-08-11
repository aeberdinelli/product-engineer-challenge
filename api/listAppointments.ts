import {
  DynamoDBClient,
  ScanCommand,
  BatchGetItemCommand
} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';

const ddb = new DynamoDBClient({});

type AppointmentDto = {
  id: string;
  psychiatristId: string;
  psychiatristName?: string;
  appointmentType?: 'ONLINE' | 'IN_PERSON';
  date: string; // local (psychiatrist) YYYY-MM-DD
  startTime: string; // local HH:mm
  endTime: string; // local HH:mm
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
};

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const scanRes = await ddb.send(
      new ScanCommand({
        TableName: process.env.TABLE_NAME,
        FilterExpression: 'begins_with(PK, :appt) AND SK = :profile',
        ExpressionAttributeValues: {
          ':appt': { S: 'APPOINTMENT#' },
          ':profile': { S: 'PROFILE' }
        }
      })
    );

    const items = (scanRes.Items || []).map((it) => unmarshall(it) as any);

    const result: AppointmentDto[] = [];
    const psychiatristIds = new Set<string>();

    for (const a of items) {
      const id = String(a.PK).replace('APPOINTMENT#', '');
      const psychiatristId = String(a.psychiatristId);

      result.push({
        id,
        psychiatristId,
        appointmentType: a.appointmentType,
        date: a.date,
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status
      });

      psychiatristIds.add(psychiatristId);
    }

    // Batch load psychiatrist names
    const keys = Array.from(psychiatristIds).map((pid) => ({
      PK: { S: `PSYCHIATRIST#${pid}` },
      SK: { S: 'PROFILE' }
    }));

    if (keys.length > 0) {
      const batchRes = await ddb.send(
        new BatchGetItemCommand({
          RequestItems: {
            [process.env.TABLE_NAME as string]: {
              Keys: keys
            }
          }
        })
      );

      const profiles =
        batchRes.Responses?.[process.env.TABLE_NAME as string]?.map((i) => unmarshall(i) as any) || [];

      const nameById = new Map<string, string>();
      for (const p of profiles) {
        const id = String(p.PK).replace('PSYCHIATRIST#', '');
        nameById.set(id, p.name);
      }

      for (const appt of result) {
        appt.psychiatristName = nameById.get(appt.psychiatristId);
      }
    }

    // Sort by date/time desc
    result.sort((a, b) => {
      const aKey = `${a.date} ${a.startTime}`;
      const bKey = `${b.date} ${b.startTime}`;
      return aKey < bKey ? 1 : aKey > bKey ? -1 : 0;
    });

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error(err);
    
    return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Failed to list appointments' }) 
    };
  }
};
