// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import { CliInputError, parseJsonDocument } from "../../packages/cli/src/io/json-input.js";

const limits = Object.freeze({
  maxBytes: 1024,
  maxDepth: 8,
  maxProperties: 8,
  maxArray: 8,
});

void test("phase 9 parser rejects duplicate keys at every object depth", () => {
  assert.throws(
    () => parseJsonDocument('{"record":{"id":"one","id":"two"}}', limits),
    (error: unknown) => error instanceof CliInputError && error.code === "JSON_DUPLICATE_KEY",
  );
  const parsed = parseJsonDocument('{"__proto__":{"polluted":true}}', limits);
  assert.equal(Object.prototype.hasOwnProperty.call({}, "polluted"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(parsed, "__proto__"), true);
});

void test("phase 9 parser preserves valid JSON values and rejects trailing data", () => {
  const value = parseJsonDocument(
    '{"name":"\u00e1","integer":-12,"fraction":1.5,"exp":2e3,"empty":null}',
    limits,
  );
  assert.deepEqual(value, {
    name: "á",
    integer: -12,
    fraction: 1.5,
    exp: 2000,
    empty: null,
  });
  assert.throws(
    () => parseJsonDocument("true false", limits),
    (error: unknown) => error instanceof CliInputError && error.code === "JSON_SYNTAX_INVALID",
  );
});

void test("phase 9 parser enforces structural limits", () => {
  assert.throws(
    () => parseJsonDocument('{"a":{"b":{"c":{"d":{"e":1}}}}}', { ...limits, maxDepth: 3 }),
    (error: unknown) => error instanceof CliInputError && error.code === "INPUT_LIMIT_EXCEEDED",
  );
  assert.throws(
    () => parseJsonDocument("[1,2,3]", { ...limits, maxArray: 2 }),
    (error: unknown) => error instanceof CliInputError && error.code === "INPUT_LIMIT_EXCEEDED",
  );
  assert.throws(
    () => parseJsonDocument('{"a":1,"b":2,"c":3}', { ...limits, maxProperties: 2 }),
    (error: unknown) => error instanceof CliInputError && error.code === "INPUT_LIMIT_EXCEEDED",
  );
});
