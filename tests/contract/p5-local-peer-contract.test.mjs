import assert from "node:assert/strict";
import test from "node:test";
import { createNodeHttpsTransport } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/node-https-transport.js";
import { observeAeatOnce } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/transport.js";
import { authorizeCertificate } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/certificate-authorization.js";
import {
  batchPlan,
  certificateAuthorization,
  context,
  identity,
  profile,
  testCredentialHandle,
} from "../support/p5-aeat-fixture.mjs";
import { recordP5FaultDetection } from "../support/p5-fault-evidence.mjs";

test("transport port runs one observation and strips response fields outside the safe allowlist", async () => {
  let calls = 0;
  const port = {
    contractVersion: 1,
    adapterId: "peer-contract",
    async observeOnce() {
      calls += 1;
      return {
        statusCode: 200,
        headers: { "content-type": "text/xml", "set-cookie": "secret=session" },
        responseBytes: Buffer.from("<response/>"),
        phase: "complete",
        delivery: "fully-sent",
        failureCode: null,
        tls: null,
        startedAt: "2026-10-03T12:00:00.000Z",
        completedAt: "2026-10-03T12:00:00.100Z",
        elapsedMs: 100,
      };
    },
  };
  const active = profile();
  const batch = batchPlan(active);
  const request = {
    profile: active,
    operationId: batch.operationId,
    context,
    endpoint: {
      endpointId: batch.endpointId,
      environment: batch.environment,
      url: new URL("https://test.example.test/soap"),
      serviceId: "synthetic-test",
      portId: "port-test",
      editionId: active.editionId,
      editionDigest: active.digest,
    },
    request: batch.request,
    certificateAuthorization,
    limits: {
      maxResponseBytes: 1000,
      connectTimeoutMs: 100,
      tlsTimeoutMs: 100,
      writeTimeoutMs: 100,
      firstByteTimeoutMs: 100,
      bodyIdleTimeoutMs: 100,
      totalTimeoutMs: 500,
    },
    clock: { wallNow: () => "2026-10-03T12:00:00.000Z", monotonicNow: () => 1 },
  };
  const result = await observeAeatOnce(port, request);
  assert.equal(result.statusCode, 200);
  assert.equal(result.headers["set-cookie"], undefined);
  assert.equal(calls, 1);

  let tlsAcquireCalls = 0;
  const https = createNodeHttpsTransport({
    tlsMaterials: {
      async acquire() {
        tlsAcquireCalls += 1;
        throw new Error("synthetic");
      },
    },
  });
  assert.equal(https.contractVersion, 1);
  assert.equal(tlsAcquireCalls, 0);
});

test("Node HTTPS adapter resolves and rejects a private DNS answer before opening a socket", async () => {
  let released = 0;
  let acquired = 0;
  const https = createNodeHttpsTransport({
    tlsMaterials: {
      async acquire() {
        acquired += 1;
        return {
          certificatePem: Buffer.from("synthetic-cert"),
          privateKeyPem: Buffer.from("synthetic-key"),
        };
      },
      async release() {
        released += 1;
      },
    },
    resolver: {
      async resolve() {
        return [{ address: "192.168.1.10", family: 4 }];
      },
    },
  });
  const active = profile();
  const batch = batchPlan(active);
  const endpoint = {
    endpointId: batch.endpointId,
    environment: "test",
    url: new URL("https://test.example.test/soap"),
    serviceId: "synthetic-test",
    portId: "test-port",
    editionId: active.editionId,
    editionDigest: active.digest,
  };
  const result = await https.observeOnce({
    profile: active,
    operationId: batch.operationId,
    context,
    endpoint,
    request: batch.request,
    certificateAuthorization,
    limits: {
      maxResponseBytes: 1000,
      connectTimeoutMs: 100,
      tlsTimeoutMs: 100,
      writeTimeoutMs: 100,
      firstByteTimeoutMs: 100,
      bodyIdleTimeoutMs: 100,
      totalTimeoutMs: 500,
    },
    clock: { wallNow: () => "2026-10-03T12:00:00.000Z", monotonicNow: () => 1 },
  });
  assert.equal(result.failureCode, "DIAG-AEAT-DNS-PRIVATE");
  assert.equal(result.delivery, "not-started");
  assert.equal(acquired, 0);
  assert.equal(released, 0);

  const rebinding = createNodeHttpsTransport({
    tlsMaterials: {
      async acquire() {
        acquired += 1;
        return {
          certificatePem: Buffer.from("unused"),
          privateKeyPem: Buffer.from("unused"),
        };
      },
      async release() {
        released += 1;
      },
    },
    resolver: {
      async resolve() {
        return [
          { address: "8.8.8.8", family: 4 },
          { address: "127.0.0.1", family: 4 },
        ];
      },
    },
  });
  const rebound = await rebinding.observeOnce({
    profile: active,
    operationId: batch.operationId,
    context,
    endpoint,
    request: batch.request,
    certificateAuthorization,
    limits: {
      maxResponseBytes: 1000,
      connectTimeoutMs: 100,
      tlsTimeoutMs: 100,
      writeTimeoutMs: 100,
      firstByteTimeoutMs: 100,
      bodyIdleTimeoutMs: 100,
      totalTimeoutMs: 500,
    },
    clock: { wallNow: () => "2026-10-03T12:00:00.000Z", monotonicNow: () => 1 },
  });
  assert.equal(rebound.failureCode, "DIAG-AEAT-DNS-PRIVATE");
  assert.equal(rebound.delivery, "not-started");
  assert.equal(acquired, 0);
  recordP5FaultDetection(
    "P5-FAULT-029",
    rebound.failureCode === "DIAG-AEAT-DNS-PRIVATE" && acquired === 0,
  );
});

test("Node HTTPS adapter rejects IPv4-mapped, transition, documentation and non-global IPv6 answers", async () => {
  const deniedAddresses = [
    "0.1.2.3",
    "10.0.0.4",
    "127.0.0.2",
    "224.0.0.1",
    "169.254.1.2",
    "172.16.0.1",
    "172.31.0.1",
    "192.168.1.1",
    "100.64.0.1",
    "198.18.0.1",
    "198.19.0.1",
    "192.0.1.1",
    "192.0.2.1",
    "198.51.100.1",
    "203.0.113.1",
    "::ffff:10.0.0.4",
    "::ffff:192.0.2.1",
    "::10.0.0.4",
    "fc00::1",
    "fe80::1",
    "2001:db8::1",
    "2001:0:1::1",
    "2002:c000:0204::1",
    "3fff::1",
    "4000::1",
    "ff02::1",
    "::1",
    "::",
  ];
  for (const address of deniedAddresses) {
    let released = 0;
    const family = address.includes(":") ? 6 : 4;
    const transport = createNodeHttpsTransport({
      resolver: {
        async resolve() {
          return [{ address, family }];
        },
      },
      tlsMaterials: {
        async acquire() {
          return {
            certificatePem: Buffer.from("synthetic-cert"),
            privateKeyPem: Buffer.from("synthetic-key"),
          };
        },
        async release() {
          released += 1;
        },
      },
    });
    const active = profile();
    const batch = batchPlan(active);
    const endpoint = {
      endpointId: batch.endpointId,
      environment: "production",
      url: new URL("https://prod.example.test/soap"),
      serviceId: "synthetic-production",
      portId: "production-port",
      editionId: active.editionId,
      editionDigest: active.digest,
    };
    const result = await transport.observeOnce({
      profile: active,
      operationId: batch.operationId,
      context,
      endpoint,
      request: batch.request,
      certificateAuthorization: {
        ...certificateAuthorization,
        environment: "production",
      },
      limits: {
        maxResponseBytes: 1000,
        connectTimeoutMs: 100,
        tlsTimeoutMs: 100,
        writeTimeoutMs: 100,
        firstByteTimeoutMs: 100,
        bodyIdleTimeoutMs: 100,
        totalTimeoutMs: 500,
      },
      clock: {
        wallNow: () => "2026-10-03T12:00:00.000Z",
        monotonicNow: () => 1,
      },
    });
    assert.equal(result.failureCode, "DIAG-AEAT-DNS-PRIVATE", address);
    assert.equal(result.delivery, "not-started", address);
    assert.equal(released, 0, address);
  }
});

test("Node HTTPS adapter rejects DNS failures, malformed address sets and aborted resolution without acquiring credentials", async () => {
  const active = profile();
  const batch = batchPlan(active);
  const endpoint = {
    endpointId: batch.endpointId,
    environment: "production",
    url: new URL("https://prod.example.test/soap"),
    serviceId: "synthetic-production",
    portId: "production-port",
    editionId: active.editionId,
    editionDigest: active.digest,
  };
  let acquired = 0;
  const transport = (resolver) =>
    createNodeHttpsTransport({
      resolver,
      tlsMaterials: {
        async acquire() {
          acquired += 1;
          throw new Error("should not acquire");
        },
      },
    });
  const input = (signal) => ({
    profile: active,
    operationId: batch.operationId,
    context,
    endpoint,
    request: batch.request,
    certificateAuthorization: {
      ...certificateAuthorization,
      environment: "production",
    },
    limits: {
      maxResponseBytes: 1000,
      connectTimeoutMs: 100,
      tlsTimeoutMs: 100,
      writeTimeoutMs: 100,
      firstByteTimeoutMs: 100,
      bodyIdleTimeoutMs: 100,
      totalTimeoutMs: 500,
    },
    clock: { wallNow: () => "2026-10-03T12:00:00.000Z", monotonicNow: () => 1 },
    ...(signal ? { signal } : {}),
  });
  const cases = [
    [
      {
        async resolve() {
          throw new Error("private DNS error");
        },
      },
      undefined,
      "DIAG-AEAT-DNS",
    ],
    [
      {
        async resolve() {
          return [];
        },
      },
      undefined,
      "DIAG-AEAT-DNS-ADDRESS",
    ],
    [
      {
        async resolve() {
          return [{ address: "not-an-address", family: 4 }];
        },
      },
      undefined,
      "DIAG-AEAT-DNS-ADDRESS",
    ],
    [
      {
        async resolve() {
          return Array.from({ length: 17 }, () => ({
            address: "127.0.0.1",
            family: 4,
          }));
        },
      },
      undefined,
      "DIAG-AEAT-DNS-ADDRESS",
    ],
    [
      {
        async resolve() {
          return [{ address: "127.0.0.1", family: 6 }];
        },
      },
      undefined,
      "DIAG-AEAT-DNS-ADDRESS",
    ],
  ];
  for (const [resolver, signal, diagnostic] of cases) {
    const result = await transport(resolver).observeOnce(input(signal));
    assert.equal(result.failureCode, diagnostic);
    assert.equal(result.delivery, "not-started");
  }
  const controller = new AbortController();
  controller.abort();
  const cancelled = await transport({
    async resolve() {
      return [];
    },
  }).observeOnce(input(controller.signal));
  assert.equal(cancelled.failureCode, "DIAG-AEAT-TRANSPORT-PREFLIGHT");
  assert.equal(acquired, 0);
});

test("certificate authorization binds purpose, taxpayer, context and current certificate facts", async () => {
  const activeFrom = "2026-01-01T00:00:00Z";
  const binding = {
    credentialId: "credential-1",
    credentialHandle: testCredentialHandle(),
    context,
    taxpayerId: context.taxpayerId,
    representativeId: null,
    environment: "test",
    purposes: ["tls-client-authentication"],
    activeFrom,
    activeUntil: null,
    authorizationEvidenceId: "authorization-1",
  };
  const facts = {
    async inspect() {
      return {
        status: "ok",
        value: {
          fingerprint: `sha256:${"1".repeat(64)}`,
          subjectDigest: `sha256:${"2".repeat(64)}`,
          issuerDigest: `sha256:${"3".repeat(64)}`,
          serialDigest: `sha256:${"4".repeat(64)}`,
          notBefore: activeFrom,
          notAfter: "2027-01-01T00:00:00Z",
          digitalSignatureUsage: true,
          clientAuthenticationUsage: true,
          revocation: "good",
        },
      };
    },
  };
  const input = {
    binding,
    context,
    environment: "test",
    purpose: "tls-client-authentication",
    actingParty: context.taxpayerId,
    now: "2026-10-03T12:00:00Z",
    facts,
    representativeAuthorization: {
      async verify() {
        return { status: "ok", value: true };
      },
    },
  };
  assert.equal((await authorizeCertificate(input)).status, "ok");
  assert.equal(
    (await authorizeCertificate({ ...input, purpose: "xml-signing" })).status,
    "invalid",
  );
  assert.equal(
    (
      await authorizeCertificate({
        ...input,
        context: {
          ...context,
          taxpayerId: { kind: "taxpayer", value: "ES999" },
        },
      })
    ).status,
    "invalid",
  );
});

test("representative and revocation evidence must verify before a credential is authorized", async () => {
  const representativeId = identity("taxpayer", "ES999");
  const binding = {
    credentialId: "credential-1",
    credentialHandle: testCredentialHandle(),
    context,
    taxpayerId: context.taxpayerId,
    representativeId,
    environment: "test",
    purposes: ["tls-client-authentication", "xml-signing"],
    activeFrom: "2026-01-01T00:00:00Z",
    activeUntil: null,
    authorizationEvidenceId: "representative-evidence-1",
  };
  const value = {
    fingerprint: `sha256:${"1".repeat(64)}`,
    subjectDigest: `sha256:${"2".repeat(64)}`,
    issuerDigest: `sha256:${"3".repeat(64)}`,
    serialDigest: `sha256:${"4".repeat(64)}`,
    notBefore: "2026-01-01T00:00:00Z",
    notAfter: "2027-01-01T00:00:00Z",
    digitalSignatureUsage: true,
    clientAuthenticationUsage: false,
    revocation: "good",
  };
  const input = {
    binding,
    context,
    environment: "test",
    purpose: "xml-signing",
    actingParty: representativeId,
    now: "2026-10-03T12:00:00Z",
    facts: {
      async inspect() {
        return { status: "ok", value };
      },
    },
    representativeAuthorization: {
      async verify() {
        return { status: "ok", value: true };
      },
    },
  };
  assert.equal((await authorizeCertificate(input)).status, "ok");
  const denied = await authorizeCertificate({
    ...input,
    representativeAuthorization: {
      async verify() {
        return { status: "ok", value: false };
      },
    },
  });
  assert.equal(denied.status, "invalid");
  recordP5FaultDetection("P5-FAULT-027", denied.status === "invalid");
  assert.equal(
    (
      await authorizeCertificate({
        ...input,
        representativeAuthorization: null,
      })
    ).status,
    "unavailable",
  );
  assert.equal(
    (
      await authorizeCertificate({
        ...input,
        facts: {
          async inspect() {
            return { status: "unavailable", code: "unavailable" };
          },
        },
      })
    ).status,
    "unavailable",
  );
  const unknownRevocation = await authorizeCertificate({
    ...input,
    facts: {
      async inspect() {
        return { status: "ok", value: { ...value, revocation: "unknown" } };
      },
    },
  });
  assert.equal(unknownRevocation.status, "invalid");
  assert.equal(unknownRevocation.code, "unavailable");
  assert.equal(
    (
      await authorizeCertificate({
        ...input,
        facts: {
          async inspect() {
            return { status: "ok", value: { ...value, revocation: "revoked" } };
          },
        },
      })
    ).status,
    "invalid",
  );
  assert.equal(
    (
      await authorizeCertificate({
        ...input,
        binding: { ...binding, representativeId: null },
      })
    ).status,
    "invalid",
  );
});

test("certificate authorization rejects every stale binding and unusable certificate fact", async () => {
  const binding = {
    credentialId: "credential-1",
    credentialHandle: testCredentialHandle(),
    context,
    taxpayerId: context.taxpayerId,
    representativeId: null,
    environment: "test",
    purposes: ["tls-client-authentication"],
    activeFrom: "2026-01-01T00:00:00Z",
    activeUntil: null,
    authorizationEvidenceId: "authorization-1",
  };
  const facts = {
    fingerprint: `sha256:${"1".repeat(64)}`,
    subjectDigest: `sha256:${"2".repeat(64)}`,
    issuerDigest: `sha256:${"3".repeat(64)}`,
    serialDigest: `sha256:${"4".repeat(64)}`,
    notBefore: "2026-01-01T00:00:00Z",
    notAfter: "2027-01-01T00:00:00Z",
    digitalSignatureUsage: true,
    clientAuthenticationUsage: true,
    revocation: "good",
  };
  const base = {
    binding,
    context,
    environment: "test",
    purpose: "tls-client-authentication",
    actingParty: context.taxpayerId,
    now: "2026-10-03T12:00:00Z",
    facts: {
      async inspect() {
        return { status: "ok", value: facts };
      },
    },
    representativeAuthorization: {
      async verify() {
        return { status: "ok", value: true };
      },
    },
  };
  const invalidBindings = [
    { binding: null },
    { context: null },
    { binding: { ...binding, context: null } },
    {
      context: {
        ...context,
        installationId: identity("installation", "other"),
      },
    },
    {
      binding: {
        ...binding,
        taxpayerId: { kind: "tenant", value: "tenant-a" },
      },
    },
    {
      binding: {
        ...binding,
        taxpayerId: identity("taxpayer", "another-taxpayer"),
      },
    },
    { environment: "sandbox" },
    { binding: { ...binding, environment: "production" } },
    { purpose: "unknown" },
    { binding: { ...binding, purposes: null } },
    { binding: { ...binding, purposes: [] } },
    { binding: { ...binding, credentialId: "" } },
    { binding: { ...binding, credentialHandle: "bad\nhandle" } },
    { binding: { ...binding, authorizationEvidenceId: "" } },
    { now: "invalid" },
    { binding: { ...binding, activeFrom: "invalid" } },
    { binding: { ...binding, activeFrom: "2027-01-01T00:00:00Z" } },
    { binding: { ...binding, activeUntil: "invalid" } },
    { binding: { ...binding, activeUntil: "2026-01-01T00:00:00Z" } },
    { actingParty: { kind: "tenant", value: "tenant-a" } },
  ];
  for (const override of invalidBindings) {
    const result = await authorizeCertificate({ ...base, ...override });
    assert.equal(result.status, "invalid", JSON.stringify(override));
  }
  for (const override of [
    {
      facts: {
        async inspect() {
          return { status: "ok", value: { ...facts, fingerprint: "invalid" } };
        },
      },
    },
    {
      facts: {
        async inspect() {
          return {
            status: "ok",
            value: { ...facts, subjectDigest: "invalid" },
          };
        },
      },
    },
    {
      facts: {
        async inspect() {
          return { status: "ok", value: { ...facts, issuerDigest: "invalid" } };
        },
      },
    },
    {
      facts: {
        async inspect() {
          return { status: "ok", value: { ...facts, serialDigest: "invalid" } };
        },
      },
    },
    {
      facts: {
        async inspect() {
          return { status: "ok", value: { ...facts, notBefore: "invalid" } };
        },
      },
    },
    {
      facts: {
        async inspect() {
          return {
            status: "ok",
            value: { ...facts, notBefore: "2027-01-01T00:00:00Z" },
          };
        },
      },
    },
    {
      facts: {
        async inspect() {
          return {
            status: "ok",
            value: { ...facts, notAfter: "2026-01-01T00:00:00Z" },
          };
        },
      },
    },
    {
      facts: {
        async inspect() {
          return {
            status: "ok",
            value: { ...facts, digitalSignatureUsage: false },
          };
        },
      },
    },
    {
      facts: {
        async inspect() {
          return {
            status: "ok",
            value: { ...facts, clientAuthenticationUsage: false },
          };
        },
      },
    },
  ])
    assert.equal(
      (await authorizeCertificate({ ...base, ...override })).status,
      "invalid",
    );
  assert.equal(
    (await authorizeCertificate({ ...base, facts: null })).status,
    "unavailable",
  );
  assert.equal(
    (await authorizeCertificate({ ...base, facts: {} })).status,
    "unavailable",
  );
});
