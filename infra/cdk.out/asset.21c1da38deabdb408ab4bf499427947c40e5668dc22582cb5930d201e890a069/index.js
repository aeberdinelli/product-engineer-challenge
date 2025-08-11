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

// ../api/listPsychiatrists.ts
var listPsychiatrists_exports = {};
__export(listPsychiatrists_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(listPsychiatrists_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_util_dynamodb = require("@aws-sdk/util-dynamodb");
var client = new import_client_dynamodb.DynamoDBClient({});
var handler = async (event) => {
  try {
    const specialty = event.queryStringParameters?.specialty;
    const appointmentType = event.queryStringParameters?.appointmentType;
    const command = specialty && specialty.trim().length > 0 ? new import_client_dynamodb.QueryCommand({
      TableName: process.env.TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :specialtyKey",
      ExpressionAttributeValues: {
        ":specialtyKey": { S: `SPECIALTY#${specialty}` }
      }
    }) : new import_client_dynamodb.ScanCommand({
      TableName: process.env.TABLE_NAME,
      // Only psychiatrist profiles (avoid appointments)
      FilterExpression: "begins_with(PK, :psy) AND SK = :profile",
      ExpressionAttributeValues: {
        ":psy": { S: "PSYCHIATRIST#" },
        ":profile": { S: "PROFILE" }
      }
    });
    const response = await client.send(command);
    let psychiatrists = (response.Items || []).map((rawItem) => (0, import_util_dynamodb.unmarshall)(rawItem)).filter((item) => {
      const pk = String(item.PK ?? "");
      const sk = String(item.SK ?? "");
      return pk.startsWith("PSYCHIATRIST#") && sk === "PROFILE";
    }).map((item) => {
      const id = String(item.PK).replace("PSYCHIATRIST#", "");
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
        return Array.isArray(psychiatrist.servicesOffered) && psychiatrist.servicesOffered.includes(appointmentType);
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
      body: JSON.stringify({ error: "Failed to list psychiatrists" })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
