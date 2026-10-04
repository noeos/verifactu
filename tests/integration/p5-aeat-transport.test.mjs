import assert from "node:assert/strict";
import { createHash, X509Certificate } from "node:crypto";
import { createServer } from "node:https";
import test from "node:test";
import { createNodeHttpsTransport } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/node-https-transport.js";
import { observeAeatOnce } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/transport.js";
import {
  batchPlan,
  certificateAuthorization,
  context,
  p5TestPki,
  profile,
} from "../support/p5-aeat-wire-fixture.mjs";
import { recordP5FaultDetection } from "../support/p5-fault-evidence.mjs";

test("transport output is sanitized and one exact request makes one adapter observation", async () => {
  const active = profile();
  const batch = batchPlan(active);
  const sent = [];
  const adapter = {
    contractVersion: 1,
    adapterId: "test-peer",
    async observeOnce(input) {
      sent.push(Buffer.from(input.request.bytes));
      return {
        statusCode: 200,
        headers: {
          "content-type": "text/xml",
          authorization: "secret",
          "content-length": "2",
        },
        responseBytes: Buffer.from("ok"),
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
  const endpoint = {
    endpointId: batch.endpointId,
    environment: "test",
    url: new URL("https://test.example.test/soap"),
    serviceId: "synthetic-test",
    portId: "test-port",
    editionId: active.editionId,
    editionDigest: active.digest,
  };
  const input = {
    profile: active,
    operationId: batch.operationId,
    context,
    endpoint,
    request: batch.request,
    certificateAuthorization,
    limits: {
      maxResponseBytes: 100,
      connectTimeoutMs: 100,
      tlsTimeoutMs: 100,
      writeTimeoutMs: 100,
      firstByteTimeoutMs: 100,
      bodyIdleTimeoutMs: 100,
      totalTimeoutMs: 500,
    },
    clock: { wallNow: () => "2026-10-03T12:00:00.000Z", monotonicNow: () => 1 },
  };
  const observed = await observeAeatOnce(adapter, input);
  assert.equal(observed.statusCode, 200);
  assert.equal(observed.headers.authorization, undefined);
  assert.equal(observed.headers["content-type"], "text/xml");
  assert.equal(sent.length, 1);
  assert.equal(sent[0].equals(Buffer.from(batch.request.bytes)), true);

  const partialWrite = await observeAeatOnce(
    {
      ...adapter,
      async observeOnce() {
        return {
          statusCode: null,
          headers: {},
          responseBytes: null,
          phase: "request-write",
          delivery: "possibly-sent",
          failureCode: "DIAG-AEAT-WRITE",
          tls: null,
          startedAt: "2026-10-03T12:00:00.000Z",
          completedAt: "2026-10-03T12:00:00.100Z",
          elapsedMs: 100,
        };
      },
    },
    input,
  );
  assert.equal(partialWrite.delivery, "possibly-sent");
  assert.equal(partialWrite.failureCode, "DIAG-AEAT-WRITE");
  recordP5FaultDetection(
    "P5-FAULT-034",
    partialWrite.delivery === "possibly-sent" &&
      partialWrite.failureCode === "DIAG-AEAT-WRITE",
  );

  const flushCancelled = await observeAeatOnce(
    {
      ...adapter,
      async observeOnce() {
        return {
          statusCode: null,
          headers: {},
          responseBytes: null,
          phase: "request-write",
          delivery: "possibly-sent",
          failureCode: "DIAG-AEAT-CANCELLED",
          tls: null,
          startedAt: "2026-10-03T12:00:00.000Z",
          completedAt: "2026-10-03T12:00:00.100Z",
          elapsedMs: 100,
        };
      },
    },
    input,
  );
  assert.equal(flushCancelled.delivery, "possibly-sent");
  recordP5FaultDetection(
    "P5-FAULT-035",
    flushCancelled.failureCode === "DIAG-AEAT-CANCELLED" &&
      flushCancelled.delivery === "possibly-sent",
  );
});

test("transport wrapper blocks stale bindings and limits, and sanitizes or classifies adapter failures", async () => {
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
  const input = {
    profile: active,
    operationId: batch.operationId,
    context,
    endpoint,
    request: batch.request,
    certificateAuthorization,
    limits: {
      maxResponseBytes: 100,
      connectTimeoutMs: 100,
      tlsTimeoutMs: 100,
      writeTimeoutMs: 100,
      firstByteTimeoutMs: 100,
      bodyIdleTimeoutMs: 100,
      totalTimeoutMs: 500,
    },
    clock: { wallNow: () => "2026-10-03T12:00:00.000Z", monotonicNow: () => 1 },
  };
  const response = (overrides = {}) => ({
    statusCode: 200,
    headers: { "content-type": "text/xml", "x-secret": "remove" },
    responseBytes: Buffer.from("ok"),
    phase: "complete",
    delivery: "fully-sent",
    failureCode: null,
    tls: null,
    startedAt: "2026-10-03T12:00:00.000Z",
    completedAt: "2026-10-03T12:00:00.100Z",
    elapsedMs: 100,
    ...overrides,
  });
  const adapter = {
    contractVersion: 1,
    adapterId: "test-peer",
    async observeOnce() {
      return response();
    },
  };

  assert.equal(
    (
      await observeAeatOnce(adapter, {
        ...input,
        endpoint: { ...endpoint, url: new URL("https://attacker.test/soap") },
      })
    ).failureCode,
    "DIAG-AEAT-TRANSPORT-ENDPOINT",
  );
  assert.equal(
    (
      await observeAeatOnce(adapter, {
        ...input,
        limits: { ...input.limits, connectTimeoutMs: 600 },
      })
    ).failureCode,
    "DIAG-AEAT-TRANSPORT-LIMITS",
  );
  assert.equal(
    (
      await observeAeatOnce(adapter, {
        ...input,
        request: { ...batch.request, bytes: Buffer.from("different-length") },
      })
    ).failureCode,
    "DIAG-AEAT-TRANSPORT-REQUEST",
  );
  assert.equal(
    (await observeAeatOnce(null, input)).failureCode,
    "DIAG-AEAT-TRANSPORT-UNAVAILABLE",
  );
  assert.equal(
    (
      await observeAeatOnce(
        {
          ...adapter,
          async observeOnce() {
            throw new Error("sensitive secret");
          },
        },
        input,
      )
    ).failureCode,
    "DIAG-AEAT-TRANSPORT-THREW",
  );
  const sanitized = await observeAeatOnce(adapter, input);
  assert.equal(sanitized.headers["x-secret"], undefined);
  assert.equal(
    (
      await observeAeatOnce(
        {
          ...adapter,
          async observeOnce() {
            return response({ elapsedMs: -1 });
          },
        },
        input,
      )
    ).failureCode,
    "DIAG-AEAT-TRANSPORT-OBSERVATION",
  );

  const invalidObservations = [
    response({ phase: "unknown" }),
    response({ delivery: "unknown" }),
    response({ statusCode: 99 }),
    response({ elapsedMs: Number.NaN }),
    response({ elapsedMs: 3_600_001 }),
    response({ startedAt: "not-an-instant" }),
    response({ completedAt: "2026-10-03T11:59:59.000Z" }),
    response({ headers: null }),
    response({
      headers: Object.fromEntries(
        Array.from({ length: 33 }, (_, index) => [`x-${index}`, "ok"]),
      ),
    }),
    response({ responseBytes: Buffer.alloc(101) }),
    response({ failureCode: "sensitive remote detail" }),
    response({
      tls: {
        authorized: "yes",
        protocol: "TLSv1.3",
        cipher: "cipher",
        servername: "host.example.test",
        peerCertificateSha256: `sha256:${"a".repeat(64)}`,
      },
    }),
    response({
      tls: {
        authorized: true,
        protocol: "",
        cipher: "cipher",
        servername: "host.example.test",
        peerCertificateSha256: `sha256:${"a".repeat(64)}`,
      },
    }),
    response({
      tls: {
        authorized: true,
        protocol: "TLSv1.3",
        cipher: "cipher",
        servername: "host.example.test",
        peerCertificateSha256: "invalid",
      },
    }),
  ];
  for (const candidate of invalidObservations) {
    const invalidResult = await observeAeatOnce(
      {
        ...adapter,
        async observeOnce() {
          return candidate;
        },
      },
      input,
    );
    assert.equal(invalidResult.failureCode, "DIAG-AEAT-TRANSPORT-OBSERVATION");
  }
  const tlsSanitized = await observeAeatOnce(
    {
      ...adapter,
      async observeOnce() {
        return response({
          headers: {
            "CONTENT-TYPE": "text/xml",
            authorization: "secret",
            date: "safe",
            "retry-after": "2",
            "x-safe": "ignored\r\nvalue",
          },
          tls: {
            authorized: true,
            protocol: "TLSv1.3",
            cipher: "TLS_AES_128_GCM_SHA256",
            servername: "host.example.test",
            peerCertificateSha256: `sha256:${"a".repeat(64)}`,
          },
        });
      },
    },
    input,
  );
  assert.equal(tlsSanitized.failureCode, null);
  assert.equal(tlsSanitized.tls?.authorized, true);
  assert.equal(tlsSanitized.headers["content-type"], "text/xml");
  assert.equal(tlsSanitized.headers.authorization, undefined);
  assert.equal(tlsSanitized.headers["x-safe"], undefined);

  const aborted = new AbortController();
  aborted.abort();
  const invalidRequests = [
    [
      {
        profile: profile({
          lifecycle: "candidate",
          creationAllowed: false,
          activationEvidenceId: null,
        }),
      },
      "DIAG-AEAT-EDITION-INACTIVE",
    ],
    [
      { endpoint: { ...endpoint, editionDigest: `sha256:${"0".repeat(64)}` } },
      "DIAG-AEAT-TRANSPORT-BINDING",
    ],
    [
      {
        certificateAuthorization: {
          ...certificateAuthorization,
          certificateFingerprint: "invalid",
        },
      },
      "DIAG-AEAT-TRANSPORT-BINDING",
    ],
    [
      { limits: { ...input.limits, tlsTimeoutMs: 0 } },
      "DIAG-AEAT-TRANSPORT-LIMITS",
    ],
    [
      { limits: { ...input.limits, totalTimeoutMs: 99 } },
      "DIAG-AEAT-TRANSPORT-LIMITS",
    ],
    [{ signal: aborted.signal }, "DIAG-AEAT-TRANSPORT-REQUEST"],
    [{ clock: null }, "DIAG-AEAT-TRANSPORT-REQUEST"],
  ];
  for (const [override, diagnostic] of invalidRequests) {
    let calls = 0;
    const invalidRequest = await observeAeatOnce(
      {
        ...adapter,
        async observeOnce() {
          calls += 1;
          return response();
        },
      },
      { ...input, ...override },
    );
    assert.equal(invalidRequest.failureCode, diagnostic);
    assert.equal(calls, 0);
  }
});

test("public IPv4 and global IPv6 DNS answers pass filtering before credentials or sockets", async () => {
  const active = profile();
  const batch = batchPlan(active);
  const addresses = [
    { address: "8.8.8.8", family: 4 },
    { address: "2606:4700:4700::1111", family: 6 },
  ];
  for (const address of addresses) {
    let resolved = 0;
    let acquired = 0;
    const transport = createNodeHttpsTransport({
      resolver: {
        async resolve() {
          resolved += 1;
          return [address];
        },
      },
      tlsMaterials: {
        async acquire() {
          acquired += 1;
          throw new Error("synthetic credential boundary");
        },
      },
    });
    const endpoint = {
      endpointId: batch.endpointId,
      environment: "production",
      url: new URL("https://public.example.test/soap"),
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
    assert.equal(
      result.failureCode,
      "DIAG-AEAT-CREDENTIAL-UNAVAILABLE",
      address.address,
    );
    assert.equal(result.delivery, "not-started", address.address);
    assert.equal(resolved, 1, address.address);
    assert.equal(acquired, 1, address.address);
  }
});

test("HTTPS DNS filtering rejects malformed, oversized, private and transition address sets", async () => {
  const active = profile();
  const batch = batchPlan(active);
  const invalidAddressSets = [
    { addresses: [], diagnostic: "DIAG-AEAT-DNS-ADDRESS" },
    {
      addresses: Array.from({ length: 17 }, () => ({
        address: "8.8.8.8",
        family: 4,
      })),
      diagnostic: "DIAG-AEAT-DNS-ADDRESS",
    },
    {
      addresses: [{ address: "8.8.8.8", family: 6 }],
      diagnostic: "DIAG-AEAT-DNS-ADDRESS",
    },
    ...[
      "0.1.2.3",
      "10.0.0.1",
      "127.0.0.1",
      "169.254.1.1",
      "172.16.0.1",
      "172.31.255.254",
      "192.168.1.1",
      "100.64.0.1",
      "100.127.255.254",
      "198.18.0.1",
      "198.19.255.254",
      "192.0.0.1",
      "192.2.0.1",
      "198.51.100.1",
      "203.0.1.1",
      "224.0.0.1",
      "::",
      "::1",
      "fe80::1",
      "fc00::1",
      "ff02::1",
      "2001:db8::1",
      "2001:0::1",
      "2002::1",
      "3fff::1",
      "::ffff:10.0.0.1",
    ].map((address) => ({
      addresses: [{ address, family: address.includes(":") ? 6 : 4 }],
      diagnostic: "DIAG-AEAT-DNS-PRIVATE",
    })),
  ];
  for (const { addresses, diagnostic } of invalidAddressSets) {
    let acquired = 0;
    const transport = createNodeHttpsTransport({
      resolver: {
        async resolve() {
          return addresses;
        },
      },
      tlsMaterials: {
        async acquire() {
          acquired += 1;
          throw new Error("must not acquire credentials");
        },
      },
    });
    const endpoint = {
      endpointId: batch.endpointId,
      environment: "production",
      url: new URL("https://public.example.test/soap"),
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
    assert.equal(result.failureCode, diagnostic, JSON.stringify(addresses));
    assert.equal(result.delivery, "not-started");
    assert.equal(acquired, 0);
  }
});

test("HTTPS transport preflight rejects unsafe URL bindings and cancellation before DNS", async () => {
  const active = profile();
  const batch = batchPlan(active);
  const endpoint = {
    endpointId: batch.endpointId,
    environment: "production",
    url: new URL("https://public.example.test/soap"),
    serviceId: "synthetic-production",
    portId: "production-port",
    editionId: active.editionId,
    editionDigest: active.digest,
  };
  const cases = [
    {
      url: new URL("http://public.example.test/soap"),
      environment: "production",
      diagnostic: "DIAG-AEAT-TRANSPORT-PREFLIGHT",
    },
    {
      url: new URL("https://user:secret@public.example.test/soap"),
      environment: "production",
      diagnostic: "DIAG-AEAT-TRANSPORT-PREFLIGHT",
    },
    {
      url: new URL("https://public.example.test/soap#fragment"),
      environment: "production",
      diagnostic: "DIAG-AEAT-TRANSPORT-PREFLIGHT",
    },
    {
      url: new URL("https://public.example.test/soap?secret=value"),
      environment: "production",
      diagnostic: "DIAG-AEAT-TRANSPORT-PREFLIGHT",
    },
    {
      url: endpoint.url,
      environment: "test",
      diagnostic: "DIAG-AEAT-TRANSPORT-PREFLIGHT",
    },
  ];
  for (const item of cases) {
    let resolved = 0;
    const transport = createNodeHttpsTransport({
      resolver: {
        async resolve() {
          resolved += 1;
          return [{ address: "8.8.8.8", family: 4 }];
        },
      },
      tlsMaterials: {
        async acquire() {
          throw new Error("must not acquire credentials");
        },
      },
    });
    const result = await transport.observeOnce({
      profile: active,
      operationId: batch.operationId,
      context,
      endpoint: { ...endpoint, url: item.url, environment: item.environment },
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
    assert.equal(result.failureCode, item.diagnostic);
    assert.equal(resolved, 0);
  }
  const controller = new AbortController();
  controller.abort();
  let resolved = 0;
  const aborted = createNodeHttpsTransport({
    resolver: {
      async resolve() {
        resolved += 1;
        return [{ address: "8.8.8.8", family: 4 }];
      },
    },
    tlsMaterials: {
      async acquire() {
        throw new Error("must not acquire credentials");
      },
    },
  });
  const result = await aborted.observeOnce({
    profile: active,
    operationId: batch.operationId,
    context,
    endpoint,
    request: batch.request,
    certificateAuthorization: {
      ...certificateAuthorization,
      environment: "production",
    },
    signal: controller.signal,
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
  assert.equal(result.failureCode, "DIAG-AEAT-TRANSPORT-PREFLIGHT");
  assert.equal(resolved, 0);
});

test("default DNS resolver cancels an in-flight lookup without acquiring credentials", async () => {
  const active = profile();
  const batch = batchPlan(active);
  const transport = createNodeHttpsTransport({
    tlsMaterials: {
      async acquire() {
        throw new Error("DNS must complete first");
      },
    },
  });
  const notSettled = Symbol("resolver-not-settled");
  const settleWithin = async (pending) => {
    let watchdog;
    try {
      return await Promise.race([
        pending,
        new Promise((resolve) => {
          watchdog = setTimeout(() => resolve(notSettled), 250);
        }),
      ]);
    } finally {
      clearTimeout(watchdog);
    }
  };
  const makeInput = (hostname, signal, connectTimeoutMs) => ({
    profile: active,
    operationId: batch.operationId,
    context,
    endpoint: {
      endpointId: batch.endpointId,
      environment: "test",
      url: new URL(`https://${hostname}/soap`),
      serviceId: "synthetic-test",
      portId: "test-port",
      editionId: active.editionId,
      editionDigest: active.digest,
    },
    request: batch.request,
    certificateAuthorization,
    limits: {
      maxResponseBytes: 100,
      connectTimeoutMs,
      tlsTimeoutMs: 100,
      writeTimeoutMs: 100,
      firstByteTimeoutMs: 100,
      bodyIdleTimeoutMs: 100,
      totalTimeoutMs: 500,
    },
    clock: { wallNow: () => "2026-10-03T12:00:00.000Z", monotonicNow: () => 1 },
    ...(signal ? { signal } : {}),
  });
  const controller = new AbortController();
  const pending = transport.observeOnce(
    makeInput("localhost", controller.signal, 5000),
  );
  controller.abort();
  const cancelled = await settleWithin(pending);
  assert.notEqual(
    cancelled,
    notSettled,
    "DNS abort must settle its resolver promise",
  );
  assert.equal(cancelled.failureCode, "DIAG-AEAT-CANCELLED");
  assert.equal(cancelled.delivery, "not-started");

  const timedOut = await settleWithin(
    transport.observeOnce(makeInput("localhost", undefined, 0)),
  );
  assert.notEqual(
    timedOut,
    notSettled,
    "DNS timeout must settle its resolver promise",
  );
  assert.equal(timedOut.failureCode, "DIAG-AEAT-DNS");
  assert.equal(timedOut.delivery, "not-started");
});

test("credential validation fails closed before any HTTPS socket is created", async () => {
  const active = profile();
  const batch = batchPlan(active);
  const endpoint = {
    endpointId: batch.endpointId,
    environment: "production",
    url: new URL("https://public.example.test/soap"),
    serviceId: "synthetic-production",
    portId: "production-port",
    editionId: active.editionId,
    editionDigest: active.digest,
  };
  const invalidMaterials = [
    { certificatePem: "not-bytes", privateKeyPem: Buffer.from("key") },
    { certificatePem: new Uint8Array(), privateKeyPem: Buffer.from("key") },
    {
      certificatePem: Buffer.from("certificate"),
      privateKeyPem: new Uint8Array(),
    },
    {
      certificatePem: Buffer.alloc(1_048_577),
      privateKeyPem: Buffer.from("key"),
    },
    {
      certificatePem: Buffer.from("malformed certificate"),
      privateKeyPem: Buffer.from("key"),
    },
    {
      certificatePem: Buffer.from("certificate"),
      privateKeyPem: Buffer.from("key"),
      caPem: "not-bytes",
    },
  ];
  for (const material of invalidMaterials) {
    let released = 0;
    const transport = createNodeHttpsTransport({
      resolver: {
        async resolve() {
          return [{ address: "8.8.8.8", family: 4 }];
        },
      },
      tlsMaterials: {
        async acquire() {
          return material;
        },
        async release() {
          released += 1;
        },
      },
    });
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
    assert.equal(result.failureCode, "DIAG-AEAT-CREDENTIAL-UNAVAILABLE");
    assert.equal(result.delivery, "not-started");
    assert.equal(released, 1);
  }
  const acquireThrows = createNodeHttpsTransport({
    resolver: {
      async resolve() {
        return [{ address: "8.8.8.8", family: 4 }];
      },
    },
    tlsMaterials: {
      async acquire() {
        throw new Error("private provider failure");
      },
    },
  });
  const failure = await acquireThrows.observeOnce({
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
  });
  assert.equal(failure.failureCode, "DIAG-AEAT-CREDENTIAL-UNAVAILABLE");
  assert.equal(failure.delivery, "not-started");
});

test("Node HTTPS transport pins loopback DNS, verifies the TLS peer and client certificate, and sends one exact body", async (t) => {
  const {
    caPem,
    serverCertificate,
    serverKey,
    clientCertificate,
    clientKey,
    wrongHostCertificate,
    wrongHostKey,
  } = p5TestPki;
  const received = [];
  let applied = 0;
  const server = createServer(
    {
      key: serverKey,
      cert: serverCertificate,
      ca: caPem,
      requestCert: true,
      rejectUnauthorized: true,
    },
    (request, response) => {
      const chunks = [];
      request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      request.on("end", () => {
        received.push(Buffer.concat(chunks));
        if (request.url === "/drop-before-apply") {
          response.socket.destroy();
          return;
        }
        if (request.url === "/drop-after-apply") {
          applied += 1;
          response.socket.destroy();
          return;
        }
        applied += 1;
        if (request.url === "/truncated") {
          response.writeHead(200, {
            "content-type": "text/xml",
            "content-length": "100",
          });
          response.write("x");
          setTimeout(() => response.socket.destroy(), 25);
          return;
        }
        if (request.url === "/oversize") {
          response.writeHead(200, {
            "content-type": "text/xml",
            "content-length": "101",
          });
          response.end(Buffer.alloc(101, 65));
          return;
        }
        if (
          request.url === "/first-byte" ||
          request.url === "/body-idle" ||
          request.url === "/total-timeout"
        ) {
          response.writeHead(200, { "content-type": "text/xml" });
          if (request.url === "/body-idle") response.write("x");
          return;
        }
        if (request.url === "/stream-oversize") {
          response.writeHead(200, { "content-type": "text/xml" });
          response.write(Buffer.alloc(60, 65));
          response.end(Buffer.alloc(60, 66));
          return;
        }
        if (request.url === "/many-headers") {
          response.writeHead(
            200,
            Object.fromEntries(
              Array.from({ length: 33 }, (_, index) => [
                `x-safe-${index}`,
                "ok",
              ]),
            ),
          );
          response.end("ok");
          return;
        }
        response.writeHead(200, {
          "content-type": "text/xml",
          "content-length": "2",
          "set-cookie": "private",
        });
        response.end("ok");
      });
    },
  );
  server.on("tlsClientError", () => {});
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "::", resolve);
  });
  t.after(
    () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  );

  let acquired = 0;
  let released = 0;
  const transport = createNodeHttpsTransport({
    resolver: {
      async resolve() {
        return [{ address: "127.0.0.1", family: 4 }];
      },
    },
    tlsMaterials: {
      async acquire() {
        acquired += 1;
        return {
          certificatePem: clientCertificate,
          privateKeyPem: clientKey,
          caPem,
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
    environment: "test",
    url: new URL(`https://127.0.0.1:${server.address().port}/soap`),
    serviceId: "synthetic-test",
    portId: "test-port",
    editionId: active.editionId,
    editionDigest: active.digest,
  };
  const observation = await transport.observeOnce({
    profile: active,
    operationId: batch.operationId,
    context,
    endpoint,
    request: batch.request,
    certificateAuthorization,
    limits: {
      maxResponseBytes: 100,
      connectTimeoutMs: 1000,
      tlsTimeoutMs: 1000,
      writeTimeoutMs: 1000,
      firstByteTimeoutMs: 1000,
      bodyIdleTimeoutMs: 1000,
      totalTimeoutMs: 3000,
    },
    clock: {
      wallNow: () => "2026-10-03T12:00:00.000Z",
      monotonicNow: (() => {
        let n = 0;
        return () => ++n;
      })(),
    },
  });

  assert.equal(observation.statusCode, 200);
  assert.equal(observation.phase, "complete");
  assert.equal(observation.delivery, "fully-sent");
  assert.equal(observation.failureCode, null);
  assert.equal(observation.tls?.authorized, true);
  assert.match(
    observation.tls?.peerCertificateSha256 ?? "",
    /^sha256:[0-9a-f]{64}$/u,
  );
  assert.equal(observation.responseBytes.toString(), "ok");
  assert.equal(observation.headers["set-cookie"], undefined);
  assert.equal(received.length, 1);
  assert.deepEqual(received[0], Buffer.from(batch.request.bytes));
  assert.equal(acquired, 1);
  assert.equal(released, 1);

  let defaultDnsReleased = 0;
  const defaultDnsTransport = createNodeHttpsTransport({
    tlsMaterials: {
      async acquire() {
        return {
          certificatePem: clientCertificate,
          privateKeyPem: clientKey,
          caPem,
        };
      },
      async release() {
        defaultDnsReleased += 1;
      },
    },
  });
  let dnsWatchdog;
  const localhostResult = await Promise.race([
    defaultDnsTransport.observeOnce({
      profile: active,
      operationId: batch.operationId,
      context,
      endpoint: {
        ...endpoint,
        url: new URL(`https://localhost:${server.address().port}/soap`),
      },
      request: batch.request,
      certificateAuthorization,
      limits: {
        maxResponseBytes: 100,
        connectTimeoutMs: 1000,
        tlsTimeoutMs: 1000,
        writeTimeoutMs: 1000,
        firstByteTimeoutMs: 1000,
        bodyIdleTimeoutMs: 1000,
        totalTimeoutMs: 3000,
      },
      clock: {
        wallNow: () => "2026-10-03T12:00:00.000Z",
        monotonicNow: () => 1,
      },
    }),
    new Promise((resolve) => {
      dnsWatchdog = setTimeout(() => resolve(null), 5000);
    }),
  ]);
  if (dnsWatchdog) clearTimeout(dnsWatchdog);
  assert.ok(
    localhostResult,
    "default localhost DNS resolution must settle within the test bound",
  );
  const localhost = localhostResult;
  assert.equal(localhost.statusCode, 200);
  assert.equal(localhost.tls?.servername, "localhost");
  assert.equal(localhost.tls?.authorized, true);
  assert.equal(defaultDnsReleased, 1);
  assert.deepEqual(received[1], Buffer.from(batch.request.bytes));

  const wrongCredentialBinding = await transport.observeOnce({
    profile: active,
    operationId: batch.operationId,
    context,
    endpoint,
    request: batch.request,
    certificateAuthorization: {
      ...certificateAuthorization,
      certificateFingerprint: `sha256:${"0".repeat(64)}`,
    },
    limits: {
      maxResponseBytes: 100,
      connectTimeoutMs: 1000,
      tlsTimeoutMs: 1000,
      writeTimeoutMs: 1000,
      firstByteTimeoutMs: 1000,
      bodyIdleTimeoutMs: 1000,
      totalTimeoutMs: 3000,
    },
    clock: { wallNow: () => "2026-10-03T12:00:00.000Z", monotonicNow: () => 1 },
  });
  assert.equal(wrongCredentialBinding.delivery, "not-started");
  assert.equal(
    wrongCredentialBinding.failureCode,
    "DIAG-AEAT-CREDENTIAL-BINDING",
  );
  assert.equal(received.length, 2);
  assert.equal(acquired, 2);
  assert.equal(released, 2);

  const truncated = await transport.observeOnce({
    profile: active,
    operationId: batch.operationId,
    context,
    endpoint: {
      ...endpoint,
      url: new URL(`https://127.0.0.1:${server.address().port}/truncated`),
    },
    request: batch.request,
    certificateAuthorization,
    limits: {
      maxResponseBytes: 100,
      connectTimeoutMs: 1000,
      tlsTimeoutMs: 1000,
      writeTimeoutMs: 1000,
      firstByteTimeoutMs: 1000,
      bodyIdleTimeoutMs: 1000,
      totalTimeoutMs: 3000,
    },
    clock: { wallNow: () => "2026-10-03T12:00:00.000Z", monotonicNow: () => 1 },
  });
  assert.equal(truncated.delivery, "fully-sent");
  assert.equal(truncated.failureCode, "DIAG-AEAT-RESPONSE-TRUNCATED");
  assert.deepEqual(truncated.responseBytes, Buffer.from("x"));
  recordP5FaultDetection(
    "P5-FAULT-043",
    truncated.failureCode === "DIAG-AEAT-RESPONSE-TRUNCATED" &&
      truncated.delivery === "fully-sent",
  );

  const oversized = await transport.observeOnce({
    profile: active,
    operationId: batch.operationId,
    context,
    endpoint: {
      ...endpoint,
      url: new URL(`https://127.0.0.1:${server.address().port}/oversize`),
    },
    request: batch.request,
    certificateAuthorization,
    limits: {
      maxResponseBytes: 100,
      connectTimeoutMs: 1000,
      tlsTimeoutMs: 1000,
      writeTimeoutMs: 1000,
      firstByteTimeoutMs: 1000,
      bodyIdleTimeoutMs: 1000,
      totalTimeoutMs: 3000,
    },
    clock: { wallNow: () => "2026-10-03T12:00:00.000Z", monotonicNow: () => 1 },
  });
  assert.equal(oversized.failureCode, "DIAG-AEAT-RESPONSE-LIMIT");
  assert.equal(oversized.delivery, "fully-sent");
  assert.equal(oversized.responseBytes, null);
  assert.equal(acquired, 4);
  assert.equal(released, 4);
  recordP5FaultDetection(
    "P5-FAULT-042",
    oversized.failureCode === "DIAG-AEAT-RESPONSE-LIMIT" &&
      oversized.responseBytes === null,
  );

  const sendToPath = (path) =>
    transport.observeOnce({
      profile: active,
      operationId: batch.operationId,
      context,
      endpoint: {
        ...endpoint,
        url: new URL(`https://127.0.0.1:${server.address().port}${path}`),
      },
      request: batch.request,
      certificateAuthorization,
      limits: {
        maxResponseBytes: 100,
        connectTimeoutMs: 1000,
        tlsTimeoutMs: 1000,
        writeTimeoutMs: 1000,
        firstByteTimeoutMs: 1000,
        bodyIdleTimeoutMs: 1000,
        totalTimeoutMs: 3000,
      },
      clock: {
        wallNow: () => "2026-10-03T12:00:00.000Z",
        monotonicNow: () => 1,
      },
    });
  const appliedBeforeDrop = applied;
  const droppedBeforeApply = await sendToPath("/drop-before-apply");
  assert.equal(droppedBeforeApply.delivery, "fully-sent");
  assert.notEqual(droppedBeforeApply.failureCode, null);
  assert.equal(applied, appliedBeforeDrop);
  recordP5FaultDetection(
    "P5-FAULT-037",
    droppedBeforeApply.delivery === "fully-sent" &&
      droppedBeforeApply.failureCode !== null &&
      applied === appliedBeforeDrop,
  );

  const appliedBeforeLostReply = applied;
  const droppedAfterApply = await sendToPath("/drop-after-apply");
  assert.equal(droppedAfterApply.delivery, "fully-sent");
  assert.notEqual(droppedAfterApply.failureCode, null);
  assert.equal(applied, appliedBeforeLostReply + 1);
  recordP5FaultDetection(
    "P5-FAULT-038",
    droppedAfterApply.delivery === "fully-sent" &&
      droppedAfterApply.failureCode !== null &&
      applied === appliedBeforeLostReply + 1,
  );

  let wrongCaReleased = 0;
  const wrongCaTransport = createNodeHttpsTransport({
    resolver: {
      async resolve() {
        return [{ address: "127.0.0.1", family: 4 }];
      },
    },
    tlsMaterials: {
      async acquire() {
        return {
          certificatePem: clientCertificate,
          privateKeyPem: clientKey,
          caPem: clientCertificate,
        };
      },
      async release() {
        wrongCaReleased += 1;
      },
    },
  });
  const wrongPeer = await wrongCaTransport.observeOnce({
    profile: active,
    operationId: batch.operationId,
    context,
    endpoint,
    request: batch.request,
    certificateAuthorization,
    limits: {
      maxResponseBytes: 100,
      connectTimeoutMs: 1000,
      tlsTimeoutMs: 1000,
      writeTimeoutMs: 1000,
      firstByteTimeoutMs: 1000,
      bodyIdleTimeoutMs: 1000,
      totalTimeoutMs: 3000,
    },
    clock: { wallNow: () => "2026-10-03T12:00:00.000Z", monotonicNow: () => 1 },
  });
  assert.equal(wrongPeer.delivery, "not-started");
  assert.equal(wrongPeer.failureCode, "DIAG-AEAT-TLS-AUTH");
  assert.equal(wrongPeer.responseBytes, null);
  assert.equal(wrongPeer.tls, null);
  assert.equal(wrongCaReleased, 1);
  recordP5FaultDetection(
    "P5-FAULT-030",
    wrongPeer.failureCode === "DIAG-AEAT-TLS-AUTH" &&
      wrongPeer.delivery === "not-started",
  );

  const wrongHostServer = createServer(
    {
      key: wrongHostKey,
      cert: wrongHostCertificate,
      ca: caPem,
      requestCert: true,
      rejectUnauthorized: true,
    },
    (request, response) => {
      request.resume();
      request.on("end", () => response.end("ok"));
    },
  );
  await new Promise((resolve, reject) => {
    wrongHostServer.once("error", reject);
    wrongHostServer.listen(0, "127.0.0.1", resolve);
  });
  t.after(
    () =>
      new Promise((resolve, reject) =>
        wrongHostServer.close((error) => (error ? reject(error) : resolve())),
      ),
  );
  const wrongHostTransport = createNodeHttpsTransport({
    resolver: {
      async resolve() {
        return [{ address: "127.0.0.1", family: 4 }];
      },
    },
    tlsMaterials: {
      async acquire() {
        return {
          certificatePem: clientCertificate,
          privateKeyPem: clientKey,
          caPem: wrongHostCertificate,
        };
      },
    },
  });
  const wrongHost = await wrongHostTransport.observeOnce({
    profile: active,
    operationId: batch.operationId,
    context,
    endpoint: {
      ...endpoint,
      url: new URL(`https://localhost:${wrongHostServer.address().port}/soap`),
    },
    request: batch.request,
    certificateAuthorization,
    limits: {
      maxResponseBytes: 100,
      connectTimeoutMs: 1000,
      tlsTimeoutMs: 1000,
      writeTimeoutMs: 1000,
      firstByteTimeoutMs: 1000,
      bodyIdleTimeoutMs: 1000,
      totalTimeoutMs: 3000,
    },
    clock: { wallNow: () => "2026-10-03T12:00:00.000Z", monotonicNow: () => 1 },
  });
  assert.equal(wrongHost.failureCode, "DIAG-AEAT-TLS-AUTH");
  assert.equal(wrongHost.delivery, "not-started");
  recordP5FaultDetection(
    "P5-FAULT-031",
    wrongHost.failureCode === "DIAG-AEAT-TLS-AUTH" &&
      wrongHost.delivery === "not-started",
  );

  const serverFingerprint = `sha256:${createHash("sha256").update(new X509Certificate(serverCertificate).raw).digest("hex")}`;
  const wrongClient = await transport.observeOnce({
    profile: active,
    operationId: batch.operationId,
    context,
    endpoint,
    request: batch.request,
    certificateAuthorization: {
      ...certificateAuthorization,
      certificateFingerprint: serverFingerprint,
    },
    limits: {
      maxResponseBytes: 100,
      connectTimeoutMs: 1000,
      tlsTimeoutMs: 1000,
      writeTimeoutMs: 1000,
      firstByteTimeoutMs: 1000,
      bodyIdleTimeoutMs: 1000,
      totalTimeoutMs: 3000,
    },
    clock: { wallNow: () => "2026-10-03T12:00:00.000Z", monotonicNow: () => 1 },
  });
  assert.equal(wrongClient.delivery, "not-started");
  assert.notEqual(wrongClient.failureCode, null);
  recordP5FaultDetection(
    "P5-FAULT-032",
    wrongClient.delivery === "not-started" && wrongClient.failureCode !== null,
  );

  const refused = await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(async (closeError) => {
        if (closeError) return reject(closeError);
        resolve(
          await transport.observeOnce({
            profile: active,
            operationId: batch.operationId,
            context,
            endpoint: {
              ...endpoint,
              url: new URL(`https://127.0.0.1:${port}/soap`),
            },
            request: batch.request,
            certificateAuthorization,
            limits: {
              maxResponseBytes: 100,
              connectTimeoutMs: 1000,
              tlsTimeoutMs: 1000,
              writeTimeoutMs: 1000,
              firstByteTimeoutMs: 1000,
              bodyIdleTimeoutMs: 1000,
              totalTimeoutMs: 3000,
            },
            clock: {
              wallNow: () => "2026-10-03T12:00:00.000Z",
              monotonicNow: () => 1,
            },
          }),
        );
      });
    });
  });
  assert.equal(refused.delivery, "not-started");
  assert.equal(refused.failureCode, "DIAG-AEAT-NETWORK");
  recordP5FaultDetection(
    "P5-FAULT-033",
    refused.delivery === "not-started" &&
      refused.failureCode === "DIAG-AEAT-NETWORK",
  );

  const observePath = (path, overrides = {}) =>
    transport.observeOnce({
      profile: active,
      operationId: batch.operationId,
      context,
      endpoint: {
        ...endpoint,
        url: new URL(`https://127.0.0.1:${server.address().port}${path}`),
      },
      request: batch.request,
      certificateAuthorization,
      limits: {
        maxResponseBytes: 100,
        connectTimeoutMs: 500,
        tlsTimeoutMs: 500,
        writeTimeoutMs: 500,
        firstByteTimeoutMs: 25,
        bodyIdleTimeoutMs: 25,
        totalTimeoutMs: 80,
        ...overrides.limits,
      },
      clock: {
        wallNow: () => "2026-10-03T12:00:00.000Z",
        monotonicNow: () => 1,
      },
      ...(overrides.signal ? { signal: overrides.signal } : {}),
    });
  const firstByteTimeout = await observePath("/first-byte");
  assert.equal(firstByteTimeout.failureCode, "DIAG-AEAT-FIRST-BYTE-TIMEOUT");
  assert.equal(firstByteTimeout.phase, "response-headers");
  assert.equal(firstByteTimeout.delivery, "fully-sent");
  recordP5FaultDetection(
    "P5-FAULT-036",
    firstByteTimeout.failureCode === "DIAG-AEAT-FIRST-BYTE-TIMEOUT",
  );
  const bodyIdleTimeout = await observePath("/body-idle");
  assert.equal(bodyIdleTimeout.failureCode, "DIAG-AEAT-BODY-IDLE");
  assert.equal(bodyIdleTimeout.responseBytes.toString(), "x");
  const totalTimeout = await observePath("/total-timeout", {
    limits: { firstByteTimeoutMs: 500, bodyIdleTimeoutMs: 500 },
  });
  assert.equal(totalTimeout.failureCode, "DIAG-AEAT-TOTAL-TIMEOUT");
  const streamedOversize = await observePath("/stream-oversize");
  assert.equal(streamedOversize.failureCode, "DIAG-AEAT-RESPONSE-LIMIT");
  assert.ok(streamedOversize.responseBytes.byteLength <= 100);
  const headerLimit = await observePath("/many-headers");
  assert.equal(headerLimit.failureCode, "DIAG-AEAT-RESPONSE-HEADERS-LIMIT");
  const controller = new AbortController();
  const cancelledRequest = observePath("/first-byte", {
    limits: { firstByteTimeoutMs: 500 },
    signal: controller.signal,
  });
  setTimeout(() => controller.abort(), 25);
  const cancelled = await cancelledRequest;
  assert.equal(cancelled.failureCode, "DIAG-AEAT-CANCELLED");
  assert.equal(cancelled.delivery, "fully-sent");
  recordP5FaultDetection(
    "P5-FAULT-052",
    cancelled.failureCode === "DIAG-AEAT-CANCELLED" &&
      cancelled.delivery === "fully-sent",
  );

  const preAborted = new AbortController();
  preAborted.abort();
  const beforeNetwork = await observePath("/soap", {
    signal: preAborted.signal,
  });
  assert.equal(beforeNetwork.failureCode, "DIAG-AEAT-TRANSPORT-PREFLIGHT");
  recordP5FaultDetection(
    "P5-FAULT-051",
    beforeNetwork.failureCode === "DIAG-AEAT-TRANSPORT-PREFLIGHT",
  );
});
