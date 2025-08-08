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

// ../api/rejectAppointment.ts
var rejectAppointment_exports = {};
__export(rejectAppointment_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(rejectAppointment_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var client = new import_client_dynamodb.DynamoDBClient({});
var handler = async (event) => {
  try {
    const appointmentId = event.pathParameters?.id;
    if (!appointmentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing appointment id" })
      };
    }
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing body" })
      };
    }
    const { psychiatristId } = JSON.parse(event.body);
    if (!psychiatristId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing psychiatristId" })
      };
    }
    await client.send(
      new import_client_dynamodb.UpdateItemCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          PK: { S: `APPOINTMENT#${appointmentId}` },
          SK: { S: `PSYCHIATRIST#${psychiatristId}` }
        },
        UpdateExpression: "SET #s = :rejected",
        ConditionExpression: "#s = :pending",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":pending": { S: "PENDING" },
          ":rejected": { S: "REJECTED" }
        }
      })
    );
    return {
      statusCode: 200,
      body: JSON.stringify({ appointmentId, status: "REJECTED" })
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Failed to reject appointment" })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
