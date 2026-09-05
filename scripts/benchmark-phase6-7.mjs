// SPDX-License-Identifier: Apache-2.0
import { performance } from "node:perf_hooks";
import { buildSubmissionBatch } from "../packages/verifactu/dist/esm/submissions/index.js";
import { MAX_BATCH_RECORDS } from "../packages/verifactu/dist/esm/submissions/model.js";

const records = Array.from({ length: MAX_BATCH_RECORDS }, (_, position) => ({
  recordId: `record-${String(position).padStart(4, "0")}`,
  contextId: "A12345678",
  sequenceId: "main",
  position,
  state: "queued",
  edition: "aeat-rrsif-1.0@2026-09-05",
  bytes: new TextEncoder().encode(
    `<RegistroAlta><IDFactura>${position}</IDFactura></RegistroAlta>`,
  ),
  recordDigest: "A".repeat(64),
  linkDigest: "B".repeat(64),
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  attempt: 0,
}));
const started = performance.now();
const result = buildSubmissionBatch({
  batchId: "benchmark",
  environment: "test",
  endpointId: "verifactu",
  records,
  createdAt: "2026-01-01T00:00:00.000Z",
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
if (!result.ok) throw new Error("Phase 6/7 batch benchmark input was rejected");
const elapsedMs = performance.now() - started;
if (elapsedMs > 10_000) throw new Error(`Phase 6/7 benchmark exceeded 10s: ${elapsedMs}`);
console.log(
  JSON.stringify({
    batchRecords: records.length,
    bodyBytes: result.value.body.byteLength,
    elapsedMs: Number(elapsedMs.toFixed(3)),
  }),
);
