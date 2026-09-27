import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { createEngine, BUILTIN_PROFILES } from "@noeos/verification-engine";
import { SCHEMA_ASSETS } from "@noeos/verification-engine/schemas";
import { VECTOR_SET } from "@noeos/verification-engine/vectors";
import {
  createVerificationClaimSet,
  getVerificationClaim,
} from "../../evidence/runs/artifacts/build/verifactu/dist/verification/claims.js";
import {
  createNoeosEngineEvidence,
  verifyNoeosEngineEvidence,
} from "../../evidence/runs/artifacts/build/verifactu/dist/verification/engine-adapter.js";
import {
  createEngineNormalizationProfile,
  createEngineProfileProjection,
  ENGINE_PROFILE_ID,
  ENGINE_PROFILE_VERSION,
  ENGINE_PROFILE_TEST_VECTORS,
} from "../../evidence/runs/artifacts/build/verifactu/dist/verification/engine-profile.js";

const d = (char) => `sha256:${char.repeat(64)}`;
const opaque = (char) => `opaque:${char.repeat(64)}`;
function claims() {
  return createVerificationClaimSet([
    {
      kind: "official-format",
      status: "valid",
      evidenceDigest: d("a"),
      diagnostics: [],
    },
    {
      kind: "cryptographic",
      status: "valid",
      evidenceDigest: d("b"),
      diagnostics: [],
    },
    {
      kind: "certificate-authorization",
      status: "indeterminate",
      diagnostics: ["DIAG-CERT-UNKNOWN"],
    },
    {
      kind: "aeat",
      status: "unsupported",
      diagnostics: ["DIAG-AEAT-UNSUPPORTED"],
    },
    {
      kind: "noeos-evidence",
      status: "indeterminate",
      diagnostics: ["DIAG-NOEOS-PENDING"],
    },
  ]).value;
}
function request(overrides = {}) {
  return {
    contextId: opaque("0"),
    sequenceId: opaque("1"),
    recordId: opaque("2"),
    editionId: "rrsif-2026-09-21-active",
    operationKind: "alta",
    artifacts: [{ order: 0, kind: "xml", digest: d("a") }],
    predecessorEvidenceDigest: null,
    algorithmIds: ["sha-256"],
    claims: claims(),
    position: 0,
    ...overrides,
  };
}

test("P4-CB-034 public Engine tarball profile emits and independently verifies exact evidence", () => {
  assert.equal(typeof createEngine, "function");
  assert.equal(Array.isArray(BUILTIN_PROFILES), true);
  assert.equal(typeof SCHEMA_ASSETS, "object");
  assert.equal(VECTOR_SET.protocolVersion, 1);

  const input = request();
  const result = createNoeosEngineEvidence(input);
  assert.equal(result.status, "ok");
  assert.equal(
    getVerificationClaim(result.value.claims, "noeos-evidence").status,
    "valid",
  );
  assert.equal(
    getVerificationClaim(result.value.claims, "certificate-authorization")
      .status,
    "indeterminate",
  );
  assert.equal(
    getVerificationClaim(result.value.claims, "aeat").status,
    "unsupported",
  );
  assert.equal(result.value.linkEvidence.profile.id, ENGINE_PROFILE_ID);
  assert.equal(
    result.value.linkEvidence.profile.version,
    ENGINE_PROFILE_VERSION,
  );
  assert.equal(result.value.chainSummary.status, "valid");
  assert.equal(
    result.value.chainSummary.finalLinkDigest,
    result.value.linkEvidence.linkDigest,
  );

  const verified = verifyNoeosEngineEvidence(input, result.value.linkEvidence);
  assert.equal(verified.status, "ok");
  assert.equal(verified.value.status, "valid");
});

test("Engine evidence validators reject altered link and record evidence fields", () => {
  const genesisInput = request();
  const genesis = createNoeosEngineEvidence(genesisInput);
  assert.equal(genesis.status, "ok");
  const link = genesis.value.linkEvidence;
  const badLinks = [
    { ...link, $schema: "wrong" },
    { ...link, protocolVersion: 2 },
    { ...link, contextId: opaque("9") },
    { ...link, sequenceId: opaque("9") },
    { ...link, recordId: opaque("9") },
    { ...link, profile: { ...link.profile, id: "wrong" } },
    { ...link, profile: { ...link.profile, version: "2.0.0" } },
    { ...link, algorithm: "sha-512" },
    { ...link, normalizedByteLength: 0 },
    { ...link, normalizedByteLength: 65_537 },
    { ...link, contentDigest: "invalid" },
    { ...link, recordDigest: "invalid" },
    { ...link, position: 1 },
    { ...link, previous: { kind: "digest", value: "a".repeat(64) } },
    { ...link, previous: { kind: "none", extra: true } },
    { ...link, linkDigest: "invalid" },
    { ...link, extra: true },
  ];
  for (const evidence of badLinks) {
    const result = verifyNoeosEngineEvidence(genesisInput, evidence);
    assert.equal(result.status, "ok");
    assert.equal(result.value.status, "invalid");
  }

  const linkedInput = request({
    predecessorEvidenceDigest: d("d"),
    position: 1,
  });
  const linked = createNoeosEngineEvidence(linkedInput);
  assert.equal(linked.status, "ok");
  const record = linked.value.recordEvidence;
  const badRecords = [
    { ...record, $schema: "wrong" },
    { ...record, protocolVersion: 2 },
    { ...record, contextId: opaque("9") },
    { ...record, recordId: opaque("9") },
    { ...record, profile: { ...record.profile, id: "wrong" } },
    { ...record, profile: { ...record.profile, version: "2.0.0" } },
    { ...record, algorithm: "sha-512" },
    { ...record, normalizedByteLength: 0 },
    { ...record, normalizedByteLength: 65_537 },
    { ...record, contentDigest: "invalid" },
    { ...record, recordDigest: "invalid" },
    { ...record, extra: true },
  ];
  for (const evidence of badRecords) {
    const result = verifyNoeosEngineEvidence(linkedInput, evidence);
    assert.equal(result.status, "ok");
    assert.equal(result.value.status, "invalid");
  }
  for (const hashResult of [
    {
      ok: false,
      diagnostics: [{ code: "PROFILE_UNKNOWN" }],
    },
    { ok: true, value: {}, diagnostics: [] },
  ]) {
    const hashFailurePort = {
      createEngine(options) {
        const engine = createEngine(options);
        return new Proxy(engine, {
          get(target, key, receiver) {
            if (key === "hashRecord") return () => hashResult;
            return Reflect.get(target, key, receiver);
          },
        });
      },
    };
    const result = createNoeosEngineEvidence(linkedInput, hashFailurePort);
    assert.equal(result.status, "ok");
    const noeos = getVerificationClaim(result.value.claims, "noeos-evidence");
    assert.equal(noeos.status, "invalid");
    assert.match(noeos.diagnostics[0], /^DIAG-ENGINE-/u);
  }

  const summary = genesis.value.chainSummary;
  const badSummaries = [
    { ...summary, $schema: "wrong" },
    { ...summary, protocolVersion: 2 },
    { ...summary, contextId: opaque("9") },
    { ...summary, sequenceId: opaque("9") },
    { ...summary, profile: { ...summary.profile, id: "wrong" } },
    { ...summary, profile: { ...summary.profile, version: "2.0.0" } },
    { ...summary, algorithm: "sha-512" },
    { ...summary, count: 2 },
    { ...summary, firstPosition: 1 },
    { ...summary, lastPosition: 1 },
    { ...summary, finalLinkDigest: d("f") },
    { ...summary, status: "invalid" },
  ];
  for (const alteredSummary of badSummaries) {
    const summaryPort = {
      createEngine(options) {
        const engine = createEngine(options);
        return new Proxy(engine, {
          get(target, key, receiver) {
            if (key === "createChain")
              return () => ({
                append: () => ({
                  ok: true,
                  value: link,
                  diagnostics: [],
                }),
                finalize: () => ({
                  ok: true,
                  value: alteredSummary,
                  diagnostics: [],
                }),
              });
            return Reflect.get(target, key, receiver);
          },
        });
      },
    };
    const result = createNoeosEngineEvidence(genesisInput, summaryPort);
    assert.equal(result.status, "ok");
    assert.equal(
      getVerificationClaim(result.value.claims, "noeos-evidence").status,
      "invalid",
    );
  }
});

test("Engine verification claims preserve invalid, indeterminate, unsupported, and digest failures", () => {
  const input = request();
  const created = createNoeosEngineEvidence(input);
  assert.equal(created.status, "ok");
  for (const [status, expected, code] of [
    ["invalid", "invalid", "CHAIN_PREDECESSOR_MISMATCH"],
    ["indeterminate", "indeterminate", "EVIDENCE_SCHEMA_INVALID"],
    ["unsupported", "unsupported", "PROFILE_UNKNOWN"],
  ]) {
    const port = {
      createEngine(options) {
        const engine = createEngine(options);
        return new Proxy(engine, {
          get(target, key, receiver) {
            if (key === "verifyChain")
              return () => ({
                status,
                diagnostics: [{ code }],
                evidence: undefined,
                stats: {},
                boundaries: { start: "unverified", end: "unverified" },
                verificationMode: "fragment",
              });
            return Reflect.get(target, key, receiver);
          },
        });
      },
    };
    const result = verifyNoeosEngineEvidence(
      input,
      created.value.linkEvidence,
      port,
    );
    assert.equal(result.status, "ok");
    assert.equal(result.value.status, expected);
    assert.equal(result.value.diagnostics[0], `DIAG-ENGINE-${code}`);
  }

  const digestFailurePort = {
    createEngine(options) {
      const engine = createEngine(options);
      return new Proxy(engine, {
        get(target, key, receiver) {
          if (key === "digestEvidence")
            return () => ({ ok: false, diagnostics: [] });
          return Reflect.get(target, key, receiver);
        },
      });
    },
  };
  const digestFailure = verifyNoeosEngineEvidence(
    input,
    created.value.linkEvidence,
    digestFailurePort,
  );
  assert.equal(digestFailure.status, "ok");
  assert.equal(digestFailure.value.status, "unsupported");
  assert.equal(digestFailure.value.diagnostics[0], "DIAG-ENGINE-UNSUPPORTED");
});

test("P4-CB-034 installed Engine package exposes the admitted CommonJS API", () => {
  const require = createRequire(import.meta.url);
  const entry = require.resolve("@noeos/verification-engine");
  const packageRoot = resolve(dirname(entry), "../../");
  const manifest = JSON.parse(
    readFileSync(resolve(packageRoot, "package.json"), "utf8"),
  );
  assert.equal(manifest.name, "@noeos/verification-engine");
  assert.equal(manifest.version, "1.0.1");
  const cjs = require("@noeos/verification-engine");
  assert.equal(typeof cjs.createEngine, "function");
  const engine = cjs.createEngine({
    profiles: [createEngineNormalizationProfile()],
  });
  assert.equal(typeof engine.hashRecord, "function");
  assert.equal(typeof engine.verifyRecord, "function");
  assert.equal(typeof engine.createChain, "function");
  assert.equal(typeof engine.verifyChain, "function");
  assert.equal(typeof engine.digestEvidence, "function");
  for (const { projection } of ENGINE_PROFILE_TEST_VECTORS) {
    const input = {
      contextId: projection.contextId,
      recordId: projection.recordId,
      payload: projection,
      profile: { id: ENGINE_PROFILE_ID, version: ENGINE_PROFILE_VERSION },
      algorithm: "sha-256",
    };
    const hashed = engine.hashRecord(input);
    assert.equal(hashed.ok, true);
    assert.equal(
      engine.verifyRecord({ payload: projection, evidence: hashed.value })
        .status,
      "valid",
    );
  }
});

test("linked records bind the expected predecessor and position", () => {
  const previous = d("d");
  const input = request({
    recordId: opaque("3"),
    operationKind: "anulacion",
    predecessorEvidenceDigest: previous,
    position: 1,
  });
  const created = createNoeosEngineEvidence(input);
  assert.equal(created.status, "ok");
  assert.equal(created.value.linkEvidence, undefined);
  assert.equal(created.value.recordEvidence.profile.id, ENGINE_PROFILE_ID);
  assert.equal(created.value.recordEvidence.recordId, input.recordId);
  assert.equal(
    getVerificationClaim(created.value.claims, "noeos-evidence").status,
    "valid",
  );
  const wrongPredecessor = request({
    recordId: opaque("3"),
    operationKind: "anulacion",
    predecessorEvidenceDigest: d("e"),
    position: 1,
  });
  const altered = verifyNoeosEngineEvidence(
    wrongPredecessor,
    created.value.recordEvidence,
  );
  assert.equal(altered.status, "ok");
  assert.notEqual(altered.value.status, "valid");
  const wrongPosition = verifyNoeosEngineEvidence(
    { ...input, position: 2 },
    created.value.recordEvidence,
  );
  assert.equal(wrongPosition.status, "ok");
  assert.notEqual(wrongPosition.value.status, "valid");
  assert.equal(created.value.claims.claims[3].status, "unsupported");
});

test("unknown profile, altered evidence, wrong predecessor and version mismatch fail closed", () => {
  const input = request();
  const created = createNoeosEngineEvidence(input);
  assert.equal(created.status, "ok");
  for (const evidence of [
    { ...created.value.linkEvidence, recordDigest: "0".repeat(64) },
    {
      ...created.value.linkEvidence,
      profile: { id: ENGINE_PROFILE_ID, version: "9.9.9" },
    },
    {
      ...created.value.linkEvidence,
      previous: { kind: "digest", value: "d".repeat(64) },
    },
    { ...created.value.linkEvidence, injected: "extra" },
  ]) {
    const result = verifyNoeosEngineEvidence(input, evidence);
    assert.equal(result.status, "ok");
    assert.notEqual(result.value.status, "valid");
  }
});

test("fragment evidence binds and independently verifies its predecessor", () => {
  const firstInput = request();
  const profile = createEngineNormalizationProfile();
  const engine = createEngine({ profiles: [profile] });
  const chain = engine.createChain({
    contextId: firstInput.contextId,
    sequenceId: firstInput.sequenceId,
    profile: { id: ENGINE_PROFILE_ID, version: ENGINE_PROFILE_VERSION },
    algorithm: "sha-256",
    allowEmpty: false,
  });
  const firstProjection = createEngineProfileProjection(firstInput);
  assert.equal(firstProjection.status, "ok");
  const first = chain.append({
    recordId: firstProjection.value.recordId,
    payload: firstProjection.value,
    position: 0,
    previous: { kind: "none" },
  });
  assert.equal(first.ok, true);
  const predecessorDigest = `sha256:${first.value.linkDigest}`;
  const input = request({
    recordId: opaque("3"),
    operationKind: "anulacion",
    predecessorEvidenceDigest: predecessorDigest,
    position: 1,
  });
  const projection = createEngineProfileProjection(input);
  assert.equal(projection.status, "ok");
  const candidate = chain.append({
    recordId: input.recordId,
    payload: projection.value,
    position: 1,
    previous: { kind: "digest", value: first.value.linkDigest },
  });
  assert.equal(candidate.ok, true);
  const verification = verifyNoeosEngineEvidence(input, candidate.value);
  assert.equal(verification.status, "ok");
  assert.equal(verification.value.status, "valid");

  const wrongPredecessor = verifyNoeosEngineEvidence(
    { ...input, predecessorEvidenceDigest: d("d") },
    candidate.value,
  );
  assert.equal(wrongPredecessor.status, "ok");
  assert.equal(wrongPredecessor.value.status, "invalid");

  const hostileRecord = new Proxy(
    { $schema: "urn:noeos:verification-engine:record-evidence:1" },
    {
      ownKeys() {
        throw new Error("private record evidence detail");
      },
    },
  );
  const malformed = verifyNoeosEngineEvidence(input, hostileRecord);
  assert.equal(malformed.status, "ok");
  assert.equal(malformed.value.status, "invalid");
  assert.doesNotMatch(
    JSON.stringify(malformed),
    /private record evidence detail/u,
  );
});

test("verification exceptions remain indeterminate for record and chain evidence", () => {
  const genesisInput = request();
  const genesis = createNoeosEngineEvidence(genesisInput);
  const linkedInput = request({
    recordId: opaque("3"),
    operationKind: "anulacion",
    predecessorEvidenceDigest: d("d"),
    position: 1,
  });
  const linked = createNoeosEngineEvidence(linkedInput);
  const throwingPort = {
    createEngine(options) {
      const engine = createEngine(options);
      return new Proxy(engine, {
        get(target, key, receiver) {
          if (key === "verifyChain" || key === "verifyRecord")
            return () => {
              throw new Error("private verification detail");
            };
          return Reflect.get(target, key, receiver);
        },
      });
    },
  };
  for (const [input, evidence] of [
    [genesisInput, genesis.value.linkEvidence],
    [linkedInput, linked.value.recordEvidence],
  ]) {
    const result = verifyNoeosEngineEvidence(input, evidence, throwingPort);
    assert.equal(result.status, "ok");
    assert.equal(result.value.status, "indeterminate");
    assert.doesNotMatch(JSON.stringify(result), /private verification detail/u);
  }
});

test("P4-CB-035 Engine construction exceptions and aborted verification remain indeterminate", () => {
  const input = request();
  const unavailable = createNoeosEngineEvidence(input, {
    createEngine() {
      throw new Error("private detail must not escape");
    },
  });
  assert.equal(unavailable.status, "ok");
  assert.equal(
    getVerificationClaim(unavailable.value.claims, "noeos-evidence").status,
    "indeterminate",
  );
  assert.doesNotMatch(JSON.stringify(unavailable), /private detail/u);

  const created = createNoeosEngineEvidence(input);
  assert.equal(created.status, "ok");
  const abortingPort = {
    createEngine(options) {
      const engine = createEngine(options);
      return new Proxy(engine, {
        get(target, key, receiver) {
          if (key === "verifyChain")
            return () => ({
              status: "aborted",
              diagnostics: [],
              evidence: undefined,
              stats: {},
              boundaries: { start: "unverified", end: "unverified" },
              verificationMode: "fragment",
            });
          return Reflect.get(target, key, receiver);
        },
      });
    },
  };
  const aborted = verifyNoeosEngineEvidence(
    input,
    created.value.linkEvidence,
    abortingPort,
  );
  assert.equal(aborted.status, "ok");
  assert.equal(aborted.value.status, "indeterminate");
});

test("P4-CB-035 engine boundaries contain throwing proxies and private diagnostics", () => {
  const input = request();
  const created = createNoeosEngineEvidence(input);
  assert.equal(created.status, "ok");

  const malformedLink = new Proxy(
    {},
    {
      ownKeys() {
        throw new Error("private evidence detail");
      },
    },
  );
  const malformed = verifyNoeosEngineEvidence(input, malformedLink);
  assert.equal(malformed.status, "ok");
  assert.equal(malformed.value.status, "invalid");

  const privateDiagnostic = {};
  Object.defineProperty(privateDiagnostic, "code", {
    get() {
      throw new Error("private provider detail");
    },
  });
  const rejectingPort = {
    createEngine() {
      return {
        createChain() {
          return {
            append() {
              return { ok: false, diagnostics: [privateDiagnostic] };
            },
          };
        },
      };
    },
  };
  const rejected = createNoeosEngineEvidence(input, rejectingPort);
  assert.equal(rejected.status, "ok");
  assert.equal(
    getVerificationClaim(rejected.value.claims, "noeos-evidence")
      .diagnostics[0],
    "DIAG-ENGINE-APPEND-FAILED",
  );
  assert.doesNotMatch(JSON.stringify(rejected), /private provider detail/u);

  const hostileClaims = new Proxy(input, {
    get(target, key, receiver) {
      if (key === "claims") throw new Error("private claim getter");
      return Reflect.get(target, key, receiver);
    },
  });
  assert.equal(createNoeosEngineEvidence(hostileClaims).status, "invalid");
});

test("Engine summary accessor failures fail closed", () => {
  const input = request();
  const base = createNoeosEngineEvidence(input);
  assert.equal(base.status, "ok");
  const hostileSummary = new Proxy(
    {},
    {
      get() {
        throw new Error("private summary detail");
      },
    },
  );
  const port = {
    createEngine(options) {
      const engine = createEngine(options);
      return new Proxy(engine, {
        get(target, key, receiver) {
          if (key === "createChain")
            return () => ({
              append: () => ({
                ok: true,
                value: base.value.linkEvidence,
                diagnostics: [],
              }),
              finalize: () => ({
                ok: true,
                value: hostileSummary,
                diagnostics: [],
              }),
            });
          return Reflect.get(target, key, receiver);
        },
      });
    },
  };
  const result = createNoeosEngineEvidence(input, port);
  assert.equal(result.status, "ok");
  assert.equal(
    getVerificationClaim(result.value.claims, "noeos-evidence").status,
    "invalid",
  );
  assert.doesNotMatch(JSON.stringify(result), /private summary detail/u);
});

test("fiscal plaintext and oversized or noncanonical adapter inputs are rejected", () => {
  const base = request();
  assert.equal(
    createNoeosEngineEvidence({ ...base, taxpayerId: "ES12345678" }).status,
    "invalid",
  );
  assert.equal(
    createNoeosEngineEvidence({ ...base, contextId: "ES12345678" }).status,
    "invalid",
  );
  assert.equal(
    createNoeosEngineEvidence({ ...base, position: -1 }).status,
    "invalid",
  );
  assert.equal(
    createNoeosEngineEvidence({ ...base, algorithmIds: ["sha-512", "sha-256"] })
      .status,
    "invalid",
  );
  assert.equal(
    createNoeosEngineEvidence({
      ...base,
      artifacts: Array(17).fill(base.artifacts[0]),
    }).status,
    "invalid",
  );
});
