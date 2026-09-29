import assert from "node:assert/strict";
import test from "node:test";
import {
  createIdentity,
  createFiscalDocumentIdentity,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/identities.js";
import { createFiscalContext } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/context.js";
import {
  createFiscalDate,
  createFiscalInstant,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/date-time.js";
import { createDecimal } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/decimal.js";
import {
  createAltaRecord,
  createAnulacionRecord,
  recordsShareContext,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/records.js";
import { addCorrection } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/corrections.js";

function fixture() {
  const get = (kind, value) => createIdentity(kind, value).value;
  const taxpayer = get("taxpayer", "ES123");
  const context = createFiscalContext({
    tenantId: get("tenant", "t1"),
    taxpayerId: taxpayer,
    installationId: get("installation", "i1"),
    editionId: get("edition", "rrsif-test"),
  }).value;
  const doc = createFiscalDocumentIdentity({
    issuer: taxpayer,
    series: "A",
    number: "1",
    issueDate: "2025-01-01",
  }).value;
  return {
    get,
    taxpayer,
    context,
    doc,
    at: createFiscalInstant("2025-01-02T03:04:05Z").value,
  };
}

test("alta and anulacion enforce exhaustive kind-specific identity fields", () => {
  const f = fixture();
  assert.equal(
    createFiscalDocumentIdentity({
      ...f.doc,
      series: "s".repeat(60),
      number: "n".repeat(60),
    }).status,
    "ok",
  );
  assert.equal(
    createFiscalDocumentIdentity({ ...f.doc, series: "s".repeat(61) }).status,
    "invalid",
  );
  assert.equal(
    createFiscalDocumentIdentity({ ...f.doc, number: "n".repeat(61) }).status,
    "invalid",
  );
  const record = {
    kind: "alta",
    id: f.get("record", "r1"),
    context: f.context,
    document: f.doc,
    issueDate: createFiscalDate("2025-01-01").value,
    generatedAt: f.at,
    total: createDecimal("12.50", { maxIntegerDigits: 8, maxScale: 2 }).value,
    predecessorId: null,
    editionId: f.context.editionId,
  };
  const alta = createAltaRecord(record);
  assert.equal(alta.status, "ok");
  assert.equal(recordsShareContext(alta.value, alta.value), true);
  assert.equal(
    recordsShareContext(alta.value, {
      ...alta.value,
      context: { ...alta.value.context, tenantId: f.get("tenant", "other") },
    }),
    false,
  );
  assert.equal(
    createAltaRecord({
      ...record,
      document: { ...record.document, issuer: f.get("taxpayer", "other") },
    }).status,
    "invalid",
  );
  const cancel = {
    kind: "anulacion",
    id: f.get("record", "r2"),
    context: f.context,
    target: f.doc,
    cause: "duplicate",
    generatedAt: f.at,
    predecessorId: f.get("record", "r1"),
    editionId: f.context.editionId,
  };
  assert.equal(createAnulacionRecord(cancel).status, "ok");
  assert.equal(
    createAnulacionRecord({ ...cancel, cause: "x".repeat(256) }).status,
    "ok",
  );
  assert.equal(
    createAnulacionRecord({ ...cancel, kind: "alta" }).status,
    "invalid",
  );
  assert.equal(
    createAnulacionRecord({ ...cancel, cause: "" }).status,
    "invalid",
  );
  assert.equal(
    createAnulacionRecord({ ...cancel, target: null }).status,
    "invalid",
  );
  assert.equal(
    createAnulacionRecord({ ...cancel, cause: "x".repeat(257) }).status,
    "invalid",
  );
  assert.equal(
    createAnulacionRecord({ ...cancel, generatedAt: "bad" }).status,
    "invalid",
  );
  assert.equal(
    createAnulacionRecord({ ...cancel, predecessorId: cancel.id }).status,
    "invalid",
  );
});

test("alta construction rejects mismatched kinds, dates, totals and chain self-links", () => {
  const f = fixture();
  const record = {
    kind: "alta",
    id: f.get("record", "r1"),
    context: f.context,
    document: f.doc,
    issueDate: createFiscalDate("2025-01-01").value,
    generatedAt: f.at,
    total: createDecimal("12.50", { maxIntegerDigits: 8, maxScale: 2 }).value,
    predecessorId: null,
    editionId: f.context.editionId,
  };
  const invalidInputs = [
    { ...record, kind: "anulacion" },
    { ...record, id: f.get("tenant", "wrong-kind") },
    { ...record, editionId: f.get("record", "wrong-kind") },
    { ...record, context: null },
    { ...record, document: null },
    { ...record, issueDate: createFiscalDate("2025-01-02").value },
    { ...record, generatedAt: "no-time" },
    // Runtime callers can bypass the TypeScript Decimal type. The public
    // constructor must still reject a truthy primitive before freezing it.
    { ...record, total: "12.50" },
    { ...record, total: { ...record.total, text: 12 } },
    { ...record, total: { ...record.total, coefficient: 1n } },
    { ...record, predecessorId: record.id },
    { ...record, editionId: f.get("edition", "different") },
    {
      ...record,
      document: { ...record.document, issuer: f.get("taxpayer", "other") },
    },
  ];
  for (const input of invalidInputs)
    assert.equal(createAltaRecord(input).status, "invalid");
});

test("correction and substitution append immutable history and reject self-links/cycles", () => {
  const f = fixture();
  const second = { ...f.doc, number: "2" };
  const third = { ...f.doc, number: "3" };
  const empty = { relations: [] };
  const edge = {
    kind: "correction",
    context: f.context,
    source: second,
    target: f.doc,
    evidenceId: "e1",
  };
  const first = addCorrection(empty, edge);
  assert.equal(first.status, "ok");
  assert.equal(empty.relations.length, 0);
  const foreignContext = {
    ...f.context,
    tenantId: f.get("tenant", "foreign-tenant"),
  };
  assert.equal(
    addCorrection(first.value, {
      ...edge,
      context: foreignContext,
      source: third,
    }).status,
    "invalid",
  );
  assert.equal(
    addCorrection(first.value, {
      ...edge,
      source: f.doc,
      target: second,
      evidenceId: "e2",
    }).status,
    "invalid",
  );
  assert.equal(
    addCorrection(first.value, { ...edge, source: second, target: second })
      .status,
    "invalid",
  );
  assert.equal(
    addCorrection(first.value, {
      kind: "substitution",
      context: f.context,
      source: third,
      target: second,
      evidenceId: "e3",
    }).status,
    "ok",
  );
  assert.equal(
    addCorrection(first.value, { ...edge, evidenceId: "" }).status,
    "invalid",
  );
  assert.equal(
    addCorrection(empty, {
      ...edge,
      source: { ...edge.source, issuer: f.get("taxpayer", "other") },
    }).status,
    "invalid",
  );
  assert.equal(
    addCorrection(empty, {
      ...edge,
      target: { ...edge.target, issuer: f.get("taxpayer", "other") },
    }).status,
    "invalid",
  );
  const branch = addCorrection(first.value, {
    ...edge,
    kind: "substitution",
    target: third,
    evidenceId: "e4",
  });
  assert.equal(branch.status, "ok");
  assert.equal(
    addCorrection(
      { relations: [edge] },
      {
        ...edge,
        context: { ...f.context, tenantId: f.get("tenant", "foreign") },
      },
    ).status,
    "invalid",
  );
  const belowLimit = Array.from({ length: 99_999 }, (_, index) => ({
    ...edge,
    source: { ...second, number: `limit-${index}` },
  }));
  const nextRelation = {
    ...edge,
    source: { ...second, number: "limit-next" },
  };
  assert.equal(
    addCorrection({ relations: belowLimit }, nextRelation).status,
    "ok",
    "99,999 existing relations permit the 100,000th relation",
  );
  const atLimit = [...belowLimit, nextRelation];
  assert.equal(
    addCorrection({ relations: atLimit }, {
      ...nextRelation,
      source: { ...second, number: "limit-after-next" },
    }).status,
    "invalid",
    "a graph already containing 100,000 relations rejects another",
  );
});
