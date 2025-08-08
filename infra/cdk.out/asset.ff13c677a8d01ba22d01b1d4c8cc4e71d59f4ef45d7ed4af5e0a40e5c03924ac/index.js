"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../api/availability.ts
var availability_exports = {};
__export(availability_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(availability_exports);

// ../api/availabilityUtils.ts
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_util_dynamodb = require("@aws-sdk/util-dynamodb");
var APPOINTMENT_MINUTES = 45;
var REST_MINUTES = 15;
var CYCLE_MINUTES = APPOINTMENT_MINUTES + REST_MINUTES;
var client = new import_client_dynamodb.DynamoDBClient({});
var hhmmToMinutes = (hhmm) => {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
};
var getPsychiatristSchedule = async (psychiatristId, date) => {
  const psychiatristResponse = await client.send(
    new import_client_dynamodb.GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        PK: { S: `PSYCHIATRIST#${psychiatristId}` },
        SK: { S: "PROFILE" }
      }
    })
  );
  if (!psychiatristResponse.Item) {
    throw new Error("NOT_FOUND");
  }
  const profile = (0, import_util_dynamodb.unmarshall)(psychiatristResponse.Item);
  const weekday = new Date(date).toLocaleDateString("en-US", { weekday: "long" });
  const scheduleBlocks = (profile.schedule || []).filter((scheduleItem) => scheduleItem.day === weekday).map((scheduleItem) => {
    return {
      start: hhmmToMinutes(scheduleItem.startTime),
      end: hhmmToMinutes(scheduleItem.endTime)
    };
  });
  return { profile, scheduleBlocks };
};
var getBookedIntervals = async (psychiatristId, date) => {
  const bookedResponse = await client.send(
    new import_client_dynamodb.QueryCommand({
      TableName: process.env.TABLE_NAME,
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :date AND begins_with(GSI2SK, :psychiatrist)",
      ExpressionAttributeValues: {
        ":date": { S: `DATE#${date}` },
        ":psychiatrist": { S: `PSYCHIATRIST#${psychiatristId}` }
      }
    })
  );
  return (bookedResponse.Items || []).map((item) => {
    const data = (0, import_util_dynamodb.unmarshall)(item);
    return {
      start: hhmmToMinutes(data.startTime),
      end: hhmmToMinutes(data.endTime)
    };
  });
};

// ../api/availability.ts
var handler = async (event) => {
  try {
    const psychiatristId = event.pathParameters?.id;
    const date = event.queryStringParameters?.date;
    if (!psychiatristId || !date) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: "Missing psychiatrist id or date" })
      };
    }
    let scheduleBlocks;
    try {
      ({ scheduleBlocks } = await getPsychiatristSchedule(psychiatristId, date));
    } catch (err) {
      if (err instanceof Error && err.message === "NOT_FOUND") {
        return {
          statusCode: 404,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ error: "Psychiatrist not found" })
        };
      }
      throw err;
    }
    if (scheduleBlocks.length === 0) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify([])
      };
    }
    const bookedIntervals = await getBookedIntervals(psychiatristId, date);
    let freeIntervals = scheduleBlocks;
    for (const bookedInterval of bookedIntervals) {
      const updatedFreeIntervals = [];
      for (const openInterval of freeIntervals) {
        const isCompletelyBefore = bookedInterval.end <= openInterval.start;
        const isCompletelyAfter = bookedInterval.start >= openInterval.end;
        if (isCompletelyBefore || isCompletelyAfter) {
          updatedFreeIntervals.push(openInterval);
          continue;
        }
        if (bookedInterval.start > openInterval.start) {
          updatedFreeIntervals.push({
            start: openInterval.start,
            end: Math.min(bookedInterval.start, openInterval.end)
          });
        }
        if (bookedInterval.end < openInterval.end) {
          updatedFreeIntervals.push({
            start: Math.max(bookedInterval.end, openInterval.start),
            end: openInterval.end
          });
        }
      }
      freeIntervals = updatedFreeIntervals;
    }
    const slots = [];
    for (const { start, end } of freeIntervals) {
      for (let currentMinute = start; currentMinute + CYCLE_MINUTES <= end; currentMinute += CYCLE_MINUTES) {
        const slotStartHours = String(Math.floor(currentMinute / 60)).padStart(2, "0");
        const slotStartMinutes = String(currentMinute % 60).padStart(2, "0");
        const slotEndHours = String(Math.floor((currentMinute + APPOINTMENT_MINUTES) / 60)).padStart(2, "0");
        const slotEndMinutes = String((currentMinute + APPOINTMENT_MINUTES) % 60).padStart(2, "0");
        slots.push({
          startTime: `${slotStartHours}:${slotStartMinutes}`,
          endTime: `${slotEndHours}:${slotEndMinutes}`
        });
      }
    }
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(slots)
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: "Failed to get availability" })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
