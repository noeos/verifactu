import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";

export class PolicyFailure extends Error {
  constructor(code, message, details = {}) {
    super(`${code}: ${message}`);
    this.name = "PolicyFailure";
    this.code = code;
    this.details = details;
  }
}

export function fail(code, message, details) {
  throw new PolicyFailure(code, message, details);
}

export async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    fail("INVALID_JSON", `cannot read canonical JSON ${file}`, { cause: String(error) });
  }
}

export async function validateJsonFile(root, documentPath, schemaPath) {
  const document = await readJson(path.join(root, documentPath));
  const schema = await readJson(path.join(root, schemaPath));
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false, validateFormats: false });
  const validate = ajv.compile(schema);
  if (!validate(document)) {
    fail("SCHEMA_INVALID", `${documentPath} violates ${schemaPath}`, { errors: validate.errors });
  }
  return document;
}

export function assert(condition, code, message, details) {
  if (!condition) fail(code, message, details);
}

export function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, "en"));
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function stableJson(value) {
  const canonicalize = (item) => {
    if (Array.isArray(item)) return item.map(canonicalize);
    if (item !== null && typeof item === "object") {
      return Object.fromEntries(
        Object.keys(item)
          .sort()
          .map((key) => [key, canonicalize(item[key])]),
      );
    }
    return item;
  };
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

export function emitSuccess(control, evidence) {
  process.stdout.write(`${JSON.stringify({ schemaVersion: 1, control, result: "passed", evidence }, null, 2)}\n`);
}

export async function main(control, operation) {
  try {
    emitSuccess(control, await operation());
  } catch (error) {
    const failure =
      error instanceof PolicyFailure ? error : new PolicyFailure("UNEXPECTED_ERROR", String(error?.stack ?? error));
    process.stderr.write(
      `${JSON.stringify({ schemaVersion: 1, control, result: "failed", code: failure.code, message: failure.message, details: failure.details }, null, 2)}\n`,
    );
    process.exitCode = 1;
  }
}
