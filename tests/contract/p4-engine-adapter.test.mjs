import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  BUILTIN_PROFILES,
  RECORD_EVIDENCE_SCHEMA,
  createEngine,
} from "@noeos/verification-engine";
import { createVerificationClaimSet } from "../../evidence/runs/artifacts/build/verifactu/dist/verification/claims.js";
import {
  canonicalEngineProfileJson,
  createEngineNormalizationProfile,
  createEngineProfileProjection,
  isEngineProfileProjection,
  ENGINE_PROFILE_ID,
  ENGINE_PROFILE_LIMITS,
  ENGINE_PROFILE_MANIFEST,
  ENGINE_PROFILE_TEST_VECTORS,
  ENGINE_PROFILE_VECTOR_SHA256,
} from "../../evidence/runs/artifacts/build/verifactu/dist/verification/engine-profile.js";
import {
  createNoeosEngineEvidence,
  verifyNoeosEngineEvidence,
} from "../../evidence/runs/artifacts/build/verifactu/dist/verification/engine-adapter.js";

const artifactDigest = `sha256:${"a".repeat(64)}`;
const claimSet = createVerificationClaimSet([
  {
    kind: "official-format",
    status: "valid",
    evidenceDigest: artifactDigest,
    diagnostics: [],
  },
  {
    kind: "cryptographic",
    status: "indeterminate",
    diagnostics: ["DIAG-CRYPTO-UNKNOWN"],
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

test("P4-CB-033 profile vectors bind canonical genesis and linked projections", () => {
  const corpus = ENGINE_PROFILE_TEST_VECTORS.map(({ name, projection }) => {
    const canonical = canonicalEngineProfileJson(projection);
    assert.equal(canonical.status, "ok");
    return `${name}\n${canonical.value}\n`;
  }).join("");
  const vectorSha256 = createHash("sha256").update(corpus).digest("hex");
  assert.equal(vectorSha256, ENGINE_PROFILE_VECTOR_SHA256);
  assert.equal(ENGINE_PROFILE_MANIFEST.vectorSha256, vectorSha256);
  assert.equal(ENGINE_PROFILE_MANIFEST.name, ENGINE_PROFILE_ID);
  assert.equal(ENGINE_PROFILE_MANIFEST.version, "1.0.0");
  assert.deepEqual(ENGINE_PROFILE_MANIFEST.limits, ENGINE_PROFILE_LIMITS);
});

test("P4-FUZZ-006 Engine evidence adapter is total on 4096 malformed variants", (t) => {
  const seed = 0x50444606;
  const projection = ENGINE_PROFILE_TEST_VECTORS[1].projection;
  const malformedEvidence = [
    null,
    undefined,
    false,
    0,
    "not-evidence",
    [],
    {},
    { $schema: "urn:unknown", protocolVersion: 1 },
    { $schema: RECORD_EVIDENCE_SCHEMA, protocolVersion: 1, extra: true },
  ];
  const enginePort = Object.freeze({
    createEngine() {
      return Object.freeze({});
    },
  });
  const corpus = createHash("sha256");
  for (let index = 0; index < 4096; index += 1) {
    const evidence = malformedEvidence[index % malformedEvidence.length];
    const input = {
      ...projection,
      claims: claimSet,
      position: index % 1_000_001,
    };
    corpus.update(
      JSON.stringify({
        seed,
        index,
        input,
        evidence: evidence === undefined ? "<undefined>" : evidence,
      }),
    );
    const result = verifyNoeosEngineEvidence(input, evidence, enginePort);
    assert.ok(
      result.status === "ok" || result.status === "invalid",
      `seed=${seed} case=${index} status=${result.status}`,
    );
    if (result.status === "ok") {
      assert.equal(result.value.kind, "noeos-evidence", `case=${index}`);
      assert.ok(
        ["invalid", "unsupported", "indeterminate"].includes(
          result.value.status,
        ),
        `seed=${seed} case=${index} evidence must fail closed`,
      );
      assert.doesNotMatch(JSON.stringify(result), /not-evidence/u);
    }
  }
  t.diagnostic(
    `P4-FUZZ-006 executions=4096 seed=${seed} discards=0 corpusSha256=${corpus.digest("hex")} minimizedFailures=0`,
  );
});

test("engine evidence rejects null shaped record and chain summaries", () => {
  const linkedProjection = ENGINE_PROFILE_TEST_VECTORS.find(
    ({ projection }) => projection.predecessorEvidenceDigest !== null,
  ).projection;
  const linkedInput = { ...linkedProjection, claims: claimSet };
  const generatedRecord = createNoeosEngineEvidence(linkedInput);
  assert.equal(generatedRecord.status, "ok");
  const recordEvidence = generatedRecord.value.recordEvidence;
  assert.equal(
    verifyNoeosEngineEvidence(linkedInput, recordEvidence).value.status,
    "valid",
  );
  const recordPort = {
    createEngine() {
      return {
        verifyRecord: () => ({ status: "valid", evidence: recordEvidence }),
        digestEvidence: () => ({
          ok: true,
          value: { algorithm: "sha-256", toHex: () => "a".repeat(64) },
        }),
      };
    },
  };
  const malformedRecords = [
    { ...recordEvidence, extra: true },
    { ...recordEvidence, protocolVersion: 2 },
    { ...recordEvidence, contextId: "opaque:wrong" },
    { ...recordEvidence, recordId: "opaque:wrong" },
    { ...recordEvidence, profile: { ...recordEvidence.profile, id: "other" } },
    { ...recordEvidence, profile: { ...recordEvidence.profile, version: "2" } },
    {
      ...recordEvidence,
      profile: Object.assign([], recordEvidence.profile),
    },
    { ...recordEvidence, algorithm: "sha-512" },
    { ...recordEvidence, normalizedByteLength: Number.MAX_SAFE_INTEGER + 1 },
    { ...recordEvidence, normalizedByteLength: 0 },
    { ...recordEvidence, normalizedByteLength: 65_537 },
    { ...recordEvidence, contentDigest: 1 },
    { ...recordEvidence, contentDigest: "bad" },
    { ...recordEvidence, recordDigest: 1 },
    { ...recordEvidence, recordDigest: "bad" },
  ];
  for (const malformed of malformedRecords) {
    const rejected = verifyNoeosEngineEvidence(
      linkedInput,
      malformed,
      recordPort,
    );
    assert.equal(rejected.status, "ok");
    assert.equal(rejected.value.status, "invalid");
  }
  const arrayShapedRecord = Object.assign([], recordEvidence);
  const rejectedArrayRecord = verifyNoeosEngineEvidence(
    linkedInput,
    arrayShapedRecord,
    recordPort,
  );
  assert.equal(rejectedArrayRecord.status, "ok");
  assert.equal(rejectedArrayRecord.value.status, "invalid");
  const hostileRecordEvidence = new Proxy(recordEvidence, {
    ownKeys() {
      throw new Error("private record evidence detail");
    },
  });
  const rejectedHostileRecord = verifyNoeosEngineEvidence(
    linkedInput,
    hostileRecordEvidence,
    recordPort,
  );
  assert.equal(rejectedHostileRecord.status, "ok");
  assert.equal(rejectedHostileRecord.value.status, "invalid");
  const exactRecordBoundary = {
    ...recordEvidence,
    normalizedByteLength: 65_536,
  };
  assert.equal(
    verifyNoeosEngineEvidence(linkedInput, exactRecordBoundary, recordPort)
      .value.status,
    "valid",
  );
  for (const [engineStatus, claimStatus] of [
    ["aborted", "indeterminate"],
    ["indeterminate", "indeterminate"],
    ["invalid", "invalid"],
    ["unsupported", "unsupported"],
  ]) {
    const result = verifyNoeosEngineEvidence(linkedInput, recordEvidence, {
      createEngine() {
        return {
          verifyRecord: () => ({
            status: engineStatus,
            evidence: recordEvidence,
            diagnostics: [{ code: "EVIDENCE_SCHEMA_INVALID" }],
          }),
          digestEvidence: () => ({
            ok: true,
            value: { algorithm: "sha-256", toHex: () => "a".repeat(64) },
          }),
        };
      },
    });
    assert.equal(result.status, "ok");
    assert.equal(result.value.status, claimStatus);
  }
  for (const digestResult of [
    { ok: false, diagnostics: [] },
    { ok: true, value: null },
    { ok: true, value: { algorithm: "sha-512", toHex: () => "a".repeat(64) } },
    { ok: true, value: { algorithm: "sha-256", toHex: "not-a-function" } },
    { ok: true, value: { algorithm: "sha-256", toHex: () => "bad" } },
  ]) {
    const rejected = verifyNoeosEngineEvidence(linkedInput, recordEvidence, {
      createEngine() {
        return {
          verifyRecord: () => ({
            status: "valid",
            evidence: recordEvidence,
            diagnostics: [],
          }),
          digestEvidence: () => digestResult,
        };
      },
    });
    assert.equal(rejected.status, "ok");
    assert.equal(rejected.value.status, "unsupported");
  }
  const invalidEngineRecord = verifyNoeosEngineEvidence(
    linkedInput,
    recordEvidence,
    {
      createEngine() {
        return {
          verifyRecord: () => ({
            status: "valid",
            evidence: { ...recordEvidence, protocolVersion: 2 },
            diagnostics: [],
          }),
          digestEvidence: () => ({
            ok: true,
            value: { algorithm: "sha-256", toHex: () => "a".repeat(64) },
          }),
        };
      },
    },
  );
  assert.equal(invalidEngineRecord.status, "ok");
  assert.equal(invalidEngineRecord.value.status, "unsupported");

  const malformedRecord = createNoeosEngineEvidence(linkedInput, {
    createEngine() {
      return {
        hashRecord: () => ({ ok: true, value: null, diagnostics: [] }),
      };
    },
  });
  assert.equal(malformedRecord.status, "ok");
  assert.equal(malformedRecord.value.recordEvidence, undefined);
  assert.equal(
    malformedRecord.value.claims.claims.find(
      ({ kind }) => kind === "noeos-evidence",
    ).status,
    "invalid",
  );
  const genesisProjection = ENGINE_PROFILE_TEST_VECTORS[0].projection;
  const genesisInput = { ...genesisProjection, claims: claimSet };
  const generated = createNoeosEngineEvidence(genesisInput);
  assert.equal(generated.status, "ok");
  const linkEvidence = generated.value.linkEvidence;
  const malformedAppendedEvidence = createNoeosEngineEvidence(genesisInput, {
    createEngine() {
      return {
        createChain() {
          return {
            append: () => ({ ok: true, value: null, diagnostics: [] }),
            finalize: () => ({
              ok: true,
              value: generated.value.chainSummary,
              diagnostics: [],
            }),
          };
        },
      };
    },
  });
  assert.equal(malformedAppendedEvidence.status, "ok");
  assert.equal(malformedAppendedEvidence.value.linkEvidence, undefined);
  assert.equal(
    malformedAppendedEvidence.value.claims.claims.find(
      ({ kind }) => kind === "noeos-evidence",
    ).status,
    "invalid",
  );
  const linkPort = {
    createEngine() {
      return {
        verifyChain: () => ({
          status: "valid",
          evidence: generated.value.chainSummary,
          diagnostics: [],
        }),
        digestEvidence: () => ({
          ok: true,
          value: { algorithm: "sha-256", toHex: () => "a".repeat(64) },
        }),
      };
    },
  };
  const constrainedChain = createNoeosEngineEvidence(genesisInput, {
    createEngine() {
      return {
        createChain(options) {
          assert.equal(options.allowEmpty, false);
          return {
            append: () => ({
              ok: true,
              value: linkEvidence,
              diagnostics: [],
            }),
            finalize: () => ({
              ok: true,
              value: generated.value.chainSummary,
              diagnostics: [],
            }),
          };
        },
        verifyChain: () => ({
          status: "valid",
          evidence: generated.value.chainSummary,
          diagnostics: [],
        }),
        digestEvidence: () => ({
          ok: true,
          value: { algorithm: "sha-256", toHex: () => "a".repeat(64) },
        }),
      };
    },
  });
  assert.equal(constrainedChain.status, "ok");
  assert.equal(constrainedChain.value.linkEvidence, linkEvidence);
  const malformedFinalizedEvidence = createNoeosEngineEvidence(genesisInput, {
    createEngine() {
      return {
        createChain() {
          return {
            append: () => ({
              ok: true,
              value: linkEvidence,
              diagnostics: [],
            }),
            finalize: () => ({ ok: true, value: null, diagnostics: [] }),
          };
        },
        verifyChain: () => ({
          status: "valid",
          evidence: generated.value.chainSummary,
          diagnostics: [],
        }),
        digestEvidence: () => ({
          ok: true,
          value: { algorithm: "sha-256", toHex: () => "a".repeat(64) },
        }),
      };
    },
  });
  assert.equal(malformedFinalizedEvidence.status, "ok");
  assert.equal(malformedFinalizedEvidence.value.chainSummary, undefined);
  assert.equal(
    malformedFinalizedEvidence.value.claims.claims.find(
      ({ kind }) => kind === "noeos-evidence",
    ).status,
    "invalid",
  );
  const unavailableEngine = createNoeosEngineEvidence(genesisInput, {
    createEngine() {
      throw new Error("private Engine setup detail");
    },
  });
  assert.equal(unavailableEngine.status, "ok");
  assert.equal(unavailableEngine.value.kind, undefined);
  assert.equal(
    unavailableEngine.value.claims.claims.find(
      ({ kind }) => kind === "noeos-evidence",
    ).status,
    "indeterminate",
  );
  assert.equal(
    verifyNoeosEngineEvidence(genesisInput, linkEvidence, linkPort).value
      .status,
    "valid",
  );
  const malformedLinks = [
    { ...linkEvidence, extra: true },
    { ...linkEvidence, protocolVersion: 2 },
    { ...linkEvidence, contextId: "opaque:wrong" },
    { ...linkEvidence, sequenceId: "opaque:wrong" },
    { ...linkEvidence, recordId: "opaque:wrong" },
    { ...linkEvidence, profile: { ...linkEvidence.profile, id: "other" } },
    { ...linkEvidence, profile: { ...linkEvidence.profile, version: "2" } },
    { ...linkEvidence, profile: Object.assign([], linkEvidence.profile) },
    { ...linkEvidence, algorithm: "sha-512" },
    { ...linkEvidence, normalizedByteLength: Number.MAX_SAFE_INTEGER + 1 },
    { ...linkEvidence, normalizedByteLength: 0 },
    { ...linkEvidence, normalizedByteLength: 65_537 },
    { ...linkEvidence, contentDigest: 1 },
    { ...linkEvidence, contentDigest: "bad" },
    { ...linkEvidence, recordDigest: 1 },
    { ...linkEvidence, recordDigest: "bad" },
    { ...linkEvidence, position: 1 },
    { ...linkEvidence, previous: undefined },
    { ...linkEvidence, previous: { kind: "digest" } },
    { ...linkEvidence, previous: { kind: "digest", value: "bad" } },
    { ...linkEvidence, previous: { kind: "none", extra: true } },
    { ...linkEvidence, linkDigest: 1 },
    { ...linkEvidence, linkDigest: "bad" },
  ];
  for (const malformed of malformedLinks) {
    const rejected = verifyNoeosEngineEvidence(
      genesisInput,
      malformed,
      linkPort,
    );
    assert.equal(rejected.status, "ok");
    assert.equal(rejected.value.status, "invalid");
  }
  const exactLinkBoundary = {
    ...linkEvidence,
    normalizedByteLength: 65_536,
  };
  assert.equal(
    verifyNoeosEngineEvidence(genesisInput, exactLinkBoundary, linkPort).value
      .status,
    "valid",
  );
  const arrayShapedLink = Object.assign([], linkEvidence);
  const rejectedArrayLink = verifyNoeosEngineEvidence(
    genesisInput,
    arrayShapedLink,
    linkPort,
  );
  assert.equal(rejectedArrayLink.status, "ok");
  assert.equal(rejectedArrayLink.value.status, "invalid");
  const hostileLinkEvidence = new Proxy(linkEvidence, {
    ownKeys() {
      throw new Error("private link evidence detail");
    },
  });
  const rejectedHostileLink = verifyNoeosEngineEvidence(
    genesisInput,
    hostileLinkEvidence,
    linkPort,
  );
  assert.equal(rejectedHostileLink.status, "ok");
  assert.equal(rejectedHostileLink.value.status, "invalid");

  const linkedPredecessor = linkedProjection.predecessorEvidenceDigest.slice(
    "sha256:".length,
  );
  const linkedLinkEvidence = {
    ...linkEvidence,
    contextId: linkedProjection.contextId,
    sequenceId: linkedProjection.sequenceId,
    recordId: linkedProjection.recordId,
    position: linkedProjection.position,
    previous: { kind: "digest", value: linkedPredecessor },
  };
  const linkedSummary = {
    ...generated.value.chainSummary,
    contextId: linkedProjection.contextId,
    sequenceId: linkedProjection.sequenceId,
    firstPosition: linkedProjection.position,
    lastPosition: linkedProjection.position,
    finalLinkDigest: linkedLinkEvidence.linkDigest,
  };
  const linkedEnginePort = {
    createEngine() {
      return {
        verifyChain: () => ({
          status: "valid",
          evidence: linkedSummary,
          diagnostics: [],
        }),
        digestEvidence: () => ({
          ok: true,
          value: { algorithm: "sha-256", toHex: () => "a".repeat(64) },
        }),
      };
    },
  };
  for (const previous of [
    { kind: "digest", value: "b".repeat(64) },
    { kind: "digest", value: linkedPredecessor, extra: true },
  ]) {
    const rejected = verifyNoeosEngineEvidence(
      linkedInput,
      { ...linkedLinkEvidence, previous },
      linkedEnginePort,
    );
    assert.equal(rejected.status, "ok");
    assert.equal(rejected.value.status, "invalid");
  }
  for (const [input, evidence, expectedMode, expectedPrevious, summary] of [
    [
      genesisInput,
      linkEvidence,
      "complete",
      { kind: "none" },
      generated.value.chainSummary,
    ],
    [
      linkedInput,
      linkedLinkEvidence,
      "fragment",
      { kind: "digest", value: linkedPredecessor },
      linkedSummary,
    ],
  ]) {
    let observed;
    const result = verifyNoeosEngineEvidence(input, evidence, {
      createEngine() {
        return {
          verifyChain: (request) => {
            observed = request;
            return { status: "valid", evidence: summary, diagnostics: [] };
          },
          digestEvidence: () => ({
            ok: true,
            value: { algorithm: "sha-256", toHex: () => "a".repeat(64) },
          }),
        };
      },
    });
    assert.equal(result.status, "ok");
    assert.equal(result.value.status, "valid");
    assert.equal(observed.mode, expectedMode);
    assert.deepEqual(observed.expectedPrevious, expectedPrevious);
  }

  const invalidClaims = verifyNoeosEngineEvidence(
    { ...genesisInput, claims: [] },
    linkEvidence,
  );
  assert.equal(invalidClaims.status, "invalid");
  const hiddenClaimsInput = new Proxy(genesisInput, {
    has(target, key) {
      return key === "claims" ? false : Reflect.has(target, key);
    },
  });
  const hiddenClaims = verifyNoeosEngineEvidence(
    hiddenClaimsInput,
    linkEvidence,
    linkPort,
  );
  assert.equal(hiddenClaims.status, "invalid");
  const hiddenNestedClaims = new Proxy(
    { claims: claimSet.claims },
    {
      has(target, key) {
        return key === "claims" ? false : Reflect.has(target, key);
      },
    },
  );
  const hiddenNestedClaimResult = verifyNoeosEngineEvidence(
    { ...genesisInput, claims: hiddenNestedClaims },
    linkEvidence,
    linkPort,
  );
  assert.equal(hiddenNestedClaimResult.status, "invalid");

  const malformedChain = verifyNoeosEngineEvidence(
    genesisInput,
    generated.value.linkEvidence,
    {
      createEngine() {
        return {
          verifyChain: () => ({
            status: "valid",
            evidence: null,
            diagnostics: [],
          }),
          digestEvidence: () => ({
            ok: true,
            value: { algorithm: "sha-256", toHex: () => "a".repeat(64) },
          }),
        };
      },
    },
  );
  assert.equal(malformedChain.status, "ok");
  assert.equal(malformedChain.value.status, "unsupported");
  const arrayShapedSummary = Object.assign([], generated.value.chainSummary);
  const rejectedArraySummary = verifyNoeosEngineEvidence(
    genesisInput,
    linkEvidence,
    {
      createEngine() {
        return {
          verifyChain: () => ({
            status: "valid",
            evidence: arrayShapedSummary,
            diagnostics: [],
          }),
          digestEvidence: () => ({
            ok: true,
            value: { algorithm: "sha-256", toHex: () => "a".repeat(64) },
          }),
        };
      },
    },
  );
  assert.equal(rejectedArraySummary.status, "ok");
  assert.equal(rejectedArraySummary.value.status, "unsupported");
  const hostileSummary = new Proxy(generated.value.chainSummary, {
    get(target, key, receiver) {
      if (key === "$schema") throw new Error("private summary detail");
      return Reflect.get(target, key, receiver);
    },
  });
  const rejectedHostileSummary = verifyNoeosEngineEvidence(
    genesisInput,
    linkEvidence,
    {
      createEngine() {
        return {
          verifyChain: () => ({
            status: "valid",
            evidence: hostileSummary,
            diagnostics: [],
          }),
          digestEvidence: () => ({
            ok: true,
            value: { algorithm: "sha-256", toHex: () => "a".repeat(64) },
          }),
        };
      },
    },
  );
  assert.equal(rejectedHostileSummary.status, "ok");
  assert.equal(rejectedHostileSummary.value.status, "unsupported");

  for (const [engineStatus, claimStatus] of [
    ["aborted", "indeterminate"],
    ["indeterminate", "indeterminate"],
    ["invalid", "invalid"],
    ["unsupported", "unsupported"],
  ]) {
    const diagnostic = { code: "EVIDENCE_SCHEMA_INVALID" };
    const result = verifyNoeosEngineEvidence(genesisInput, linkEvidence, {
      createEngine() {
        return {
          verifyChain: () => ({
            status: engineStatus,
            evidence: generated.value.chainSummary,
            diagnostics: [diagnostic],
          }),
          digestEvidence: () => ({
            ok: true,
            value: { algorithm: "sha-256", toHex: () => "a".repeat(64) },
          }),
        };
      },
    });
    assert.equal(result.status, "ok");
    assert.equal(result.value.status, claimStatus);
    assert.deepEqual(result.value.diagnostics, [
      "DIAG-ENGINE-EVIDENCE_SCHEMA_INVALID",
    ]);
  }
  const unrecognizedDiagnostic = verifyNoeosEngineEvidence(
    genesisInput,
    linkEvidence,
    {
      createEngine() {
        return {
          verifyChain: () => ({
            status: "invalid",
            evidence: generated.value.chainSummary,
            diagnostics: [{ code: "PRIVATE_ENGINE_DETAIL" }],
          }),
          digestEvidence: () => ({ ok: false, diagnostics: [] }),
        };
      },
    },
  );
  assert.equal(unrecognizedDiagnostic.status, "ok");
  assert.equal(unrecognizedDiagnostic.value.status, "invalid");
  assert.deepEqual(unrecognizedDiagnostic.value.diagnostics, [
    "DIAG-ENGINE-VERIFY-FAILED",
  ]);
  for (const digestResult of [
    { ok: false, diagnostics: [] },
    { ok: true, value: null },
    { ok: true, value: { algorithm: "sha-512", toHex: () => "a".repeat(64) } },
    { ok: true, value: { algorithm: "sha-256", toHex: "not-a-function" } },
    { ok: true, value: { algorithm: "sha-256", toHex: () => "bad" } },
  ]) {
    const rejected = verifyNoeosEngineEvidence(genesisInput, linkEvidence, {
      createEngine() {
        return {
          verifyChain: () => ({
            status: "valid",
            evidence: generated.value.chainSummary,
            diagnostics: [],
          }),
          digestEvidence: () => digestResult,
        };
      },
    });
    assert.equal(rejected.status, "ok");
    assert.equal(rejected.value.status, "unsupported");
  }

  const malformedSummaries = [
    { ...generated.value.chainSummary, $schema: "urn:unknown" },
    { ...generated.value.chainSummary, protocolVersion: 2 },
    { ...generated.value.chainSummary, contextId: "opaque:wrong" },
    { ...generated.value.chainSummary, sequenceId: "opaque:wrong" },
    {
      ...generated.value.chainSummary,
      profile: { ...generated.value.chainSummary.profile, id: "other" },
    },
    {
      ...generated.value.chainSummary,
      profile: { ...generated.value.chainSummary.profile, version: "2" },
    },
    {
      ...generated.value.chainSummary,
      profile: Object.assign([], generated.value.chainSummary.profile),
    },
    { ...generated.value.chainSummary, algorithm: "sha-512" },
    { ...generated.value.chainSummary, count: 2 },
    { ...generated.value.chainSummary, firstPosition: 1 },
    { ...generated.value.chainSummary, lastPosition: 1 },
    { ...generated.value.chainSummary, finalLinkDigest: "a".repeat(64) },
    { ...generated.value.chainSummary, status: "invalid" },
  ];
  for (const summary of malformedSummaries) {
    const rejected = verifyNoeosEngineEvidence(genesisInput, linkEvidence, {
      createEngine() {
        return {
          verifyChain: () => ({
            status: "valid",
            evidence: summary,
            diagnostics: [],
          }),
          digestEvidence: () => ({
            ok: true,
            value: { algorithm: "sha-256", toHex: () => "a".repeat(64) },
          }),
        };
      },
    });
    assert.equal(rejected.status, "ok");
    assert.equal(rejected.value.status, "unsupported");
  }
});

test("profile projection binds ordered artifact digests and only opaque identities", () => {
  const vector = ENGINE_PROFILE_TEST_VECTORS[1].projection;
  const nullPrototypeProjection = Object.assign(Object.create(null), vector);
  assert.equal(isEngineProfileProjection(nullPrototypeProjection), true);
  const result = createEngineProfileProjection({ ...vector, claims: claimSet });
  assert.equal(result.status, "ok");
  assert.deepEqual(result.value, vector);
  assert.equal(
    createEngineProfileProjection({
      ...vector,
      schema: vector.schema,
      claims: claimSet,
    }).status,
    "ok",
    "an explicitly supplied exact schema remains accepted",
  );
  const { schema: _schema, ...projectionWithoutSchema } = vector;
  assert.equal(
    createEngineProfileProjection({
      ...projectionWithoutSchema,
      claims: claimSet,
    }).status,
    "ok",
    "the schema field remains optional",
  );
  assert.equal(Object.isFrozen(result.value), true);
  assert.equal(Object.isFrozen(result.value.artifacts), true);
  assert.equal(
    createEngineProfileProjection({
      ...vector,
      artifacts: [...vector.artifacts].reverse(),
      claims: claimSet,
    }).status,
    "invalid",
  );
  assert.equal(
    createEngineProfileProjection({
      ...vector,
      taxpayerId: "ES12345678",
      claims: claimSet,
    }).status,
    "invalid",
  );
  assert.equal(
    createEngineProfileProjection({
      ...vector,
      contextId: "ES12345678",
      claims: claimSet,
    }).status,
    "invalid",
  );
  assert.equal(
    createEngineProfileProjection({
      ...vector,
      claims: createVerificationClaimSet([
        {
          kind: "official-format",
          status: "indeterminate",
          diagnostics: ["DIAG-UNVERIFIED"],
        },
        ...claimSet.claims.slice(1),
      ]).value,
    }).status,
    "invalid",
  );
});

test("custom profile uses public Engine APIs without substituting its generic JCS built-in", () => {
  assert.equal(
    BUILTIN_PROFILES.some(({ id }) => id === ENGINE_PROFILE_ID),
    false,
  );
  const profile = createEngineNormalizationProfile();
  const engine = createEngine({ profiles: [profile] });
  for (const { projection } of ENGINE_PROFILE_TEST_VECTORS) {
    const input = {
      contextId: projection.contextId,
      recordId: projection.recordId,
      payload: projection,
      profile: { id: ENGINE_PROFILE_ID, version: "1.0.0" },
      algorithm: "sha-256",
    };
    const hashed = engine.hashRecord(input);
    assert.equal(hashed.ok, true);
    const verified = engine.verifyRecord({
      payload: projection,
      evidence: hashed.value,
    });
    assert.equal(verified.status, "valid");
    assert.deepEqual(verified.evidence, hashed.value);
  }
});

test("profile refuses fiscal plaintext, extra fields, malformed order and unsafe numbers", () => {
  const profile = createEngineNormalizationProfile();
  const projection = ENGINE_PROFILE_TEST_VECTORS[0].projection;
  assert.equal(profile.validate(projection, ENGINE_PROFILE_LIMITS).ok, true);
  assert.equal(
    profile.validate(
      { ...projection, taxpayerId: "ES12345678" },
      ENGINE_PROFILE_LIMITS,
    ).ok,
    false,
  );
  assert.equal(
    canonicalEngineProfileJson({ ...projection, order: 1e40 }).status,
    "invalid",
  );
});

test("profile projection validates every identifier, artifact, predecessor, and algorithm boundary", () => {
  const projection = ENGINE_PROFILE_TEST_VECTORS[1].projection;
  assert.equal(
    isEngineProfileProjection({ ...projection, position: 1_000_000 }),
    true,
  );
  const malformed = [
    { schema: "other" },
    { artifacts: [42] },
    { contextId: "plain-context" },
    { sequenceId: "plain-sequence" },
    { recordId: "plain-record" },
    { editionId: "bad edition" },
    { operationKind: "unknown" },
    { position: -1 },
    { position: 1_000_001 },
    { position: Number.MAX_SAFE_INTEGER + 1 },
    { artifacts: null },
    { artifacts: [] },
    { artifacts: [null] },
    {
      artifacts: Array.from({ length: 17 }, (_, order) => ({
        order,
        kind: "xml",
        digest: artifactDigest,
      })),
    },
    { artifacts: [{ order: 1, kind: "xml", digest: artifactDigest }] },
    { artifacts: [{ order: 0, kind: "unknown", digest: artifactDigest }] },
    { artifacts: [{ order: 0, kind: "xml", digest: "bad" }] },
    {
      artifacts: [
        { order: 0, kind: "xml", digest: artifactDigest, extra: true },
      ],
    },
    {
      artifacts: [
        { order: 0, kind: "xml", digest: artifactDigest },
        { order: 1, kind: "xml", digest: artifactDigest },
      ],
    },
    { predecessorEvidenceDigest: "bad" },
    { algorithmIds: [] },
    { algorithmIds: Array.from({ length: 9 }, (_, index) => `alg-${index}`) },
    { algorithmIds: ["INVALID"] },
    { algorithmIds: ["sha-512", "sha-256"] },
    { algorithmIds: ["sha-256", "sha-256"] },
  ];
  for (const overrides of malformed) {
    assert.equal(
      isEngineProfileProjection({ ...projection, ...overrides }),
      false,
      JSON.stringify(overrides),
    );
  }
  assert.equal(isEngineProfileProjection(Object.assign([], projection)), false);
  assert.equal(
    isEngineProfileProjection({
      ...projection,
      algorithmIds: ["a", "b", "c", "d", "e", "f", "g", "h"],
    }),
    true,
  );

  const input = {
    ...projection,
    claims: claimSet,
  };
  assert.equal(
    createEngineProfileProjection({ ...input, position: 1_000_000 }).status,
    "ok",
  );
  for (const invalidInput of [
    { ...input, unexpected: true },
    { ...input, schema: "unknown" },
    { ...input, position: -1 },
    { ...input, claims: [] },
    { ...input, claims: { claims: "not-an-array" } },
  ]) {
    assert.equal(createEngineProfileProjection(invalidInput).status, "invalid");
  }
});

test("profile normalization reports bounded success and rejects invalid canonical bytes", () => {
  const profile = createEngineNormalizationProfile();
  const projection = ENGINE_PROFILE_TEST_VECTORS[0].projection;
  let written;
  const sink = {
    byteLength: 0,
    write(bytes) {
      written = bytes.slice();
    },
  };
  const normalized = profile.normalize(projection, sink, ENGINE_PROFILE_LIMITS);
  assert.equal(normalized.ok, true);
  assert.equal(normalized.value.byteLength, written.byteLength);
  assert.ok(written.byteLength > 0);
  assert.equal(
    profile.normalize(projection, sink, {
      ...ENGINE_PROFILE_LIMITS,
      maxPayloadBytes: written.byteLength,
    }).ok,
    true,
  );
  assert.equal(
    profile.normalize(projection, sink, {
      ...ENGINE_PROFILE_LIMITS,
      maxPayloadBytes: 1,
    }).ok,
    false,
  );
  assert.equal(
    profile.normalize(
      { ...projection, operationKind: "unknown" },
      sink,
      ENGINE_PROFILE_LIMITS,
    ).ok,
    false,
  );
});

test("P4-CB-033 profile boundaries contain hostile proxies and sink failures", () => {
  const profile = createEngineNormalizationProfile();
  const throwingPrototype = new Proxy(
    ENGINE_PROFILE_TEST_VECTORS[0].projection,
    {
      getPrototypeOf() {
        throw new Error("private proxy detail");
      },
    },
  );
  assert.equal(
    createEngineProfileProjection(throwingPrototype).status,
    "invalid",
  );
  assert.equal(profile.validate(throwingPrototype).ok, false);

  const vector = ENGINE_PROFILE_TEST_VECTORS[0].projection;
  const throwingField = new Proxy(vector, {
    get(target, key, receiver) {
      if (key === "schema") throw new Error("private projection getter");
      return Reflect.get(target, key, receiver);
    },
  });
  assert.equal(isEngineProfileProjection(throwingField), false);
  let contextReads = 0;
  const throwingCanonical = new Proxy(vector, {
    get(target, key, receiver) {
      if (key === "contextId" && ++contextReads > 2)
        throw new Error("private canonical getter");
      return Reflect.get(target, key, receiver);
    },
  });
  assert.equal(canonicalEngineProfileJson(throwingCanonical).status, "invalid");

  const artifact = new Proxy(vector.artifacts[0], {
    ownKeys() {
      throw new Error("private artifact detail");
    },
  });
  assert.equal(
    isEngineProfileProjection({ ...vector, artifacts: [artifact] }),
    false,
  );
  const throwingGetter = new Proxy(vector.artifacts[0], {
    get(target, key, receiver) {
      if (key === "order") throw new Error("private artifact getter");
      return Reflect.get(target, key, receiver);
    },
  });
  assert.equal(
    createEngineProfileProjection({
      ...vector,
      artifacts: [throwingGetter],
      claims: claimSet,
    }).status,
    "invalid",
  );

  const result = profile.normalize(
    vector,
    {
      byteLength: 0,
      write() {
        throw new Error("private sink detail");
      },
    },
    ENGINE_PROFILE_LIMITS,
  );
  assert.equal(result.ok, false);
  assert.doesNotMatch(JSON.stringify(result), /private sink detail/u);
});
