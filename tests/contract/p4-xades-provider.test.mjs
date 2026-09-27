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

test("request normalization rejects malformed identities, times, certificates, and evidence", async () => {
  const provider = createXadesProvider({
    execute: async () => {
      throw new Error("must not run");
    },
  });
  for (const request of [
    { ...valid, profileId: "other" },
    { ...valid, targetName: "Wrapper" },
    { ...valid, signingTime: "2026-09-27T00:00:00Z" },
    { ...valid, validationTime: "2026-02-30T00:00:00Z" },
    { ...valid, maximumRevocationAgeSeconds: 0 },
    { ...valid, trustAnchorsDer: ["not bytes"] },
    {
      ...valid,
      crlEvidence: Array.from({ length: 17 }, () => new Uint8Array([1])),
    },
    { ...valid, ocspEvidence: [new Uint8Array()] },
    { ...valid, certificateChainDer: [new Uint8Array()] },
    { ...valid, expectedSignerFingerprintSha256: "not-a-digest" },
  ]) {
    assert.notEqual((await provider.verify(request)).status, "valid");
  }
  const signer = {
    keyHandle: "key",
    certificateDer: new Uint8Array([1]),
    certificateChainDer: [],
    sign: async () => new Uint8Array(256),
  };
  for (const malformed of [
    { ...signer, keyHandle: "" },
    { ...signer, certificateDer: new Uint8Array() },
    { ...signer, certificateChainDer: [new Uint8Array()] },
    { ...signer, certificateChainDer: ["not bytes"] },
    {
      ...signer,
      certificateChainDer: Array.from(
        { length: 16 },
        () => new Uint8Array([1]),
      ),
    },
  ]) {
    assert.equal(
      (await provider.sign({ ...valid, signer: malformed })).status,
      "invalid",
    );
  }
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

  const slowSignerProvider = createXadesProvider({
    execute: async (bridgeRequest) =>
      bridgeRequest.command === "SIGN_PREPARE"
        ? {
            kind: "TBS",
            diagnostic: "NONE",
            payload: new Uint8Array([9]),
          }
        : {
            kind: "UNAVAILABLE",
            diagnostic: "NONE",
            payload: new Uint8Array(),
          },
  });
  const slowResult = await slowSignerProvider.sign(
    {
      ...valid,
      signer: {
        keyHandle: "test-provider:slow-key",
        certificateDer: new Uint8Array([3]),
        certificateChainDer: [],
        sign: () => {
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
          return new Uint8Array(256);
        },
      },
    },
    { deadlineMs: 20 },
  );
  assert.equal(slowResult.status, "limit");
  assert.equal(slowResult.diagnostics[0], "DIAG-XADES-DEADLINE");
});

test("signing accepts only bounded prepared, completed, and self-verified output", async () => {
  const signedBytes = new TextEncoder().encode("<signed/>");
  const validationTime = Date.parse(valid.validationTime);
  const report = new TextEncoder().encode(
    [
      "VALID",
      "VALID",
      ...Array(10).fill("VALID"),
      "NONE",
      String(validationTime - 1),
      String(validationTime + 1000),
    ].join("\t"),
  );
  const signer = {
    keyHandle: "provider-test:key",
    certificateDer: new Uint8Array([1]),
    certificateChainDer: [],
    sign: async (bytes) => {
      assert.deepEqual([...bytes], [9]);
      return new Uint8Array(256).fill(7);
    },
  };
  const request = { ...valid, signer };
  const provider = createXadesProvider({
    execute: async (bridgeRequest) => {
      if (bridgeRequest.command === "SIGN_PREPARE")
        return {
          kind: "TBS",
          diagnostic: "NONE",
          payload: new Uint8Array([9]),
        };
      if (bridgeRequest.command === "SIGN_COMPLETE")
        return { kind: "SIGNED", diagnostic: "NONE", payload: signedBytes };
      return { kind: "VERIFIED", diagnostic: "NONE", payload: report };
    },
  });
  const signed = await provider.sign(request);
  assert.equal(signed.status, "signed");
  assert.deepEqual(signed.bytes, signedBytes);
  assert.equal(signed.verification.status, "valid");

  const noDiagnosticFailure = createXadesProvider({
    execute: async (bridgeRequest) => {
      if (bridgeRequest.command === "SIGN_PREPARE")
        return {
          kind: "TBS",
          diagnostic: "NONE",
          payload: new Uint8Array([9]),
        };
      if (bridgeRequest.command === "SIGN_COMPLETE")
        return { kind: "SIGNED", diagnostic: "NONE", payload: signedBytes };
      const invalidFields = new TextDecoder().decode(report).split("\t");
      invalidFields[0] = "INVALID";
      return {
        kind: "INVALID",
        diagnostic: "NONE",
        payload: new TextEncoder().encode(invalidFields.join("\t")),
      };
    },
  });
  const failedWithoutDiagnostic = await noDiagnosticFailure.sign(request);
  assert.equal(failedWithoutDiagnostic.status, "invalid");
  assert.deepEqual(failedWithoutDiagnostic.diagnostics, [
    "DIAG-XADES-PROVIDER",
  ]);

  const badPrepare = createXadesProvider({
    execute: async () => ({
      kind: "TBS",
      diagnostic: "",
      payload: new Uint8Array(),
    }),
  });
  const emptyPrepare = await badPrepare.sign(request);
  assert.equal(emptyPrepare.status, "invalid");
  assert.equal(emptyPrepare.diagnostics[0], "DIAG-XADES-PROVIDER");
  const badSignature = createXadesProvider({
    execute: async () => ({
      kind: "TBS",
      diagnostic: "NONE",
      payload: new Uint8Array([9]),
    }),
  });
  assert.equal(
    (
      await badSignature.sign({
        ...request,
        signer: { ...signer, sign: async () => new Uint8Array(127) },
      })
    ).status,
    "invalid",
  );
  const badComplete = createXadesProvider({
    execute: async (bridgeRequest) =>
      bridgeRequest.command === "SIGN_PREPARE"
        ? { kind: "TBS", diagnostic: "NONE", payload: new Uint8Array([9]) }
        : {
            kind: "UNAVAILABLE",
            diagnostic: "DIAG-XADES-UNAVAILABLE",
            payload: new Uint8Array(),
          },
  });
  assert.equal((await badComplete.sign(request)).status, "unavailable");

  const oversizedComplete = createXadesProvider({
    execute: async (bridgeRequest) =>
      bridgeRequest.command === "SIGN_PREPARE"
        ? { kind: "TBS", diagnostic: "NONE", payload: new Uint8Array([9]) }
        : {
            kind: "SIGNED",
            diagnostic: "NONE",
            payload: new Uint8Array(8_388_609),
          },
  });
  const oversized = await oversizedComplete.sign(request);
  assert.equal(oversized.status, "limit");
  assert.equal(oversized.diagnostics[0], "DIAG-XADES-OUTPUT");
});

test("signing maps cancellation, deadline, callback errors, and bridge outcomes", async () => {
  const signer = {
    keyHandle: "provider-test:key",
    certificateDer: new Uint8Array([1]),
    certificateChainDer: [],
    sign: async () => new Uint8Array(256).fill(1),
  };
  const request = { ...valid, signer };
  const controller = new AbortController();
  controller.abort();
  assert.equal(
    (await createXadesProvider().sign(request, { signal: controller.signal }))
      .status,
    "cancelled",
  );
  assert.equal(
    (await createXadesProvider().sign(request, { deadlineMs: 0 })).status,
    "limit",
  );

  const prepared = () => ({
    kind: "TBS",
    diagnostic: "NONE",
    payload: new Uint8Array([9]),
  });
  for (const [kind, status] of [
    ["UNAVAILABLE", "unavailable"],
    ["LIMIT", "limit"],
    ["CANCELLED", "cancelled"],
    ["DEFECT", "defect"],
  ]) {
    const provider = createXadesProvider({
      execute: async () => ({
        kind,
        diagnostic: "DIAG-XADES-CASE",
        payload: new Uint8Array(),
      }),
    });
    assert.equal((await provider.sign(request)).status, status);
  }
  const throwingCallback = createXadesProvider({
    execute: async () => prepared(),
  });
  const callbackFailure = await throwingCallback.sign({
    ...request,
    signer: {
      ...signer,
      sign: async () => {
        throw new Error("private signer error");
      },
    },
  });
  assert.equal(callbackFailure.status, "unavailable");
  assert.equal(callbackFailure.diagnostics[0], "DIAG-XADES-SIGNER-FAILED");

  for (const code of ["CANCELLED", "DEADLINE"]) {
    const rejectedCallback = await throwingCallback.sign({
      ...request,
      signer: {
        ...signer,
        sign: async () => {
          throw Object.assign(new Error("private callback status"), { code });
        },
      },
    });
    assert.equal(
      rejectedCallback.status,
      code === "CANCELLED" ? "cancelled" : "limit",
    );
  }

  const oversizedCallback = await throwingCallback.sign({
    ...request,
    signer: { ...signer, sign: async () => new Uint8Array(1_025) },
  });
  assert.equal(oversizedCallback.status, "invalid");
});

test("verification bridge invocation is bounded and observes cancellation", async () => {
  const hanging = createXadesProvider({ execute: () => new Promise(() => {}) });
  assert.equal((await hanging.verify(null)).status, "defect");
  const timed = await hanging.verify(valid, { deadlineMs: 20 });
  assert.equal(timed.status, "limit");
  assert.equal(
    (await hanging.verify(valid, { deadlineMs: 0 })).status,
    "limit",
  );

  const preAborted = new AbortController();
  preAborted.abort();
  assert.equal(
    (await hanging.verify(valid, { signal: preAborted.signal })).status,
    "cancelled",
  );

  const controller = new AbortController();
  const pending = hanging.verify(valid, {
    signal: controller.signal,
    deadlineMs: 5_000,
  });
  controller.abort();
  const cancelled = await pending;
  assert.equal(cancelled.status, "cancelled");
});

test("default XAdES provider reaches the admitted Java bridge and fails closed", async () => {
  const provider = createXadesProvider();
  const verified = await provider.verify(valid);
  assert.equal(verified.status, "invalid");
  assert.ok(verified.diagnostics.includes("DIAG-XADES-PROFILE"));

  let signerCalls = 0;
  const signed = await provider.sign({
    ...valid,
    signingTime: valid.validationTime,
    signer: {
      keyHandle: "integration:key",
      certificateDer: new Uint8Array([1]),
      certificateChainDer: [],
      sign: async () => {
        signerCalls += 1;
        return new Uint8Array(256);
      },
    },
  });
  assert.equal(signed.status, "invalid");
  assert.ok(signed.diagnostics.includes("DIAG-XADES-TARGET"));
  assert.equal(signerCalls, 0);
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
  assert.equal(
    (
      await signEligibleArtifact(
        { ...request, artifact: { ...artifact, length: artifact.length + 1 } },
        provider,
      )
    ).status,
    "invalid",
  );
  assert.equal(
    (
      await signEligibleArtifact(
        { ...request, profileId: "wrong-profile" },
        provider,
      )
    ).status,
    "invalid",
  );
  assert.equal((await signEligibleArtifact(request, null)).status, "invalid");
  assert.equal(calls, 0);

  const providerFailure = await signEligibleArtifact(request, {
    sign: async () => ({ status: "unavailable", diagnostics: ["DIAG-XADES"] }),
  });
  assert.equal(providerFailure.status, "unavailable");

  const digestFailure = await signEligibleArtifact(
    {
      ...request,
      digest: {
        providerId: "test:digest-failure",
        digest: () => "not-hex",
      },
    },
    provider,
  );
  assert.equal(digestFailure.status, "defect");

  const unverified = await signEligibleArtifact(request, {
    sign: async () => ({
      status: "signed",
      bytes: signedBytes,
      verification: { ...verification, status: "indeterminate" },
    }),
  });
  assert.equal(unverified.status, "indeterminate");

  const result = await signEligibleArtifact(request, provider);
  assert.equal(result.status, "signed");
  assert.deepEqual(result.bytes, signedBytes);
  assert.equal(result.sha256, `sha256:${sha256(signedBytes)}`);
  assert.equal(calls, 2);
});

test("provider maps independent XAdES and PKI response dimensions fail closed", async () => {
  const validationTime = Date.parse(valid.validationTime);
  const wireFields = (overrides = {}) => {
    const fields = [
      "VALID",
      "VALID",
      "VALID",
      "VALID",
      "VALID",
      "VALID",
      "VALID",
      "VALID",
      "VALID",
      "VALID",
      "VALID",
      "VALID",
      "NONE",
      String(validationTime - 1000),
      String(validationTime + 86_400_000),
    ];
    for (const [index, value] of Object.entries(overrides))
      fields[Number(index)] = value;
    return new TextEncoder().encode(fields.join("\t"));
  };
  const verifyResponse = async (kind, payload = wireFields()) =>
    createXadesProvider({
      execute: async () => ({ kind, diagnostic: "NONE", payload }),
    }).verify(valid);
  const uncertainFields = Object.fromEntries(
    Array.from({ length: 11 }, (_, index) => [index, "NOT_EVALUATED"]),
  );

  assert.equal((await verifyResponse("VERIFIED")).status, "valid");
  assert.equal(
    (await verifyResponse("INVALID", wireFields({ 0: "INVALID" }))).status,
    "invalid",
  );
  assert.equal(
    (
      await verifyResponse(
        "INVALID",
        wireFields({ 1: "INVALID", 12: "DIAG-SIGNATURE" }),
      )
    ).status,
    "invalid",
  );
  assert.equal(
    (
      await verifyResponse(
        "INVALID",
        wireFields({ 2: "INVALID", 3: "INVALID" }),
      )
    ).status,
    "invalid",
  );
  assert.equal(
    (await verifyResponse("INVALID", wireFields({ 11: "REVOKED" }))).status,
    "invalid",
  );
  assert.equal(
    (
      await verifyResponse(
        "INDETERMINATE",
        wireFields({ ...uncertainFields, 11: "UNKNOWN" }),
      )
    ).status,
    "indeterminate",
  );
  assert.equal(
    (
      await verifyResponse(
        "INDETERMINATE",
        wireFields({
          ...uncertainFields,
          11: "STALE",
          14: String(validationTime - 1),
        }),
      )
    ).status,
    "indeterminate",
  );
  assert.equal(
    (
      await verifyResponse(
        "INDETERMINATE",
        wireFields({ ...uncertainFields, 11: "ABSENT" }),
      )
    ).status,
    "indeterminate",
  );
  assert.equal(
    (await verifyResponse("VERIFIED", wireFields({ 0: "INVALID" }))).status,
    "defect",
  );
  assert.equal((await verifyResponse("INVALID")).status, "defect");
  assert.equal((await verifyResponse("INDETERMINATE")).status, "defect");
  assert.equal((await verifyResponse("CANCELLED")).status, "cancelled");
  assert.equal((await verifyResponse("LIMIT")).status, "limit");
  assert.equal((await verifyResponse("UNAVAILABLE")).status, "unavailable");
  assert.equal((await verifyResponse("DEFECT")).status, "defect");
  assert.equal((await verifyResponse("UNKNOWN")).status, "defect");
  assert.equal(
    (await verifyResponse("VERIFIED", new Uint8Array([0xff]))).status,
    "defect",
  );
  for (const payload of [
    new TextEncoder().encode("VALID\tVALID"),
    wireFields({ 0: "MAYBE" }),
    wireFields({ 12: "private diagnostic" }),
    wireFields({ 13: "12345678901234567" }),
    wireFields({ 2: "INVALID" }),
  ]) {
    assert.equal((await verifyResponse("VERIFIED", payload)).status, "defect");
  }
  const malformedWorkerValue = await createXadesProvider({
    execute: async () => ({
      kind: "VERIFIED",
      diagnostic: "NONE",
      payload: "not-bytes",
    }),
  }).verify(valid);
  assert.equal(malformedWorkerValue.status, "defect");
});
