import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { BUILTIN_PROFILES, createEngine } from "@noeos/verification-engine";
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

test("profile projection binds ordered artifact digests and only opaque identities", () => {
  const vector = ENGINE_PROFILE_TEST_VECTORS[1].projection;
  const result = createEngineProfileProjection({ ...vector, claims: claimSet });
  assert.equal(result.status, "ok");
  assert.deepEqual(result.value, vector);
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
