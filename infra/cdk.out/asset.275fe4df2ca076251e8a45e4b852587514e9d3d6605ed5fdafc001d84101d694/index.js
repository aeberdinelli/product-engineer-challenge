"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../api/node_modules/schemy-ts/dist/index.js
var require_dist = __commonJS({
  "../api/node_modules/schemy-ts/dist/index.js"(exports2) {
    "use strict";
    var __awaiter = exports2 && exports2.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Schemy = void 0;
    var Schemy2 = class _Schemy {
      constructor(schema, settings = {}) {
        this.schemaParsed = false;
        _Schemy.triggerEvent.call(this, "beforeParse", schema);
        if (!this.schemaParsed) {
          for (var [key, properties] of Object.entries(schema)) {
            if (key !== "required" && !(properties || {}).type) {
              if (typeof properties === "function") {
                schema[key] = { type: properties, required: true };
              } else if (typeof properties === "object") {
                try {
                  const parsed = {};
                  if (schema[key].custom) {
                    const { custom } = schema[key];
                    parsed.custom = custom;
                  }
                  parsed.type = new _Schemy(properties);
                  parsed.required = !!properties.required;
                  schema[key] = parsed;
                } catch (err) {
                  throw `Could not parse property ${key} as schema`;
                }
              }
            } else if (typeof properties.type === "function") {
              if (["boolean", "string", "number", "object", "function"].indexOf(typeof properties.type()) === -1) {
                throw `Unsupported type on ${key}: ${typeof properties.type()}`;
              }
              if (typeof properties.type() !== "string" && (properties.enum || properties.regex)) {
                throw `Invalid schema for ${key}: regex and enum can be set only for strings`;
              }
            } else if (typeof properties.type === "string" && ["uuid/v1", "uuid/v4"].indexOf(properties.type) === -1) {
              throw `Unsupported type on ${key}: ${properties.type}`;
            } else if (typeof properties.type === "object" && Array.isArray(properties.type)) {
              if (properties.type.length > 1) {
                throw `Invalid schema for ${key}. Array items must be declared of any type, or just one type: [String], [Number]`;
              }
              if (typeof properties.type[0] === "object") {
                const [arrayItem] = properties.type;
                if (typeof arrayItem.validate === "undefined") {
                  properties.type[0] = new _Schemy(properties.type[0]);
                }
              }
            } else if (typeof properties.type === "object" && !(properties.type instanceof _Schemy)) {
              try {
                const parsed = {};
                if (schema[key].custom) {
                  const { custom } = schema[key];
                  parsed.custom = custom;
                }
                parsed.type = new _Schemy(properties.type);
                parsed.required = !!properties.required;
                schema[key] = parsed;
              } catch (err) {
              }
            }
          }
        }
        _Schemy.triggerEvent.call(this, "afterParse", schema);
        this.validationErrors = [];
        this.flex = settings.strict === false;
        this.data = null;
        this.schema = schema;
      }
      /**
       * Extend Schemy functionality with plugins
       *
       * @param plugins Array of plugins or just one plugin
       */
      static extend(plugins) {
        plugins = Array.isArray(plugins) ? plugins : [plugins];
        _Schemy.plugins = [
          ..._Schemy.plugins || [],
          ...plugins.map((plugin) => {
            plugin.Schemy = _Schemy;
            return plugin;
          })
        ];
        _Schemy.triggerEvent.call(this, "pluginsInitialized", plugins);
      }
      // Get current version
      static getVersion() {
        return "1.6.2";
      }
      /**
       * Creates a Schemy instance with typed non strict Schema
       *
       * @param schema Schema object
       * @param settings Schemy options
       * @returns Schema object
       */
      static schema(schema) {
        return new _Schemy(schema, { strict: false });
      }
      /**
       * Creates a Schemy instance with typed strict Schema
       *
       * @param schema Schema object
       * @returns Schema object
       */
      static strict(schema) {
        return new _Schemy(schema, { strict: true });
      }
      /**
       * Invokes the plugin callbacks for the event
       *
       * @param event Event to trigger
       * @param body Object to pass as a parameter to the plugin
       */
      static triggerEvent(event, body) {
        if (_Schemy.plugins && _Schemy.plugins.length > 0) {
          for (var plugin of _Schemy.plugins) {
            if (typeof plugin[event] === "function") {
              plugin[event].call(this, body);
            }
          }
        }
      }
      /**
       * Async validates an object against a schema and returns the body
       *
       * @param body Object to validate
       * @param schema Schemy instance or raw schema to validate against to
       * @param includeAll Include properties not declared in schema, defaults to false
       * @param orderBody Order the body based on the schema, defaults to false
       */
      static validate(body, schema, includeAll = false, orderBody = false) {
        return __awaiter(this, void 0, void 0, function* () {
          if (!(schema instanceof _Schemy)) {
            schema = new _Schemy(schema);
          }
          if (schema.validate(body)) {
            return schema.getBody(includeAll, orderBody);
          }
          throw schema.getValidationErrors();
        });
      }
      /**
       * Add error to the validation errors array
       *
       * @param key Key of the property that failed validation
       * @param message Default message for this key and specific error
       */
      pushError({ key, message }) {
        const properties = key in this.schema ? this.schema[key] : {};
        this.validationErrors.push({ key, message: properties.message || message });
      }
      /**
       * Validates data against this schema
       * If you also want the input data, use the static validate method instead
       *
       * @param data Object to validate agains the schema
       * @returns True if validated correctly, false otherwise
       */
      validate(data) {
        this.validationErrors = [];
        this.data = data;
        _Schemy.triggerEvent.call(this, "beforeValidate", data);
        if (!data || typeof data !== "object") {
          throw "Data passed to validate is incorrect. It must be an object.";
        }
        if (!this.flex) {
          Object.keys(data).forEach((key2) => {
            if (!this.schema[key2]) {
              this.pushError({ key: key2, message: `Property ${key2} not valid in schema` });
            }
          });
        }
        for (var [key, properties] of Object.entries(this.schema)) {
          if (typeof properties.default !== "undefined" && properties.default !== null) {
            if (typeof properties.default === "function") {
              try {
                data[key] = properties.default();
              } catch (e) {
              }
            } else if (["string", "number"].indexOf(typeof properties.default) !== -1) {
              data[key] = properties.default;
            }
          }
          if (!!properties.required && (data[key] === null || data[key] === void 0)) {
            this.pushError({ key, message: `Missing required property ${key}` });
            continue;
          }
          if (typeof data[key] === "undefined") {
            continue;
          }
          if (properties.custom) {
            const customValidationResult = properties.custom(data[key], data, this.schema);
            if (typeof customValidationResult === "string") {
              this.pushError({ key, message: customValidationResult });
            } else if (customValidationResult !== true) {
              this.pushError({ key, message: `Custom validation failed for property ${key}` });
            }
          }
          if (properties.type) {
            if (properties.type instanceof _Schemy && !properties.type.validate(data[key])) {
              this.validationErrors = [
                ...this.validationErrors,
                ...[{
                  key,
                  message: properties.type.getValidationErrors().map((error) => error.replace("roperty ", `roperty ${key}.`))
                }]
              ];
            } else if (properties.type === Date) {
              if (["string", "number"].indexOf(typeof data[key]) === -1 || isNaN(Date.parse(data[key]))) {
                this.pushError({ key, message: `Property ${key} is not a valid date` });
              }
            } else if (typeof properties.type === "function") {
              if (typeof data[key] !== typeof properties.type()) {
                this.pushError({
                  key,
                  message: `Property ${key} is ${typeof data[key]}, expected ${typeof properties.type()}`
                });
              } else if (typeof properties.type() === "string") {
                if (properties.enum && properties.enum.indexOf(data[key]) === -1) {
                  this.pushError({
                    key,
                    message: `Value of property ${key} does not contain an acceptable value`
                  });
                }
                if (properties.regex && !properties.regex.test(data[key])) {
                  this.pushError({ key, message: `Regex validation failed for property ${key}` });
                }
                if (typeof properties.min !== "undefined" && data[key].length < properties.min) {
                  this.pushError({ key, message: `Property ${key} must contain at least ${properties.min} characters` });
                }
                if (typeof properties.max !== "undefined" && data[key].length > properties.max) {
                  this.pushError({ key, message: `Property ${key} must contain less than ${properties.max} characters` });
                }
              } else if (typeof properties.type() === "number") {
                if (typeof properties.min !== "undefined" && data[key] < properties.min) {
                  this.pushError({ key, message: `Property ${key} must be greater than ${properties.min}` });
                }
                if (typeof properties.max !== "undefined" && data[key] > properties.max) {
                  this.pushError({ key, message: `Property ${key} must be less than ${properties.max}` });
                }
              }
            } else if (properties.type === "uuid/v1" && !/([a-z0-9]){8}-([a-z0-9]){4}-([a-z0-9]{4})-([a-z0-9]{4})-([a-z0-9]{12})/.test(data[key])) {
              this.pushError({ key, message: `Property ${key} is not a valid uuid/v1` });
            } else if (properties.type === "uuid/v4" && !/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i.test(data[key])) {
              this.pushError({ key, message: `Property ${key} is not a valid uuid/v4` });
            } else if (typeof properties.type === "object" && Array.isArray(properties.type)) {
              if (!Array.isArray(data[key])) {
                this.pushError({ key, message: `Property ${key} is ${typeof data[key]}, expected array` });
                continue;
              }
              if (typeof properties.min !== "undefined" && data[key].length < properties.min) {
                this.pushError({ key, message: `Property ${key} must contain at least ${properties.min} elements` });
              }
              if (typeof properties.max !== "undefined" && data[key].length > properties.max) {
                this.pushError({ key, message: `Property ${key} must contain no more than ${properties.max} elements` });
              } else if (properties.type.length === 1 && properties.type[0] instanceof _Schemy) {
                const [schema] = properties.type;
                if (data[key].some((item) => !schema.validate(item))) {
                  this.pushError({ key, message: `An item in array of property ${key} is not valid` });
                }
                continue;
              } else if (properties.type.length === 1 && data[key].some((item) => typeof item !== typeof properties.type[0]())) {
                this.pushError({
                  key,
                  message: `An item in array of property ${key} is not valid. All items must be of type ${typeof properties.type[0]()}`
                });
              }
            }
          }
        }
        _Schemy.triggerEvent.call(this, "afterValidate", data);
        return this.validationErrors.length === 0;
      }
      /**
       * Get all the validation errors from the last validation
       *
       * @returns Array with string of errors
       */
      getValidationErrors() {
        if (this.validationErrors === null) {
          throw "You need to call .validate() before .getValidationErrors()";
        }
        _Schemy.triggerEvent.call(this, "getValidationErrors", null);
        return this.validationErrors.map((error) => error.message).flat();
      }
      getGroupedValidationErrors() {
        if (this.validationErrors === null) {
          throw "You need to call .validate() before .getValidationErrors()";
        }
        _Schemy.triggerEvent.call(this, "getGroupedValidationErrors", null);
        return this.validationErrors;
      }
      /**
       * Get the data provided in the last validation
       *
       * @param includeAll Include properties not declared in schema
       * @param orderBody Order the body based on the schema
       * @returns Last validated data
       */
      getBody(includeAll = false, orderBody = true) {
        let output = Object.assign({}, this.data);
        let ordered = {};
        if (this.flex && !includeAll) {
          Object.keys(output).forEach((key) => {
            if (!this.schema[key]) {
              delete output[key];
            }
          });
        }
        if (!orderBody) {
          return output;
        }
        for (const key in this.schema) {
          if (typeof output[key] !== "undefined") {
            ordered[key] = output[key];
            delete output[key];
          }
        }
        for (const key in output) {
          ordered[key] = output[key];
        }
        return ordered;
      }
    };
    exports2.Schemy = Schemy2;
  }
});

// ../api/createPsychiatrist.ts
var createPsychiatrist_exports = {};
__export(createPsychiatrist_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(createPsychiatrist_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");

// ../api/node_modules/uuid/dist/esm/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// ../api/node_modules/uuid/dist/esm/rng.js
var import_crypto = require("crypto");
var rnds8Pool = new Uint8Array(256);
var poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    (0, import_crypto.randomFillSync)(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}

// ../api/node_modules/uuid/dist/esm/native.js
var import_crypto2 = require("crypto");
var native_default = { randomUUID: import_crypto2.randomUUID };

// ../api/node_modules/uuid/dist/esm/v4.js
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default = v4;

// ../api/createPsychiatrist.ts
var import_schemy_ts = __toESM(require_dist());
var client = new import_client_dynamodb.DynamoDBClient({});
var ScheduleSchema = {
  day: {
    type: String,
    required: true,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  },
  startTime: {
    type: String,
    required: true,
    regex: /^([0-1]\d|2[0-3]):([0-5]\d)$/
  },
  endTime: {
    type: String,
    required: true,
    regex: /^([0-1]\d|2[0-3]):([0-5]\d)$/
  }
};
var PsychiatristSchema = new import_schemy_ts.Schemy({
  name: {
    type: String,
    required: true,
    min: 2,
    max: 100
  },
  email: {
    type: String,
    required: true,
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    min: 5,
    max: 100
  },
  schedule: {
    type: [ScheduleSchema],
    required: true
  },
  specialty: {
    type: String,
    required: true,
    min: 3,
    max: 50
  }
});
var handler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing body" })
      };
    }
    const body = JSON.parse(event.body);
    if (!PsychiatristSchema.validate(body)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid input",
          details: PsychiatristSchema.validationErrors
        })
      };
    }
    const id = v4_default();
    await client.send(new import_client_dynamodb.PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        PK: { S: `PSYCHIATRIST#${id}` },
        SK: { S: "PROFILE" },
        GSI1PK: { S: `SPECIALTY#${body.specialty}` },
        GSI1SK: { S: `PSYCHIATRIST#${id}` },
        name: { S: body.name },
        specialty: { S: body.specialty },
        email: { S: body.email },
        schedule: {
          L: body.schedule.map((s) => ({
            M: {
              day: { S: s.day },
              startTime: { S: s.startTime },
              endTime: { S: s.endTime }
            }
          }))
        }
      }
    }));
    return {
      statusCode: 201,
      body: JSON.stringify({ id, name: body.name, specialty: body.specialty })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create psychiatrist" })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
