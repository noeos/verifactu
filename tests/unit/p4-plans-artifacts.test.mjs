import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createIdentity } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/identities.js";
import { createFiscalContext } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/context.js";
import { createDecimal } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/decimal.js";
import {
  createFiscalDate,
  createFiscalInstant,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/date-time.js";
import {
  createAltaRecord,
  createAnulacionRecord,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/records.js";
import { createOperationPlan } from "../../evidence/runs/artifacts/build/verifactu/dist/application/operation-plan.js";
import { planRecord } from "../../evidence/runs/artifacts/build/verifactu/dist/application/record-planner.js";
import { projectOfficialFields } from "../../evidence/runs/artifacts/build/verifactu/dist/application/official-projection.js";
import { serializeOfficialProjection } from "../../evidence/runs/artifacts/build/verifactu/dist/application/official-serialization.js";
import { createFingerprint } from "../../evidence/runs/artifacts/build/verifactu/dist/application/fingerprint.js";
import {
  createXmlArtifact,
  transitionXmlArtifact,
} from "../../evidence/runs/artifacts/build/verifactu/dist/application/xml-artifacts.js";
import { digestBytes } from "../../evidence/runs/artifacts/build/verifactu/dist/ports/digest.js";
const id = (kind, value) => createIdentity(kind, value).value;
const digest = {
  providerId: "test:node-crypto",
  digest: (algorithm, bytes) =>
    createHash(algorithm).update(bytes).digest("hex"),
};
const editionId = id("edition", "p4-edition");
const context = createFiscalContext({
  tenantId: id("tenant", "tenant"),
  taxpayerId: id("taxpayer", "taxpayer"),
  installationId: id("installation", "installation"),
  editionId,
}).value;
const fields = [
  { name: "Amount", order: 2, value: { presence: "zero" } },
  { name: "Optional", order: 3, value: { presence: "empty" } },
  { name: "Name", order: 1, value: { presence: "value", value: "Café €" } },
  { name: "NilValue", order: 4, value: { presence: "nil" }, allowNil: true },
  {
    name: "AbsentValue",
    order: 5,
    value: { presence: "absent" },
    allowAbsent: true,
  },
];
const rule = {
  editionId,
  label: "FP",
  separator: "&",
  encoding: "utf-8",
  fields: ["Name", "Amount", "Optional", "NilValue"],
  nilToken: "~",
};
function recordFixture() {
  return createAltaRecord({
    kind: "alta",
    id: id("record", "record-1"),
    context,
    document: {
      issuer: context.taxpayerId,
      series: "A",
      number: "1",
      issueDate: "2025-01-01",
    },
    issueDate: "2025-01-01",
    generatedAt: "2025-01-01T12:00:00Z",
    total: createDecimal("0.00", { maxIntegerDigits: 4, maxScale: 2 }).value,
    predecessorId: null,
    editionId,
  }).value;
}
test("P4-CB-017 operation plan is effect-free and rejects undeclared effects", () => {
  const input = {
    operationId: id("operation", "op-1"),
    context,
    editionId,
    expectedHead: null,
    expiresAt: "2025-01-01T12:00:00Z",
    actions: ["validate", "project"],
  };
  const plan = createOperationPlan(input);
  assert.equal(plan.status, "ok");
  assert.equal(Object.isFrozen(plan.value), true);
  assert.equal(Object.isFrozen(plan.value.actions), true);
  assert.deepEqual(plan.value.effects, []);
  assert.equal(
    createOperationPlan({ ...input, effects: ["network"] }).status,
    "invalid",
  );
  assert.equal(
    createOperationPlan({ ...input, operationId: id("tenant", "wrong-kind") })
      .status,
    "invalid",
  );
  assert.equal(
    createOperationPlan({ ...input, editionId: id("edition", "") }).status,
    "invalid",
  );
  assert.equal(
    createOperationPlan({ ...input, expectedHead: "" }).status,
    "invalid",
  );
  assert.equal(
    createOperationPlan({ ...input, actions: [] }).status,
    "invalid",
  );
  assert.equal(
    createOperationPlan({ ...input, actions: ["unknown"] }).status,
    "invalid",
  );
  assert.equal(
    createOperationPlan({ ...input, actions: ["validate", "validate"] }).status,
    "invalid",
  );
  assert.equal(
    createOperationPlan({ ...input, effects: null }).status,
    "invalid",
  );
  assert.equal(
    createOperationPlan({
      ...input,
      context: { ...context, editionId: id("edition", "other") },
    }).status,
    "invalid",
  );
  assert.equal(
    createOperationPlan({ ...input, expiresAt: "2025-99-99T99:99:99Z" }).status,
    "invalid",
  );
  assert.equal(createOperationPlan(null).status, "invalid");
});
test("record planning validates input and returns a deterministic immutable plan", () => {
  const input = {
    record: recordFixture(),
    operationId: id("operation", "op-2"),
    expectedHead: "head-7",
    expiresAt: "2025-01-01T12:01:00Z",
  };
  const first = planRecord({ ...input, digest });
  const second = planRecord({ ...input, digest });
  assert.equal(first.status, "ok");
  assert.deepEqual(first.value, second.value);
  assert.match(first.value.semanticDigest, /^sha256:[0-9a-f]{64}$/u);
  assert.equal(Object.isFrozen(first.value), true);
  assert.equal(Object.isFrozen(first.value.context), true);
  assert.equal(Object.isFrozen(first.value.actions), true);
  assert.equal(
    planRecord({
      ...input,
      digest,
      record: {
        ...input.record,
        total: { ...input.record.total, coefficient: 1n },
      },
    }).status,
    "invalid",
  );
  assert.equal(
    planRecord({
      ...input,
      digest,
      record: { ...input.record, undeclared: "extra" },
    }).status,
    "invalid",
  );
  const withSymbol = { ...input.record, [Symbol("extra")]: "forbidden" };
  assert.equal(
    planRecord({ ...input, digest, record: withSymbol }).status,
    "invalid",
  );
  assert.equal(
    planRecord({ ...input, digest, record: { ...input.record, kind: "other" } })
      .status,
    "invalid",
  );
  const anulacion = createAnulacionRecord({
    kind: "anulacion",
    id: id("record", "cancel-1"),
    context,
    target: {
      issuer: context.taxpayerId,
      series: "A",
      number: "1",
      issueDate: "2025-01-01",
    },
    cause: "duplicate",
    generatedAt: "2025-01-01T12:00:00Z",
    predecessorId: null,
    editionId,
  });
  assert.equal(anulacion.status, "ok");
  assert.equal(
    planRecord({ ...input, digest, record: anulacion.value }).value.recordKind,
    "anulacion",
  );
});
test("official projection preserves absence, empty, zero, nil and declared field order", () => {
  const projected = projectOfficialFields(fields);
  assert.equal(projected.status, "ok");
  assert.deepEqual(
    projected.value.map(({ name, presence, value }) => ({
      name,
      presence,
      value,
    })),
    [
      { name: "Name", presence: "value", value: "Café €" },
      { name: "Amount", presence: "zero", value: "0" },
      { name: "Optional", presence: "empty", value: "" },
      { name: "NilValue", presence: "nil", value: null },
    ],
  );
  assert.equal(
    projectOfficialFields([
      { name: "Optional", order: 0, value: { presence: "absent" } },
    ]).status,
    "invalid",
  );
  assert.equal(
    projectOfficialFields([{ name: "A", order: 0, value: { presence: "nil" } }])
      .status,
    "invalid",
  );
  assert.equal(
    projectOfficialFields([
      { name: "A", order: 0, value: { presence: "value", value: "a" } },
      { name: "B", order: 0, value: { presence: "empty" } },
    ]).status,
    "invalid",
  );
  assert.equal(
    projectOfficialFields([
      { name: "bad name", order: 0, value: { presence: "empty" } },
    ]).status,
    "invalid",
  );
  assert.equal(
    projectOfficialFields([
      { name: "A", order: -1, value: { presence: "empty" } },
    ]).status,
    "invalid",
  );
  assert.equal(
    projectOfficialFields([
      { name: "A", order: 0, value: { presence: "other" } },
    ]).status,
    "invalid",
  );
  assert.equal(
    projectOfficialFields([
      { name: "A", order: 0, value: { presence: "value", value: 4 } },
    ]).status,
    "invalid",
  );
});
test("official serialization fixes UTF-8, label, separator and lexical order", () => {
  const projected = projectOfficialFields(fields).value.filter((field) =>
    rule.fields.includes(field.name),
  );
  const serialized = serializeOfficialProjection(projected, rule);
  assert.equal(serialized.status, "ok");
  assert.equal(serialized.value.text, "FP&Café €&0&&~");
  assert.deepEqual(
    [...serialized.value.bytes],
    [...new TextEncoder().encode("FP&Café €&0&&~")],
  );
  assert.equal(serialized.value.length, serialized.value.bytes.byteLength);
  assert.equal(
    serializeOfficialProjection([...projected].reverse(), rule).status,
    "invalid",
  );
  assert.equal(
    serializeOfficialProjection(projected, { ...rule, encoding: "utf16" })
      .status,
    "invalid",
  );
  assert.equal(
    serializeOfficialProjection(projected, { ...rule, label: "" }).status,
    "invalid",
  );
  assert.equal(
    serializeOfficialProjection(projected, { ...rule, editionId: "spoofed" })
      .status,
    "invalid",
  );
  assert.equal(
    serializeOfficialProjection(
      [{ name: "A", order: 0, presence: "value", value: "\ud800" }],
      { ...rule, fields: ["A"] },
    ).status,
    "invalid",
  );
  assert.equal(
    serializeOfficialProjection(
      [{ name: "A", order: 0, presence: "value", value: "\udc00" }],
      { ...rule, fields: ["A"] },
    ).status,
    "invalid",
  );
  assert.equal(
    serializeOfficialProjection(
      [{ name: "A", order: 0, presence: "value", value: "😀" }],
      { ...rule, fields: ["A"] },
    ).status,
    "ok",
  );
  assert.equal(
    serializeOfficialProjection(
      [{ name: "A", order: 0, presence: "zero", value: "00" }],
      { ...rule, fields: ["A"] },
    ).status,
    "invalid",
  );
  assert.equal(
    serializeOfficialProjection([null], { ...rule, fields: ["A"] }).status,
    "invalid",
  );
  assert.equal(
    serializeOfficialProjection(
      [{ name: "A", order: 0, presence: "value", value: "x" }],
      { ...rule, label: "\ud800", fields: ["A"] },
    ).status,
    "invalid",
  );
  assert.equal(
    serializeOfficialProjection(projected, { ...rule, separator: "0123456789" })
      .status,
    "invalid",
  );
  assert.equal(
    serializeOfficialProjection(projected, {
      ...rule,
      fields: [...rule.fields, "Extra"],
    }).status,
    "invalid",
  );
  assert.equal(
    serializeOfficialProjection(projected, { ...rule, nilToken: undefined })
      .status,
    "invalid",
  );
  assert.equal(
    serializeOfficialProjection(projected, { ...rule, nilToken: "" }).status,
    "invalid",
  );
  assert.equal(
    serializeOfficialProjection(projected, {
      ...rule,
      nilToken: "x".repeat(65),
    }).status,
    "invalid",
  );
  assert.equal(
    serializeOfficialProjection(projected, { ...rule, nilToken: "\ud800" })
      .status,
    "invalid",
  );
});
test("fingerprint recomputes only supported edition-bound digest", () => {
  const projected = projectOfficialFields(fields).value.filter((field) =>
    rule.fields.includes(field.name),
  );
  const result = createFingerprint({
    editionId,
    expectedEditionId: editionId,
    algorithm: "sha256",
    fields: projected,
    rule,
    digest,
  });
  assert.equal(result.status, "ok");
  assert.equal(
    result.value.digest,
    "sha256:" +
      createHash("sha256").update(result.value.preimage).digest("hex"),
  );
  assert.equal(result.value.preimageLength, result.value.preimage.byteLength);
  assert.equal(
    createFingerprint({
      editionId,
      expectedEditionId: id("edition", "other"),
      algorithm: "sha256",
      fields: projected,
      rule,
      digest,
    }).status,
    "invalid",
  );
  assert.equal(
    createFingerprint({
      editionId,
      expectedEditionId: editionId,
      algorithm: "sha256",
      fields: projected,
      rule: { ...rule, editionId: id("edition", "foreign-rule") },
      digest,
    }).status,
    "invalid",
  );
  assert.equal(
    createFingerprint({
      editionId,
      expectedEditionId: editionId,
      algorithm: "md5",
      fields: projected,
      rule,
      digest,
    }).status,
    "invalid",
  );
  assert.equal(
    createFingerprint({
      editionId,
      expectedEditionId: editionId,
      algorithm: "sha256",
      fields: projected,
      rule,
      digest,
      suppliedDigest: "sha256:untrusted",
    }).status,
    "invalid",
  );
  assert.equal(
    createFingerprint({
      editionId,
      expectedEditionId: editionId,
      algorithm: "sha256",
      fields: projected,
      rule,
      digest,
      suppliedDigest: result.value.digest,
    }).status,
    "ok",
  );
  assert.equal(
    createFingerprint({
      editionId: id("tenant", "wrong"),
      expectedEditionId: editionId,
      algorithm: "sha256",
      fields: projected,
      rule,
      digest,
    }).status,
    "invalid",
  );
  assert.equal(
    createFingerprint({
      editionId,
      expectedEditionId: editionId,
      algorithm: "sha512",
      fields: projected,
      rule,
      digest,
    }).value.digest,
    "sha512:" +
      createHash("sha512").update(result.value.preimage).digest("hex"),
  );
});
test("byte artifact custody snapshots bytes and permits only exact monotonic transitions", () => {
  const source = new TextEncoder().encode("<record/>");
  const artifact = createXmlArtifact(
    {
      artifactId: "artifact-1",
      context,
      editionId,
      kind: "unsigned-xml",
      mediaType: "application/xml",
      bytes: source,
      parentIds: [],
      transform: "serialize",
      state: "produced",
    },
    digest,
  );
  assert.equal(artifact.status, "ok");
  source[0] = 0;
  assert.equal(new TextDecoder().decode(artifact.value.bytes), "<record/>");
  const exposed = artifact.value.bytes;
  exposed[0] = 0;
  assert.equal(new TextDecoder().decode(artifact.value.bytes), "<record/>");
  assert.equal(artifact.value.length, 9);
  assert.equal(
    artifact.value.sha256,
    "sha256:" + createHash("sha256").update(artifact.value.bytes).digest("hex"),
  );
  assert.equal(
    artifact.value.sha512,
    "sha512:" + createHash("sha512").update(artifact.value.bytes).digest("hex"),
  );
  const bounded = transitionXmlArtifact(
    artifact.value,
    "bounded-and-digested",
    artifact.value.bytes,
    digest,
  );
  assert.equal(bounded.status, "ok");
  assert.equal(
    transitionXmlArtifact(
      bounded.value,
      "validated",
      new TextEncoder().encode("<changed/>"),
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    transitionXmlArtifact(bounded.value, "signed", bounded.value.bytes, digest)
      .status,
    "invalid",
  );
  assert.equal(
    transitionXmlArtifact(bounded.value, "validated", null, digest).status,
    "invalid",
  );
  assert.equal(
    transitionXmlArtifact(bounded.value, "unknown", bounded.value.bytes, digest)
      .status,
    "invalid",
  );
  assert.equal(
    createXmlArtifact(
      {
        artifactId: "artifact-1",
        context,
        editionId,
        kind: "xml",
        mediaType: "application/xml",
        bytes: artifact.value.bytes,
        parentIds: ["artifact-1"],
        transform: "copy",
        state: "produced",
      },
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    createXmlArtifact(
      {
        artifactId: "bad",
        context,
        editionId,
        kind: "xml",
        mediaType: "xml",
        bytes: artifact.value.bytes,
        parentIds: [],
        transform: "copy",
        state: "produced",
      },
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    createXmlArtifact(
      {
        artifactId: "bad",
        context,
        editionId,
        kind: "xml",
        mediaType: "application/xml",
        bytes: artifact.value.bytes,
        parentIds: ["p", "p"],
        transform: "copy",
        state: "produced",
      },
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    createXmlArtifact(
      {
        artifactId: "bad",
        context,
        editionId,
        kind: "xml",
        mediaType: "application/xml",
        bytes: artifact.value.bytes,
        parentIds: [],
        transform: "copy",
        state: "validated",
      },
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    createXmlArtifact(
      {
        artifactId: "bad",
        context,
        editionId,
        kind: "xml",
        mediaType: "application/xml",
        bytes: new Uint8Array(8 * 1024 * 1024 + 1),
        parentIds: [],
        transform: "copy",
        state: "produced",
      },
      digest,
    ).status,
    "invalid",
  );
});
test("decimal and date boundaries remain lexical and bounded", () => {
  assert.equal(
    createDecimal("0.00", { maxIntegerDigits: 2, maxScale: 2 }).value.text,
    "0.00",
  );
  assert.equal(
    createDecimal("01.00", { maxIntegerDigits: 2, maxScale: 2 }).status,
    "invalid",
  );
  assert.equal(createFiscalDate("2024-02-29").status, "ok");
  assert.equal(createFiscalDate("2025-02-29").status, "invalid");
  assert.equal(createFiscalInstant("2025-01-01T00:00:00+14:00").status, "ok");
  assert.equal(
    createFiscalInstant("2025-01-01T00:00:00+14:01").status,
    "invalid",
  );
});

test("digest port validates provider capability and exact lowercase output", () => {
  const bytes = new TextEncoder().encode("digest-input");
  assert.match(
    digestBytes(digest, "sha256", bytes).value,
    /^sha256:[0-9a-f]{64}$/u,
  );
  assert.equal(digestBytes(null, "sha256", bytes).status, "invalid");
  assert.equal(
    digestBytes({ providerId: "", digest: digest.digest }, "sha256", bytes)
      .status,
    "invalid",
  );
  assert.equal(
    digestBytes(
      { providerId: " padded ", digest: digest.digest },
      "sha256",
      bytes,
    ).status,
    "invalid",
  );
  assert.equal(
    digestBytes(
      { providerId: "bad\u0000id", digest: digest.digest },
      "sha256",
      bytes,
    ).status,
    "invalid",
  );
  assert.equal(
    digestBytes(
      { providerId: "x".repeat(129), digest: digest.digest },
      "sha256",
      bytes,
    ).status,
    "invalid",
  );
  assert.equal(
    digestBytes({ providerId: "bad" }, "sha256", bytes).status,
    "invalid",
  );
  assert.equal(digestBytes(digest, "md5", bytes).status, "invalid");
  assert.equal(digestBytes(digest, "sha256", "not-bytes").status, "invalid");
  assert.equal(
    digestBytes(
      {
        providerId: "throws",
        digest() {
          throw Error("secret");
        },
      },
      "sha256",
      bytes,
    ).status,
    "invalid",
  );
  assert.equal(
    digestBytes(
      { providerId: "bad-output", digest: () => "A".repeat(64) },
      "sha256",
      bytes,
    ).status,
    "invalid",
  );
});
