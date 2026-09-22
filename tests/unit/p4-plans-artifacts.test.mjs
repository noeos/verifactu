import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    "../../evidence/runs/artifacts/build/verifactu/dist/index.js"
);
const vectors = JSON.parse(
  await readFile(
    new URL("../vectors/p4b-aeat-fingerprint.json", import.meta.url),
  ),
);
const value = (result) => {
  assert.equal(
    result.status,
    "succeeded",
    `operation status: ${result.status}`,
  );
  return result.value;
};
const id = (kind, lexical) => value(api.identity(kind, lexical));
const edition = id("edition", "rrsif-test-active");
const digest = (algorithm, bytes) =>
  new Uint8Array(
    createHash(algorithm === "SHA-256" ? "sha256" : "sha512")
      .update(bytes)
      .digest(),
  );
const field = (source, label, lexical) => ({
  source,
  label,
  lexical,
  whitespace: "trim",
});
const alta = {
  id: "AEAT-RRSIF-HUELLA-ALTA-V1",
  editionId: edition,
  fields: [
    field("issuer", "IDEmisorFactura", "text"),
    field("number", "NumSerieFactura", "text"),
    field("issuedOn", "FechaExpedicionFactura", "date-day-month-year"),
    field("invoiceType", "TipoFactura", "text"),
    field("taxTotal", "CuotaTotal", "decimal-trim-trailing-zeroes"),
    field("total", "ImporteTotal", "decimal-trim-trailing-zeroes"),
    field("predecessor", "Huella", "text"),
    field("generatedAt", "FechaHoraHusoGenRegistro", "instant"),
  ],
};
const anulacion = {
  id: "AEAT-RRSIF-HUELLA-ANULACION-V1",
  editionId: edition,
  fields: [
    field("issuer", "IDEmisorFacturaAnulada", "text"),
    field("number", "NumSerieFacturaAnulada", "text"),
    field("issuedOn", "FechaExpedicionFacturaAnulada", "date-day-month-year"),
    field("predecessor", "Huella", "text"),
    field("generatedAt", "FechaHoraHusoGenRegistro", "instant"),
  ],
};
const serializationDescriptor = (projectionDescriptorId) => ({
  projectionDescriptorId,
  encoding: "UTF-8",
  fieldSeparator: "&",
  nameValueSeparator: "=",
  absent: "empty",
  xsiNil: "empty",
});
const fingerprintDescriptor = (descriptorId) => ({
  id: `${descriptorId}-SHA256`,
  editionId: edition,
  algorithm: "SHA-256",
  output: "uppercase-hex",
});

function officialInput(vector) {
  const input = {
    issuer: { state: "text", value: vector.values.issuer },
    number: { state: "text", value: vector.values.number },
    issuedOn: {
      state: "date",
      value: value(api.parseFiscalDate(vector.values.issuedOn)),
    },
    predecessor:
      vector.values.predecessor === ""
        ? { state: "empty" }
        : { state: "text", value: vector.values.predecessor },
    generatedAt: {
      state: "instant",
      value: value(api.parseFiscalInstant(vector.values.generatedAt)),
    },
  };
  if (vector.kind === "alta") {
    input.invoiceType = { state: "text", value: vector.values.invoiceType };
    input.taxTotal = {
      state: "decimal",
      value: value(api.parseDecimal(vector.values.taxTotal)),
    };
    input.total = {
      state: "decimal",
      value: value(api.parseDecimal(vector.values.total)),
    };
  }
  return input;
}

test("P4-CB-019/020/021 official AEAT projections preserve exact ordered UTF-8 preimages and hashes", () => {
  for (const vector of vectors.vectors) {
    const descriptor = vector.kind === "alta" ? alta : anulacion;
    const projection = value(
      api.projectOfficialFields(descriptor, edition, officialInput(vector)),
    );
    const serialized = value(
      api.serializeOfficialProjection(
        projection,
        serializationDescriptor(descriptor.id),
      ),
    );
    assert.equal(serialized.text, vector.preimage, vector.id);
    assert.deepEqual(
      serialized.bytes,
      [...new TextEncoder().encode(vector.preimage)],
      vector.id,
    );
    const fingerprint = value(
      api.computeFingerprint(
        fingerprintDescriptor(descriptor.id),
        edition,
        api.officialSerializationBytes(serialized),
        digest,
      ),
    );
    assert.equal(fingerprint.value, vector.fingerprint, vector.id);
  }
});

test("P4-CB-019 projection preserves absent, empty, zero, xsi:nil, and descriptor order", () => {
  const descriptor = {
    id: "presence",
    editionId: edition,
    fields: [
      field("missing", "Missing", "text"),
      field("empty", "Empty", "text"),
      field("zero", "Zero", "decimal-trim-trailing-zeroes"),
      field("nil", "Nil", "text"),
    ],
  };
  const projected = value(
    api.projectOfficialFields(descriptor, edition, {
      empty: { state: "empty" },
      zero: { state: "decimal", value: value(api.parseDecimal("0.00")) },
      nil: { state: "xsi-nil" },
    }),
  );
  assert.deepEqual(
    projected.fields.map(({ label, state, lexical }) => ({
      label,
      state,
      lexical,
    })),
    [
      { label: "Missing", state: "absent", lexical: undefined },
      { label: "Empty", state: "empty", lexical: undefined },
      { label: "Zero", state: "value", lexical: "0" },
      { label: "Nil", state: "xsi-nil", lexical: undefined },
    ],
  );
  assert.equal(
    value(
      api.serializeOfficialProjection(projected, {
        ...serializationDescriptor("presence"),
        absent: "omit",
        xsiNil: "xsi:nil",
      }),
    ).text,
    "Empty=&Zero=0&Nil=xsi:nil",
  );
  assert.equal(
    api.projectOfficialFields(
      { ...descriptor, editionId: id("edition", "other") },
      edition,
      {},
    ).status,
    "invalid",
  );
  assert.equal(
    api.projectOfficialFields(
      { ...descriptor, fields: [descriptor.fields[0], descriptor.fields[0]] },
      edition,
      {},
    ).status,
    "invalid",
  );
  assert.equal(
    api.projectOfficialFields(
      { ...descriptor, fields: [field("x", "Bad&Label", "text")] },
      edition,
      {},
    ).status,
    "invalid",
  );
  assert.equal(
    api.projectOfficialFields(
      { ...descriptor, fields: [field("x", "X", "instant")] },
      edition,
      { x: { state: "text", value: "x" } },
    ).status,
    "invalid",
  );
  for (const invalid of [
    { ...descriptor, id: "" },
    { ...descriptor, fields: [] },
    {
      ...descriptor,
      fields: [field("same", "One", "text"), field("same", "Two", "text")],
    },
    {
      ...descriptor,
      fields: [field("one", "Same", "text"), field("two", "Same", "text")],
    },
    { ...descriptor, fields: [field("", "Valid", "text")] },
    { ...descriptor, fields: [field("valid", "", "text")] },
    { ...descriptor, fields: [field("valid", "Bad=Label", "text")] },
  ]) {
    assert.equal(
      api.projectOfficialFields(invalid, edition, {}).status,
      "invalid",
    );
  }

  const lexicalDescriptor = (lexical, whitespace = "preserve") => ({
    id: `lexical-${lexical}`,
    editionId: edition,
    fields: [{ source: "value", label: "Value", lexical, whitespace }],
  });
  assert.equal(
    value(
      api.projectOfficialFields(lexicalDescriptor("decimal-exact"), edition, {
        value: { state: "decimal", value: value(api.parseDecimal("1.20")) },
      }),
    ).fields[0].lexical,
    "1.20",
  );
  assert.equal(
    value(
      api.projectOfficialFields(
        lexicalDescriptor("decimal-trim-trailing-zeroes"),
        edition,
        { value: { state: "decimal", value: value(api.parseDecimal("12")) } },
      ),
    ).fields[0].lexical,
    "12",
  );
  assert.equal(
    value(
      api.projectOfficialFields(lexicalDescriptor("date-iso"), edition, {
        value: {
          state: "date",
          value: value(api.parseFiscalDate("2026-09-22")),
        },
      }),
    ).fields[0].lexical,
    "2026-09-22",
  );
  assert.equal(
    value(
      api.projectOfficialFields(
        lexicalDescriptor("text", "preserve"),
        edition,
        {
          value: { state: "text", value: " spaced " },
        },
      ),
    ).fields[0].lexical,
    " spaced ",
  );
});

test("P4-CB-020 serialization rejects descriptor drift", () => {
  const projection = value(
    api.projectOfficialFields(alta, edition, officialInput(vectors.vectors[0])),
  );
  for (const drift of [
    { projectionDescriptorId: "other" },
    { encoding: "UTF-16" },
    { fieldSeparator: ";" },
    { nameValueSeparator: ":" },
  ]) {
    assert.equal(
      api.serializeOfficialProjection(projection, {
        ...serializationDescriptor(alta.id),
        ...drift,
      }).status,
      "invalid",
    );
  }
  const presence = value(
    api.projectOfficialFields(
      {
        id: "nil-omit",
        editionId: edition,
        fields: [field("nil", "Nil", "text")],
      },
      edition,
      { nil: { state: "xsi-nil" } },
    ),
  );
  assert.equal(
    value(
      api.serializeOfficialProjection(presence, {
        ...serializationDescriptor("nil-omit"),
        xsiNil: "omit",
      }),
    ).text,
    "",
  );
});

test("P4-CB-021 fingerprint recomputes and rejects algorithm, edition, lexical, and digest drift", () => {
  const bytes = new TextEncoder().encode("exact bytes");
  const descriptor = fingerprintDescriptor(alta.id);
  let calls = 0;
  const observedDigest = (algorithm, value) => {
    calls += 1;
    return digest(algorithm, value);
  };
  assert.equal(
    value(
      api.verifyFingerprint(
        descriptor,
        edition,
        bytes,
        "0".repeat(64),
        observedDigest,
      ),
    ),
    false,
  );
  assert.equal(
    calls,
    1,
    "verification must recompute instead of trusting supplied digest",
  );
  assert.equal(
    api.verifyFingerprint(descriptor, edition, bytes, "lowercase", digest)
      .status,
    "invalid",
  );
  assert.equal(
    api.computeFingerprint(
      { ...descriptor, algorithm: "SHA-1" },
      edition,
      bytes,
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    api.computeFingerprint({ ...descriptor, id: "" }, edition, bytes, digest)
      .status,
    "invalid",
  );
  assert.equal(
    api.computeFingerprint(
      { ...descriptor, output: "lowercase-hex" },
      edition,
      bytes,
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    api.computeFingerprint(descriptor, id("edition", "other"), bytes, digest)
      .status,
    "invalid",
  );
  assert.equal(
    api.computeFingerprint(descriptor, edition, bytes, () => new Uint8Array(31))
      .status,
    "invalid",
  );
  assert.equal(
    api.computeFingerprint(descriptor, edition, bytes, () => {
      throw new Error("fault");
    }).status,
    "invalid",
  );
  assert.equal(
    api.verifyFingerprint(
      descriptor,
      edition,
      bytes,
      "0".repeat(64),
      () => new Uint8Array(31),
    ).status,
    "invalid",
  );
});

test("P4-CB-022 exact bytes, length, parents, dual digests, and custody survive transitions", () => {
  const original = new Uint8Array([0, 1, 2, 10, 13, 255]);
  const artifact = value(
    api.createByteArtifact(
      {
        id: id("artifact", "artifact-1"),
        kind: "fingerprint-preimage",
        tenantId: id("tenant", "tenant-1"),
        editionId: edition,
        profileId: "profile-1",
        producer: "p4-record-planner",
        createdAt: value(api.parseFiscalInstant("2026-09-21T10:00:00+02:00")),
        creationTimeSource: "explicit-command-time",
        mediaType: "text/plain;charset=UTF-8",
        bytes: original,
        parentIds: [id("artifact", "source-1")],
        transformation: "official-fingerprint-projection",
        validationClaims: ["official-vector-matched"],
        custodian: "tenant-store",
        retentionClass: "fiscal-record",
      },
      digest,
    ),
  );
  original[0] = 99;
  assert.deepEqual(
    [...api.byteArtifactBytes(artifact)],
    [0, 1, 2, 10, 13, 255],
  );
  assert.equal(artifact.byteLength, 6);
  assert.equal(
    artifact.sha256,
    createHash("sha256").update(Uint8Array.from(artifact.bytes)).digest("hex"),
  );
  assert.equal(
    artifact.sha512,
    createHash("sha512").update(Uint8Array.from(artifact.bytes)).digest("hex"),
  );
  let current = artifact;
  for (const state of ["validated", "stored", "submitted", "acknowledged"]) {
    const next = value(api.transitionByteArtifact(current, state));
    assert.deepEqual(next.bytes, artifact.bytes);
    assert.equal(next.sha256, artifact.sha256);
    assert.equal(next.sha512, artifact.sha512);
    assert.deepEqual(next.parentIds, artifact.parentIds);
    current = next;
  }
  assert.equal(api.transitionByteArtifact(current, "stored").status, "invalid");
  assert.equal(
    api.createByteArtifact(
      {
        ...artifact,
        id: artifact.parentIds[0],
        bytes: new Uint8Array(),
        parentIds: [artifact.parentIds[0]],
      },
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    api.createByteArtifact(
      { ...artifact, bytes: new Uint8Array() },
      () => new Uint8Array(),
    ).status,
    "invalid",
  );
  assert.equal(
    api.createByteArtifact(
      { ...artifact, id: "", bytes: new Uint8Array() },
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    api.createByteArtifact(
      { ...artifact, kind: "", bytes: new Uint8Array() },
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    api.createByteArtifact(
      { ...artifact, mediaType: "", bytes: new Uint8Array() },
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    api.createByteArtifact(
      {
        ...artifact,
        bytes: new Uint8Array(),
        parentIds: [id("artifact", "duplicate"), id("artifact", "duplicate")],
      },
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    api.createByteArtifact(
      { ...artifact, bytes: new Uint8Array() },
      (algorithm, input) => {
        if (algorithm === "SHA-512") throw new Error("provider fault");
        return digest(algorithm, input);
      },
    ).status,
    "invalid",
  );
  assert.equal(
    api.createByteArtifact(
      { ...artifact, bytes: new Uint8Array() },
      (algorithm) => new Uint8Array(algorithm === "SHA-256" ? 32 : 63),
    ).status,
    "invalid",
  );
  for (const key of [
    "profileId",
    "producer",
    "creationTimeSource",
    "transformation",
    "custodian",
    "retentionClass",
  ]) {
    assert.equal(
      api.createByteArtifact(
        { ...artifact, [key]: "", bytes: new Uint8Array() },
        digest,
      ).status,
      "invalid",
      key,
    );
  }
});

function planInput(creationAllowed = true) {
  return {
    planId: "plan-1",
    commandId: "command-1",
    idempotencyKey: id("idempotency", "idem-1"),
    contextId: "tenant-1:taxpayer-1:installation-1",
    editionId: edition,
    configurationId: id("configuration", "configuration-1"),
    preparedAt: value(api.parseFiscalInstant("2026-09-21T10:00:00+02:00")),
    expiresAt: value(api.parseFiscalInstant("2026-09-21T10:05:00+02:00")),
    observedHead: {
      scope: "chain-1",
      version: "v7",
      recordId: null,
      fingerprint: null,
    },
    recordId: id("record", "record-1"),
    artifactIds: [id("artifact", "artifact-1"), id("artifact", "artifact-2")],
    editionPolicy: { edition, creationAllowed, allowedModes: ["verifactu"] },
    fingerprint: "A".repeat(64),
    semanticInputDigest: "1".repeat(64),
    configurationDigest: "2".repeat(64),
  };
}

test("P4-CB-017/018 plans contain closed descriptions only, are deterministic, immutable, and policy-bound", () => {
  const first = value(api.planRecord(planInput(), digest));
  const second = value(api.planRecord(structuredClone(planInput()), digest));
  assert.deepEqual(
    api.operationPlanBytes(first),
    api.operationPlanBytes(second),
  );
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.effects));
  assert.ok(Object.isFrozen(first.binding));
  assert.ok(first.effects.every(Object.isFrozen));
  const expectedBindingMaterial = [
    first.commandId,
    first.idempotencyKey,
    first.contextId,
    first.editionId,
    first.configurationId,
    first.binding.semanticInputDigest,
    first.binding.configurationDigest,
    first.observedHead.scope,
    first.observedHead.version,
    first.expiresAt,
  ].join("\n");
  assert.equal(
    first.binding.token,
    createHash("sha256").update(expectedBindingMaterial).digest("hex"),
  );
  assert.equal(
    api.planRecord(planInput(false), digest).status,
    "indeterminate",
  );
  assert.equal(
    api.planRecord(
      { ...planInput(), editionId: id("edition", "other") },
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    api.planRecord({ ...planInput(), semanticInputDigest: "bad" }, digest)
      .status,
    "invalid",
  );
  assert.equal(
    api.planRecord({ ...planInput(), configurationDigest: "bad" }, digest)
      .status,
    "invalid",
  );
  assert.equal(
    api.planRecord(
      { ...planInput(), expiresAt: planInput().preparedAt },
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    api.planRecord(planInput(), () => new Uint8Array(31)).status,
    "defect",
  );
  assert.equal(
    api.planRecord(planInput(), () => {
      throw new Error("provider fault");
    }).status,
    "defect",
  );
  assert.equal(
    api.defineOperationPlan({ ...first, undeclared: true }).status,
    "invalid",
  );
  assert.equal(
    api.defineOperationPlan({
      ...first,
      effects: [{ kind: "send-network", url: "https://example.invalid" }],
    }).status,
    "invalid",
  );
  assert.equal(
    api.defineOperationPlan({
      ...first,
      effects: [
        { kind: "store-artifact", artifactId: id("artifact", "not-declared") },
      ],
    }).status,
    "invalid",
  );
  assert.equal(
    api.defineOperationPlan({
      ...first,
      effects: [{ kind: "append-record", recordId: id("record", "other") }],
    }).status,
    "invalid",
  );
  assert.equal(
    api.defineOperationPlan({
      ...first,
      effects: [
        {
          kind: "compare-and-set-head",
          scope: "wrong",
          expectedVersion: "v7",
          recordId: first.recordId,
          fingerprint: "A".repeat(64),
        },
      ],
    }).status,
    "invalid",
  );

  const decoded = JSON.parse(
    new TextDecoder().decode(api.operationPlanBytes(first)),
  );
  assert.deepEqual(decoded, first);
  const requiredScalars = [
    "planId",
    "commandId",
    "idempotencyKey",
    "contextId",
    "editionId",
    "configurationId",
    "preparedAt",
    "expiresAt",
    "recordId",
  ];
  for (const key of requiredScalars) {
    assert.equal(
      api.defineOperationPlan({ ...first, [key]: "" }).status,
      "invalid",
      key,
    );
  }
  for (const candidate of [
    null,
    [],
    { ...first, version: 2 },
    { ...first, artifactIds: "not-an-array" },
    { ...first, artifactIds: [] },
    { ...first, artifactIds: [first.artifactIds[0], first.artifactIds[0]] },
    { ...first, observedHead: null },
    { ...first, observedHead: { ...first.observedHead, extra: true } },
    { ...first, observedHead: { ...first.observedHead, scope: "" } },
    { ...first, observedHead: { ...first.observedHead, version: "" } },
    { ...first, binding: null },
    { ...first, binding: { ...first.binding, extra: true } },
    { ...first, binding: { ...first.binding, semanticInputDigest: "bad" } },
    { ...first, binding: { ...first.binding, configurationDigest: "bad" } },
    { ...first, binding: { ...first.binding, contextId: "wrong" } },
    {
      ...first,
      binding: { ...first.binding, editionId: id("edition", "wrong") },
    },
    { ...first, binding: { ...first.binding, headVersion: "wrong" } },
    {
      ...first,
      binding: {
        ...first.binding,
        expiresAt: value(api.parseFiscalInstant("2026-09-21T10:06:00+02:00")),
      },
    },
    { ...first, binding: { ...first.binding, token: "bad" } },
    { ...first, effects: "not-an-array" },
    { ...first, effects: [] },
  ]) {
    assert.equal(api.defineOperationPlan(candidate).status, "invalid");
  }
  for (const effect of [
    null,
    { kind: 1 },
    { kind: "store-artifact", artifactId: first.artifactIds[0], extra: true },
    { kind: "store-artifact", artifactId: "" },
    {
      kind: "compare-and-set-head",
      scope: first.observedHead.scope,
      expectedVersion: "wrong",
      recordId: first.recordId,
      fingerprint: "A".repeat(64),
    },
    {
      kind: "compare-and-set-head",
      scope: first.observedHead.scope,
      expectedVersion: first.observedHead.version,
      recordId: id("record", "wrong"),
      fingerprint: "A".repeat(64),
    },
    {
      kind: "compare-and-set-head",
      scope: first.observedHead.scope,
      expectedVersion: first.observedHead.version,
      recordId: first.recordId,
      fingerprint: "",
    },
  ]) {
    assert.equal(
      api.defineOperationPlan({ ...first, effects: [effect] }).status,
      "invalid",
    );
  }
  assert.equal(
    api.defineOperationPlan({
      ...first,
      observedHead: { ...first.observedHead, recordId: () => "executable" },
    }).status,
    "invalid",
  );
});
