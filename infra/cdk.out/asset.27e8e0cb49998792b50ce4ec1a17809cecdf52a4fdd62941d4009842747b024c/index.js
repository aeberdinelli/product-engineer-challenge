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

// ../api/listAppointments.ts
var listAppointments_exports = {};
__export(listAppointments_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(listAppointments_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_util_dynamodb = require("@aws-sdk/util-dynamodb");
var ddb = new import_client_dynamodb.DynamoDBClient({});
var handler = async () => {
  try {
    const scanRes = await ddb.send(
      new import_client_dynamodb.ScanCommand({
        TableName: process.env.TABLE_NAME,
        FilterExpression: "begins_with(PK, :appt) AND SK = :profile",
        ExpressionAttributeValues: {
          ":appt": { S: "APPOINTMENT#" },
          ":profile": { S: "PROFILE" }
        }
      })
    );
    const items = (scanRes.Items || []).map((it) => (0, import_util_dynamodb.unmarshall)(it));
    const result = [];
    const psychiatristIds = /* @__PURE__ */ new Set();
    for (const a of items) {
      const id = String(a.PK).replace("APPOINTMENT#", "");
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
    const keys = Array.from(psychiatristIds).map((pid) => ({
      PK: { S: `PSYCHIATRIST#${pid}` },
      SK: { S: "PROFILE" }
    }));
    if (keys.length > 0) {
      const batchRes = await ddb.send(
        new import_client_dynamodb.BatchGetItemCommand({
          RequestItems: {
            [process.env.TABLE_NAME]: {
              Keys: keys
            }
          }
        })
      );
      const profiles = batchRes.Responses?.[process.env.TABLE_NAME]?.map((i) => (0, import_util_dynamodb.unmarshall)(i)) || [];
      const nameById = /* @__PURE__ */ new Map();
      for (const p of profiles) {
        const id = String(p.PK).replace("PSYCHIATRIST#", "");
        nameById.set(id, p.name);
      }
      for (const appt of result) {
        appt.psychiatristName = nameById.get(appt.psychiatristId);
      }
    }
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
      body: JSON.stringify({ error: "Failed to list appointments" })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
