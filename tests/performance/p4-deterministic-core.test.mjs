import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createIdentity } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/identities.js";
import { createFiscalContext } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/context.js";
import { createDecimal } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/decimal.js";
import { createAltaRecord } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/records.js";
import { planRecord } from "../../evidence/runs/artifacts/build/verifactu/dist/application/record-planner.js";

const identity = (kind, value) => createIdentity(kind, value).value;
const editionId = identity("edition", "p4-performance-edition");
const context = createFiscalContext({
  tenantId: identity("tenant", "tenant"),
  taxpayerId: identity("taxpayer", "taxpayer"),
  installationId: identity("installation", "installation"),
  editionId,
}).value;
const digest = {
  providerId: "test:node-crypto",
  digest: (algorithm, bytes) =>
    createHash(algorithm).update(bytes).digest("hex"),
};

test("P4-BUD-008 plans 1000 representative records within the smoke ceiling", () => {
  const baseline = process.memoryUsage().rss;
  const started = performance.now();
  for (let index = 0; index < 1000; index += 1) {
    const record = createAltaRecord({
      kind: "alta",
      id: identity("record", `record-${index}`),
      context,
      document: {
        issuer: context.taxpayerId,
        series: "A",
        number: String(index + 1),
        issueDate: "2025-01-01",
      },
      issueDate: "2025-01-01",
      generatedAt: "2025-01-01T12:00:00Z",
      total: createDecimal("12.34", { maxIntegerDigits: 8, maxScale: 2 }).value,
      predecessorId: null,
      editionId,
    });
    assert.equal(record.status, "ok");
    assert.equal(
      planRecord({
        record: record.value,
        operationId: identity("operation", `op-${index}`),
        expectedHead: null,
        expiresAt: "2025-01-01T12:01:00Z",
        digest,
      }).status,
      "ok",
    );
  }
  assert.ok(performance.now() - started <= 5000);
  assert.ok(process.memoryUsage().rss - baseline <= 268435456);
});
