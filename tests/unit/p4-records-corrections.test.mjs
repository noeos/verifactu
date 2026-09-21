import assert from "node:assert/strict";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    "../../evidence/runs/artifacts/build/verifactu/dist/index.js"
);
const id = (kind, value) => api.identity(kind, value).value;
const date = api.parseFiscalDate("2026-09-21").value;
const instant = api.parseFiscalInstant("2026-09-21T12:00:00Z").value;
const taxpayerId = id("taxpayer", "taxpayer-1");
const edition = id("edition", "synthetic-active-edition");
const documentIdentity = (number) => ({
  issuerTaxpayerId: taxpayerId,
  series: "F",
  number,
  issuedOn: date,
});
const common = {
  id: id("record", "record-1"),
  tenantId: id("tenant", "tenant-1"),
  taxpayerId,
  installationId: id("installation", "installation-1"),
  editionId: edition,
  tenureId: "tenure-1",
  idempotencyKey: id("idempotency", "command-1"),
  recordedAt: instant,
};
const invoice = {
  identity: documentIdentity("1"),
  category: "standard",
  recipientTaxpayerId: api.absent,
  description: api.present("consulting"),
  currency: "EUR",
  taxBreakdown: [
    {
      code: "S1",
      base: api.parseDecimal("100.00").value,
      rate: api.parseDecimal("21.00").value,
      quota: api.parseDecimal("21.00").value,
    },
  ],
  totalTax: api.parseDecimal("21.00").value,
  total: api.parseDecimal("121.00").value,
  corrects: [],
  substitutes: [],
  provenance: {
    artifactId: id("artifact", "invoice-input-1"),
    digest: "a".repeat(64),
    mediaType: "application/json",
  },
};
const alta = { ...common, kind: "alta", invoice };
const rules = {
  edition,
  creationAllowed: true,
  allowedModes: ["non-verifactu", "verifactu"],
  supportedInvoiceCategories: [
    "standard",
    "simplified",
    "corrective",
    "substitution",
    "summary",
  ],
  supportedCurrencies: ["EUR"],
  supportedTaxCodes: ["S1"],
  supportedCancellationCauses: ["duplicate"],
  permitExternalCancellation: true,
};

test("P4-CB-007 alta construction preserves presence and reconciles totals", () => {
  const result = api.constructAlta(alta, rules);
  assert.equal(result.status, "accepted");
  assert.equal(result.record.invoice.recipientTaxpayerId.presence, "absent");
  assert.equal(Object.isFrozen(result.record.invoice.taxBreakdown), true);
  assert.equal(Object.isFrozen(result.record.invoice.identity), true);
  assert.equal(api.defineRecord(alta).status, "succeeded");
  assert.equal(api.recordReference(alta), null);

  assert.equal(
    api.constructAlta(
      {
        ...alta,
        invoice: { ...invoice, total: api.parseDecimal("120.00").value },
      },
      rules,
    ).status,
    "rejected",
  );
  assert.equal(
    api.constructAlta(
      {
        ...alta,
        invoice: { ...invoice, totalTax: api.parseDecimal("20.00").value },
      },
      rules,
    ).status,
    "rejected",
  );
  assert.equal(
    api.constructAlta(
      { ...alta, invoice: { ...invoice, description: api.present("") } },
      rules,
    ).status,
    "rejected",
  );
  assert.equal(
    api.constructAlta(
      {
        ...alta,
        invoice: {
          ...invoice,
          identity: { ...invoice.identity, series: "" },
        },
      },
      rules,
    ).diagnostics[0].code,
    "DIAG-INVOICE-REQUIRED",
  );
  for (const changed of [
    { category: "unsupported" },
    { currency: "USD" },
    { taxBreakdown: [{ ...invoice.taxBreakdown[0], code: "UNKNOWN" }] },
    { provenance: { ...invoice.provenance, digest: "" } },
    { identity: { ...invoice.identity, number: "" } },
  ]) {
    assert.equal(
      api.constructAlta({ ...alta, invoice: { ...invoice, ...changed } }, rules)
        .status,
      "rejected",
    );
  }
  assert.equal(
    api.defineRecord({ ...alta, idempotencyKey: "" }).status,
    "invalid",
  );
});

test("creation-disabled edition and unknown cancellation stay indeterminate", () => {
  const disabled = api.constructAlta(alta, {
    ...rules,
    creationAllowed: false,
  });
  assert.equal(disabled.status, "indeterminate");
  assert.deepEqual(disabled.requiredEvidence, [
    "approved active edition lifecycle transition",
  ]);
  const cancellation = {
    ...common,
    kind: "anulacion",
    targetIdentity: documentIdentity("0"),
    targetRecordId: api.absent,
    targetKnowledge: "unknown",
    cause: "duplicate",
    evidenceIds: [],
  };
  assert.equal(
    api.constructAnulacion(cancellation, rules).status,
    "indeterminate",
  );
  assert.equal(
    api.constructAnulacion(cancellation, {
      ...rules,
      edition: id("edition", "other"),
    }).status,
    "rejected",
  );
});

test("anulacion requires a supported cause and evidence for external targets", () => {
  const cancellation = {
    ...common,
    kind: "anulacion",
    targetIdentity: documentIdentity("0"),
    targetRecordId: api.absent,
    targetKnowledge: "verified-external",
    cause: "duplicate",
    evidenceIds: [id("evidence", "target-proof-1")],
  };
  const accepted = api.constructAnulacion(cancellation, rules);
  assert.equal(accepted.status, "accepted");
  assert.equal(api.defineRecord(accepted.record).status, "succeeded");
  assert.equal(api.recordReference(accepted.record), null);
  const local = {
    ...cancellation,
    targetKnowledge: "committed-local",
    targetRecordId: api.present(id("record", "record-0")),
  };
  assert.equal(
    api.recordReference(api.constructAnulacion(local, rules).record),
    local.targetRecordId.value,
  );
  assert.equal(
    api.constructAnulacion({ ...cancellation, cause: "unsupported" }, rules)
      .status,
    "rejected",
  );
  assert.equal(
    api.constructAnulacion({ ...cancellation, evidenceIds: [] }, rules).status,
    "rejected",
  );
  assert.equal(
    api.constructAnulacion(cancellation, {
      ...rules,
      permitExternalCancellation: false,
    }).status,
    "rejected",
  );
  assert.equal(
    api.defineRecord({ ...accepted.record, cause: "" }).status,
    "invalid",
  );
});

test("P4-CB-008 corrections append immutable history", () => {
  const entry = {
    sequence: 1,
    recordId: alta.id,
    correctedAt: instant,
    correctedBy: id("principal", "principal-1"),
    reason: "amount",
  };
  const result = api.appendCorrection([], entry);
  assert.equal(result.status, "succeeded");
  assert.equal(Object.isFrozen(result.value), true);
  const repeated = api.appendCorrection(result.value, entry);
  assert.equal(repeated.status, "conflict");
  assert.equal(repeated.diagnostics[0].parameters.expected, 2);
  assert.equal(repeated.diagnostics[0].parameters.actual, 1);
  assert.equal(
    api.appendCorrection([], { ...entry, reason: "" }).status,
    "conflict",
  );
});

test("correction/substitution graph rejects self, cycles, ambiguity and cross-context", () => {
  const context = {
    tenantId: common.tenantId,
    taxpayerId,
    installationId: common.installationId,
    editionId: edition,
  };
  const a = documentIdentity("A");
  const b = documentIdentity("B");
  const c = documentIdentity("C");
  const edge = (source, target) => ({
    kind: "correction",
    context,
    source,
    target,
    affectedPeriod: api.absent,
    affectedAmount: api.present(api.parseDecimal("1.00").value),
    evidenceIds: [id("evidence", `proof-${source.number}-${target.number}`)],
  });
  const first = api.appendCorrectionRelationship(
    { relationships: [] },
    edge(a, b),
    ["correction", "substitution", "cancellation"],
  );
  assert.equal(first.status, "succeeded");
  assert.equal(Object.isFrozen(first.value.relationships[0].source), true);
  assert.equal(api.correctionLineage(first.value, a).length, 1);
  assert.equal(api.correctionLineage(first.value, b).length, 1);
  assert.equal(
    api.appendCorrectionRelationship(first.value, edge(a, b), ["correction"])
      .status,
    "succeeded",
  );
  assert.equal(
    api.appendCorrectionRelationship(first.value, edge(c, b), ["correction"])
      .status,
    "succeeded",
  );
  assert.equal(
    api.appendCorrectionRelationship(
      first.value,
      { ...edge(a, c), kind: "substitution" },
      ["correction", "substitution"],
    ).status,
    "succeeded",
  );
  const second = api.appendCorrectionRelationship(first.value, edge(b, c), [
    "correction",
  ]);
  assert.equal(second.status, "succeeded");
  assert.equal(
    api.appendCorrectionRelationship(second.value, edge(c, a), ["correction"])
      .status,
    "conflict",
  );
  assert.equal(
    api.appendCorrectionRelationship(first.value, edge(a, c), ["correction"])
      .status,
    "conflict",
  );
  assert.equal(
    api.appendCorrectionRelationship({ relationships: [] }, edge(a, a), [
      "correction",
    ]).status,
    "conflict",
  );
  assert.equal(
    api.appendCorrectionRelationship(
      { relationships: [] },
      {
        ...edge(a, b),
        target: { ...b, issuerTaxpayerId: id("taxpayer", "other") },
      },
      ["correction"],
    ).status,
    "conflict",
  );
  assert.equal(
    api.appendCorrectionRelationship(
      { relationships: [] },
      { ...edge(a, b), kind: "substitution" },
      ["correction"],
    ).status,
    "conflict",
  );
  assert.equal(
    api.appendCorrectionRelationship(
      { relationships: [] },
      { ...edge(a, b), evidenceIds: [] },
      ["correction"],
    ).status,
    "conflict",
  );
});

test("record invariants reject self-cancellation, negative totals and context substitution", () => {
  const zero = api.parseDecimal("0.00").value;
  assert.equal(
    api.assertRecordInvariants({
      ...alta,
      invoice: {
        ...invoice,
        total: zero,
        totalTax: zero,
        taxBreakdown: [{ ...invoice.taxBreakdown[0], base: zero, quota: zero }],
      },
    }).status,
    "succeeded",
  );
  assert.equal(
    api.assertRecordInvariants({
      ...alta,
      invoice: { ...invoice, total: api.parseDecimal("-1").value },
    }).status,
    "invalid",
  );
  assert.equal(
    api.assertRecordInvariants({
      ...alta,
      invoice: { ...invoice, totalTax: api.parseDecimal("-1").value },
    }).status,
    "invalid",
  );
  assert.equal(
    api.assertRecordInvariants({
      ...alta,
      invoice: {
        ...invoice,
        taxBreakdown: [
          {
            ...invoice.taxBreakdown[0],
            base: api.parseDecimal("-1").value,
          },
        ],
      },
    }).status,
    "invalid",
  );
  assert.equal(
    api.assertRecordInvariants({
      ...alta,
      invoice: {
        ...invoice,
        taxBreakdown: [
          {
            ...invoice.taxBreakdown[0],
            quota: api.parseDecimal("-1").value,
          },
        ],
      },
    }).status,
    "invalid",
  );
  const self = {
    ...common,
    kind: "anulacion",
    targetIdentity: invoice.identity,
    targetRecordId: api.present(alta.id),
    targetKnowledge: "committed-local",
    cause: "duplicate",
    evidenceIds: [id("evidence", "proof-1")],
  };
  assert.equal(api.assertRecordInvariants(self).status, "invalid");
  assert.equal(
    api.assertRecordInvariants({
      ...alta,
      taxpayerId: id("taxpayer", "other"),
    }).status,
    "rejected",
  );
  assert.equal(api.assertRecordInvariants(alta).status, "succeeded");
  assert.equal(
    api.chainEligibleRecord(api.succeeded(alta)).status,
    "succeeded",
  );
  assert.equal(
    api.chainEligibleRecord(api.failed("indeterminate", [])).status,
    "indeterminate",
  );
  assert.equal(
    api.constructionChainEligible(api.constructAlta(alta, rules)).status,
    "succeeded",
  );
  assert.equal(
    api.constructionChainEligible(
      api.constructAlta(alta, { ...rules, creationAllowed: false }),
    ).status,
    "indeterminate",
  );
  assert.equal(
    api.constructionChainEligible(
      api.constructAlta(
        { ...alta, invoice: { ...invoice, currency: "USD" } },
        rules,
      ),
    ).status,
    "rejected",
  );
});
