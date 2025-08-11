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

// ../api/approveAppointment.ts
var approveAppointment_exports = {};
__export(approveAppointment_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(approveAppointment_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var ddb = new import_client_dynamodb.DynamoDBClient({});
var handler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing appointment id" })
      };
    }
    await ddb.send(
      new import_client_dynamodb.UpdateItemCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          PK: { S: `APPOINTMENT#${id}` },
          SK: { S: "PROFILE" }
        },
        // prevent double approve
        UpdateExpression: "SET #s = :approved",
        ConditionExpression: "#s = :pending",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":pending": { S: "PENDING" },
          ":approved": { S: "APPROVED" }
        }
      })
    );
    return {
      statusCode: 200,
      body: JSON.stringify({ id, status: "APPROVED" })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Failed to approve appointment" })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
