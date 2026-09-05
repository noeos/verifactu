// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSubmissionBatch,
  genesisHead,
  nextHead,
  parseAeatResponse,
  parseSecureXml,
  buildSoapRequest,
  processQueueOnce,
  transitionRecord,
  type AeatTransport,
  type Clock,
  type OutboxWork,
  type RecordCommitBundle,
  type StoredRecord,
} from "../../packages/verifactu/src/index.js";
import {
  MemoryOutboxStore,
  MemoryRecordStore,
} from "../../packages/verifactu/src/adapters/index.js";

const NOW = "2026-09-05T00:00:00.000Z";

void test("state transitions accept only the documented graph", () => {
  assert.equal(
    transitionRecord({
      recordId: "r1",
      from: "secured",
      to: "persisted",
      reason: "commit",
      attempt: 0,
      actor: "application",
      at: NOW,
    }).ok,
    true,
  );
  assert.equal(
    transitionRecord({
      recordId: "r1",
      from: "accepted",
      to: "prepared",
      reason: "invalid",
      attempt: 0,
      actor: "application",
      at: NOW,
    }).ok,
    false,
  );
  const head = genesisHead("ctx", "seq");
  const next = nextHead(head, "A".repeat(64));
  assert.ok(next.ok);
  assert.equal(next.value.position, 0);
});

void test("memory RecordStore preserves atomic bundle and rejects CAS races", async () => {
  const store = new MemoryRecordStore();
  const head = genesisHead("ctx", "seq");
  const record = sampleRecord();
  const next = nextHead(head, record.linkDigest);
  assert.ok(next.ok);
  const bundle: RecordCommitBundle = {
    record: { ...record, position: 0, state: "queued", attempt: 0 },
    head: next.value,
    transitions: [],
    evidence: [],
    outbox: [],
  };
  assert.equal((await store.commit(head, bundle)).ok, true);
  assert.equal((await store.commit(head, bundle)).ok, false);
  const loaded = await store.read(record.recordId);
  assert.ok(loaded.ok && loaded.value !== undefined);
  loaded.value.bytes[0] = 0;
  const unchanged = await store.read(record.recordId);
  assert.ok(unchanged.ok && unchanged.value !== undefined);
  assert.notEqual(unchanged.value.bytes[0], 0);
});

void test("outbox leases fence stale workers and preserve idempotency", async () => {
  const outbox = new MemoryOutboxStore();
  const work = sampleWork();
  assert.equal((await outbox.enqueue([work])).ok, true);
  assert.equal((await outbox.enqueue([{ ...work, requestDigest: "B".repeat(64) }])).ok, false);
  const leased = await outbox.lease({ owner: "worker-a", now: NOW, limit: 1, leaseSeconds: 30 });
  assert.ok(leased.ok && leased.value[0]?.lease !== undefined);
  const leasedWork = leased.value[0];
  assert.ok(leasedWork.lease !== undefined);
  const stale = { ...leasedWork.lease, token: "stale" };
  assert.equal((await outbox.markSubmitting(work.workId, stale, NOW)).ok, false);
  assert.equal((await outbox.markSubmitting(work.workId, leasedWork.lease, NOW)).ok, true);
});

void test("submission batches are bounded, deterministic and parseable as SOAP", () => {
  const result = buildSubmissionBatch({
    batchId: "b1",
    environment: "test",
    endpointId: "verifactu",
    records: [{ ...sampleRecord(), position: 7 }],
    createdAt: NOW,
    header: {
      obligadoNif: "A12345678",
      idVersion: "1.0",
      nombreSistemaInformatico: "Noeos",
      idSistemaInformatico: "NOE",
      version: "1.0.0",
      numeroInstalacion: "1",
      tipoUsoPosibleMultiOT: "N",
      tipoUsoPosibleSoloVerifactu: "S",
    },
  });
  assert.ok(result.ok);
  assert.equal(result.value.recordIds[0], "r1");
  const payload = parseSecureXml(result.value.body);
  assert.ok(payload.ok);
  assert.equal(buildSoapRequest(payload.value, "RegFactuSistemaFacturacion").ok, true);
});

void test("AEAT responses preserve partial outcomes and wait time", () => {
  const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><Respuesta><Estado>ParcialmenteCorrecto</Estado><TiempoEsperaEnvio>60</TiempoEsperaEnvio><CSV>CSV-1</CSV><RespuestaLinea><IDFactura>r1</IDFactura><Operacion>Alta</Operacion><EstadoRegistro>Correcto</EstadoRegistro></RespuestaLinea><RespuestaLinea><IDFactura>r2</IDFactura><Operacion>Alta</Operacion><EstadoRegistro>Incorrecto</EstadoRegistro><CodigoErrorRegistro>999</CodigoErrorRegistro><DescripcionErrorRegistro>error</DescripcionErrorRegistro></RespuestaLinea></Respuesta></soapenv:Body></soapenv:Envelope>`;
  const response = parseAeatResponse(new TextEncoder().encode(xml));
  assert.ok(response.ok);
  assert.deepEqual(
    {
      status: response.value.status,
      wait: response.value.waitSeconds,
      lines: response.value.lines.length,
    },
    { status: "ParcialmenteCorrecto", wait: 60, lines: 2 },
  );
});

void test("queue processor marks possible delivery indeterminate", async () => {
  const outbox = new MemoryOutboxStore();
  const work = sampleWork();
  await outbox.enqueue([work]);
  const transport: AeatTransport = {
    send: () =>
      Promise.resolve({
        ok: true,
        value: {
          requestDigest: work.requestDigest,
          responseBytes: undefined,
          httpStatus: undefined,
          bytesWritten: work.requestBytes.byteLength,
          bytesRead: 0,
          completed: false,
          receivedAt: NOW,
        },
        diagnostics: [],
      }),
  };
  const clock: Clock = { now: () => new Date(NOW) };
  const result = await processQueueOnce({
    owner: "worker",
    limit: 1,
    leaseSeconds: 30,
    clock,
    outbox,
    transport,
  });
  assert.ok(result.ok);
  const inspected = await outbox.inspect(work.workId);
  assert.ok(inspected.ok && inspected.value?.state === "indeterminate");
});

function sampleRecord(): StoredRecord {
  return Object.freeze({
    recordId: "r1",
    contextId: "ctx",
    sequenceId: "seq",
    position: 0,
    state: "secured",
    edition: "aeat-rrsif-1.0@2026-09-05",
    bytes: new TextEncoder().encode("<RegistroAlta><IDFactura>r1</IDFactura></RegistroAlta>"),
    recordDigest: "A".repeat(64),
    linkDigest: "C".repeat(64),
    createdAt: NOW,
    updatedAt: NOW,
    attempt: 0,
  });
}

function sampleWork(): OutboxWork {
  return Object.freeze({
    workId: "w1",
    recordIds: Object.freeze(["r1"]),
    requestDigest: "A".repeat(64),
    environment: "test",
    endpointId: "verifactu",
    requestBytes: new Uint8Array([1, 2, 3]),
    certificateId: "cert-1",
    createdAt: NOW,
    state: "pending",
    attempt: 0,
    nextAttemptAt: NOW,
    lease: undefined,
    responseBytes: undefined,
    lastError: undefined,
  });
}
