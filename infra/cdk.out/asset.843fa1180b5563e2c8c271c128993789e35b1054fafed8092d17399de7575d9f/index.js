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
var handler = async () => {
  try {
    const result = await client.send(new import_client_dynamodb.ScanCommand({
      TableName: process.env.TABLE_NAME,
      FilterExpression: "SK = :profile",
      ExpressionAttributeValues: {
        ":profile": { S: "PROFILE" }
      }
    }));
    const psychiatrists = result.Items?.map((item) => (0, import_util_dynamodb.unmarshall)(item)) || [];
    return {
      statusCode: 200,
      body: JSON.stringify(psychiatrists)
    };
  } catch (err) {
    console.error(err);
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
