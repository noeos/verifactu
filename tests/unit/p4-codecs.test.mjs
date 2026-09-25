import assert from "node:assert/strict";
import test from "node:test";
import {
  decodeJson,
  encodeCanonicalJson,
} from "../../evidence/runs/artifacts/build/verifactu/dist/contracts/staged-codec.js";
import { createConfiguration as configure } from "../../evidence/runs/artifacts/build/verifactu/dist/contracts/configuration.js";

const schema = { required: ["id", "kind"], optional: ["memo"] };
const bytes = (value) => new TextEncoder().encode(value);

test("staged JSON decoding rejects syntax and UTF-8 errors without partial output", () => {
  assert.equal(
    decodeJson(Uint8Array.from([0xc3, 0x28]), schema).status,
    "invalid",
  );
  assert.equal(decodeJson(bytes('{"id":'), schema).status, "invalid");
  assert.equal(decodeJson(bytes("{}{}"), schema).status, "invalid");
  for (const malformed of [
    '{"id" "a","kind":"alta"}',
    '{"id":"a",}',
    '{"id":"a" "kind":"alta"}',
    '{"id":"a","kind":"alta","memo":"bad\nline"}',
  ])
    assert.equal(decodeJson(bytes(malformed), schema).status, "invalid");
  assert.equal(
    decodeJson(bytes('\ufeff{"id":"a","kind":"alta"}'), schema).diagnostics[0]
      .stage,
    "utf8",
  );
  assert.equal(
    decodeJson(bytes('{"id":"a\\q","kind":"alta"}'), schema).status,
    "invalid",
  );
  assert.equal(
    decodeJson(bytes('{"id":"unterminated'), schema).status,
    "invalid",
  );
  assert.equal(
    decodeJson(bytes('{"id":"a","kind":"alta","amount":1.25}'), {
      ...schema,
      optional: ["amount"],
    }).diagnostics[0].code,
    "DIAG-JSON-NUMBER",
  );
  assert.equal(
    decodeJson(bytes('{"id":"a","kind":"alta","count":9007199254740992}'), {
      ...schema,
      optional: ["count"],
    }).diagnostics[0].code,
    "DIAG-JSON-NUMBER",
  );
});

test("closed object schema rejects duplicate, unknown and missing members", () => {
  assert.equal(
    decodeJson(bytes('{"id":"a","id":"b","kind":"alta"}'), schema)
      .diagnostics[0].code,
    "DIAG-JSON-DUPLICATE",
  );
  assert.equal(
    decodeJson(bytes('{"id":"a","kind":"alta","other":1}'), schema)
      .diagnostics[0].code,
    "DIAG-JSON-UNKNOWN",
  );
  assert.equal(
    decodeJson(bytes('{"id":"a"}'), schema).diagnostics[0].code,
    "DIAG-JSON-REQUIRED",
  );
  assert.equal(decodeJson(bytes("[]"), schema).status, "invalid");
  assert.equal(decodeJson(bytes("null"), schema).status, "invalid");
  assert.equal(
    decodeJson(
      bytes('{"id":"a","kind":"alta","memo":[true,false,null,1,{},[]]}'),
      schema,
    ).status,
    "ok",
  );
  const good = bytes('{"id":"a","kind":"alta"}');
  assert.equal(
    decodeJson(good, { ...schema, validateStructure: () => false })
      .diagnostics[0].stage,
    "structure",
  );
  assert.equal(
    decodeJson(good, { ...schema, validateDomain: () => false }).diagnostics[0]
      .stage,
    "domain",
  );
  assert.equal(
    decodeJson(good, { ...schema, validateEdition: () => false }).diagnostics[0]
      .stage,
    "edition",
  );
  assert.equal(
    decodeJson(good, {
      ...schema,
      validateEdition: () => {
        throw new Error("sensitive error text");
      },
    }).status,
    "invalid",
  );
  assert.doesNotMatch(
    JSON.stringify(
      decodeJson(bytes('{"secret!":"x","id":"a","kind":"alta"}'), schema),
    ),
    /secret!/u,
  );
  assert.doesNotMatch(
    JSON.stringify(
      decodeJson(bytes('{"a/b":"x","id":"a","kind":"alta"}'), schema),
    ),
    /a\/b/u,
  );
});

test("codec enforces limits and emits schema-ordered LF terminated JSON", () => {
  assert.equal(
    decodeJson(bytes('{"id":"a","kind":"alta"}'), schema, {
      maxBytes: 4,
      maxDepth: 2,
      maxNodes: 20,
      maxStringLength: 5,
    }).diagnostics[0].stage,
    "bytes",
  );
  const encoded = encodeCanonicalJson({ kind: "alta", id: "a" }, [
    "id",
    "kind",
  ]);
  assert.equal(encoded.status, "ok");
  assert.equal(
    new TextDecoder().decode(encoded.value),
    '{"id":"a","kind":"alta"}\n',
  );
  assert.equal(
    encodeCanonicalJson({ id: "a", extra: true }, ["id"]).status,
    "invalid",
  );
  assert.equal(
    encodeCanonicalJson({ id: undefined }, ["id"]).status,
    "invalid",
  );
  assert.equal(
    encodeCanonicalJson({ 1: "first", id: "a" }, ["1", "id"]).status,
    "invalid",
  );
  assert.equal(
    encodeCanonicalJson({ id: "a" }, ["id", "id"]).status,
    "invalid",
  );
  assert.equal(encodeCanonicalJson({ id: 1n }, ["id"]).status, "invalid");
  assert.equal(
    decodeJson(bytes('{"id":"a","kind":"alta","memo":"long"}'), schema, {
      maxBytes: 64,
      maxDepth: 4,
      maxNodes: 10,
      maxStringLength: 3,
    }).diagnostics[0].code,
    "DIAG-JSON-LIMIT",
  );
  assert.equal(
    decodeJson(bytes('{"id":"a","kind":"alta","memo":[[]]}'), schema, {
      maxBytes: 64,
      maxDepth: 1,
      maxNodes: 10,
      maxStringLength: 8,
    }).diagnostics[0].code,
    "DIAG-JSON-LIMIT",
  );
  assert.equal(
    decodeJson(bytes('{"id":"a","kind":"alta"}'), schema, {
      maxBytes: 64,
      maxDepth: 8,
      maxNodes: 2,
      maxStringLength: 8,
    }).diagnostics[0].code,
    "DIAG-JSON-LIMIT",
  );
});

test("P4-FUZZ-001 bounds and replays 4096 staged codec byte inputs", () => {
  const seed = 0x50444601;
  let state = seed >>> 0;
  for (let index = 0; index < 4096; index += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const length = state % 257;
    const input = new Uint8Array(length);
    for (let offset = 0; offset < length; offset += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      input[offset] = state >>> 24;
    }
    const result = decodeJson(input, schema, {
      maxBytes: 256,
      maxDepth: 8,
      maxNodes: 64,
      maxStringLength: 128,
    });
    assert(
      result.status === "ok" || result.status === "invalid",
      `P4-FUZZ-001 seed=${seed} case=${index}`,
    );
  }
});

test("edition configuration cannot enable record creation", () => {
  const base = {
    creationAllowed: false,
    editionId: "rrsif-candidate",
    maxInputBytes: 1_048_576,
  };
  assert.equal(configure(base).status, "ok");
  assert.equal(configure({ ...base, creationAllowed: true }).status, "invalid");
  assert.equal(
    configure({ ...base, maxInputBytes: Number.MAX_SAFE_INTEGER }).status,
    "invalid",
  );
  assert.equal(configure({ ...base, editionId: "" }).status, "invalid");
  assert.equal(configure({ ...base, maxInputBytes: 0 }).status, "invalid");
  assert.equal(configure({ ...base, maxInputBytes: 1.5 }).status, "invalid");
});
