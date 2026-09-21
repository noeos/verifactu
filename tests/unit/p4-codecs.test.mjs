import assert from "node:assert/strict";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    "../../evidence/runs/artifacts/build/verifactu/dist/index.js"
);
const bytes = (value) => new TextEncoder().encode(value);
const decoder = api.objectShape(["name"], (value) =>
  typeof value.name === "string"
    ? api.succeeded(Object.freeze({ name: value.name }))
    : api.failed("invalid", [
        api.diagnostic("DIAG-TEST-DOMAIN", "input", "domain", "/name"),
      ]),
);

test("P4-CB-001 staged decoding stops at the first failed stage", () => {
  assert.equal(
    api.decodeJson(new Uint8Array([0xff]), decoder).status,
    "invalid",
  );
  assert.equal(
    api.decodeJson(bytes("{"), decoder).diagnostics[0].stage,
    "syntax",
  );
  assert.equal(
    api.decodeJson(bytes("[]"), decoder).diagnostics[0].stage,
    "structure",
  );
  assert.equal(
    api.decodeJson(bytes('{"name":1}'), decoder).diagnostics[0].stage,
    "domain",
  );
  assert.equal(
    api.decodeJson(bytes('{"name":"ok"}'), decoder).status,
    "succeeded",
  );
});

test("P4-CB-002 duplicate and unknown members fail closed", () => {
  assert.equal(
    api.decodeJson(bytes('{"name":"a","name":"b"}'), decoder).diagnostics[0]
      .code,
    "DIAG-JSON-DUPLICATE",
  );
  assert.equal(
    api.decodeJson(bytes('{"name":"a","extra":true}'), decoder).diagnostics[0]
      .code,
    "DIAG-STRUCTURE-MEMBER",
  );
});

test("resource limits are validated before syntax", () => {
  const limits = {
    maximumBytes: 1,
    maximumDepth: 1,
    maximumMembers: 1,
    maximumStringCodePoints: 1,
  };
  assert.equal(
    api.decodeJson(bytes("{}"), decoder, limits).diagnostics[0].stage,
    "bytes",
  );
});

test("JSON reader covers every supported value and bounded container", () => {
  const any = { decode: api.succeeded };
  for (const source of [
    "null",
    "true",
    "false",
    "0",
    "-1.25e+2",
    "[]",
    "[1,true,null]",
    "{}",
    '{"nested":{"value":"escaped\\ntext"}}',
  ]) {
    assert.equal(
      api.decodeJson(bytes(source), any).status,
      "succeeded",
      source,
    );
  }
  for (const source of [
    "1 trailing",
    '"unterminated',
    "undefined",
    "1e999",
    "{1:true}",
    '{"a" true}',
    '{"a":true;}',
    "[1;2]",
  ]) {
    assert.equal(api.decodeJson(bytes(source), any).status, "invalid", source);
  }
  assert.equal(
    api.decodeJson(bytes('{"a":1,"b":2}'), any, {
      ...api.DEFAULT_DECODE_LIMITS,
      maximumMembers: 1,
    }).status,
    "invalid",
  );
  assert.equal(
    api.decodeJson(bytes('"ab"'), any, {
      ...api.DEFAULT_DECODE_LIMITS,
      maximumStringCodePoints: 1,
    }).status,
    "invalid",
  );
  assert.equal(
    api.decodeJson(bytes("[[1]]"), any, {
      ...api.DEFAULT_DECODE_LIMITS,
      maximumDepth: 1,
    }).status,
    "invalid",
  );
});

test("result mapping preserves failures and maps success", () => {
  assert.equal(api.mapResult(api.succeeded(2), (value) => value * 2).value, 4);
  assert.equal(
    api.mapResult(api.failed("unavailable", []), () => 0).status,
    "unavailable",
  );
});
