import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  createXadesProvider,
  XADES_EDITION_ID,
  XADES_PROFILE_ID,
} from "../../internal/xades-provider/provider.mjs";
import { signEligibleArtifact } from "../../evidence/runs/artifacts/build/verifactu/dist/application/xades.js";

const artifactBytes = new TextEncoder().encode("<RegistroAlta/>");
const artifactDigestSha256 = createHash("sha256")
  .update(artifactBytes)
  .digest("hex");
const valid = {
  editionId: XADES_EDITION_ID,
  profileId: XADES_PROFILE_ID,
  targetName: "RegistroAlta",
  artifactBytes,
  artifactDigestSha256,
  signingTime: "2026-09-26T12:00:00Z",
  validationTime: "2026-09-26T12:00:00Z",
  maximumRevocationAgeSeconds: 86_400,
  trustAnchorsDer: [new Uint8Array([1])],
  crlEvidence: [new Uint8Array([2])],
  ocspEvidence: [],
};

test("provider rejects edition, digest and target mismatches before bridge execution", async () => {
  let calls = 0;
  const provider = createXadesProvider({
    execute: async () => {
      calls += 1;
      throw new Error("must not run");
    },
  });
  const edition = await provider.verify({ ...valid, editionId: "other" });
  assert.equal(edition.diagnostics[0], "DIAG-XADES-EDITION");
  const digest = await provider.verify({
    ...valid,
    artifactDigestSha256: "0".repeat(64),
  });
  assert.equal(digest.diagnostics[0], "DIAG-XADES-DIGEST");
  const target = await provider.verify({ ...valid, targetName: "Wrapper" });
  assert.equal(target.diagnostics[0], "DIAG-XADES-REQUEST");
  assert.equal(calls, 0);
});

test("provider rejects implicit time and excessive revocation policy", async () => {
  const provider = createXadesProvider({
    execute: async () => {
      throw new Error("must not run");
    },
  });
  assert.equal(
    (await provider.verify({ ...valid, validationTime: undefined }))
      .diagnostics[0],
    "DIAG-XADES-REQUEST",
  );
  assert.equal(
    (await provider.verify({ ...valid, maximumRevocationAgeSeconds: 172_801 }))
      .diagnostics[0],
    "DIAG-XADES-EVIDENCE",
  );
  const maximum = new Uint8Array(8_388_608);
  assert.equal(
    (
      await provider.verify({
        ...valid,
        artifactBytes: maximum,
        artifactDigestSha256: createHash("sha256")
          .update(maximum)
          .digest("hex"),
      })
    ).diagnostics[0],
    "DIAG-XADES-EVIDENCE",
  );
});

test("opaque signer callback cannot hold the provider past its explicit deadline", async () => {
  const provider = createXadesProvider({
    execute: async (request) => ({
      kind: "TBS",
      diagnostic: "NONE",
      payload: new Uint8Array([9]),
    }),
  });
  const request = {
    ...valid,
    signer: {
      keyHandle: "test-provider:key-1",
      certificateDer: new Uint8Array([3]),
      certificateChainDer: [],
      sign: () => new Promise(() => {}),
    },
  };
  const result = await provider.sign(request, { deadlineMs: 25 });
  assert.equal(result.status, "limit");
  assert.equal(result.diagnostics[0], "DIAG-XADES-DEADLINE");
});

test("verification bridge invocation is bounded and observes cancellation", async () => {
  const hanging = createXadesProvider({ execute: () => new Promise(() => {}) });
  const timed = await hanging.verify(valid, { deadlineMs: 20 });
  assert.equal(timed.status, "limit");

  const controller = new AbortController();
  const pending = hanging.verify(valid, {
    signal: controller.signal,
    deadlineMs: 5_000,
  });
  controller.abort();
  const cancelled = await pending;
  assert.equal(cancelled.status, "cancelled");
});

test("application signs only eligible artifacts and releases verified exact bytes", async () => {
  const bytes = new TextEncoder().encode("<signed/> ");
  const signedBytes = new TextEncoder().encode("<signed-proof/>");
  const sha256 = (value) => createHash("sha256").update(value).digest("hex");
  const artifact = {
    state: "eligible",
    bytes,
    length: bytes.byteLength,
    sha256: `sha256:${sha256(bytes)}`,
    editionId: { value: XADES_EDITION_ID },
  };
  const digest = {
    providerId: "p4-d-test-digest",
    digest: (algorithm, value) =>
      createHash(algorithm).update(value).digest("hex"),
  };
  const verification = { status: "valid", diagnostics: [] };
  let calls = 0;
  const provider = {
    sign: async (request) => {
      calls += 1;
      assert.equal(request.artifactDigestSha256, sha256(bytes));
      assert.equal(request.artifactBytes.byteLength, bytes.byteLength);
      return { status: "signed", bytes: signedBytes, verification };
    },
  };
  const request = {
    artifact,
    targetName: "RegistroAlta",
    profileId: XADES_PROFILE_ID,
    signingTime: "2026-09-26T12:00:00Z",
    validationTime: "2026-09-26T12:00:00Z",
    signer: { keyHandle: "test:key", sign: async () => new Uint8Array() },
    trustAnchorsDer: [],
    crlEvidence: [],
    ocspEvidence: [],
    maximumRevocationAgeSeconds: 86_400,
    digest,
  };

  const ineligible = await signEligibleArtifact(
    { ...request, artifact: { ...artifact, state: "validated" } },
    provider,
  );
  assert.equal(ineligible.status, "invalid");
  assert.equal(calls, 0);

  const unverified = await signEligibleArtifact(request, {
    sign: async () => ({
      status: "signed",
      bytes: signedBytes,
      verification: { ...verification, status: "indeterminate" },
    }),
  });
  assert.equal(unverified.status, "indeterminate");
  assert.equal(calls, 0);

  const result = await signEligibleArtifact(request, provider);
  assert.equal(result.status, "signed");
  assert.deepEqual(result.bytes, signedBytes);
  assert.equal(result.sha256, `sha256:${sha256(signedBytes)}`);
  assert.equal(calls, 1);
});
