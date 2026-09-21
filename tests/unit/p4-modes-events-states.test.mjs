import assert from "node:assert/strict";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    "../../evidence/runs/artifacts/build/verifactu/dist/index.js"
);
const id = (kind, value) => api.identity(kind, value).value;
const at = (value) => api.parseFiscalInstant(value).value;
const common = {
  taxpayerId: id("taxpayer", "taxpayer-1"),
  installationId: id("installation", "installation-1"),
};
const tenureEvidence = {
  decisionSource: "initial-configuration",
  authorizedBy: id("principal", "principal-1"),
  configurationId: id("configuration", "configuration-1"),
  transitionEvidenceIds: [id("evidence", "tenure-proof-1")],
  relatedEventIds: [id("event", "tenure-event-1")],
};

test("P4-CB-009 VERI*FACTU mode rollback is denied by default", () => {
  assert.equal(api.transitionMode("verifactu", "verifactu").value, "verifactu");
  assert.equal(
    api.transitionMode("non-verifactu", "verifactu").status,
    "succeeded",
  );
  assert.equal(
    api.transitionMode("verifactu", "non-verifactu").status,
    "rejected",
  );
  assert.equal(
    api.transitionMode("verifactu", "non-verifactu", true).status,
    "succeeded",
  );
});

test("P4-CB-010 explicit fiscal time selects exactly one tenure", () => {
  const tenures = [
    {
      ...common,
      id: "tenure-1",
      mode: "non-verifactu",
      beganAt: at("2026-01-01T00:00:00Z"),
      endedAt: at("2026-06-01T00:00:00Z"),
      ...tenureEvidence,
    },
    {
      ...common,
      id: "tenure-2",
      mode: "verifactu",
      beganAt: at("2026-06-01T00:00:00Z"),
      ...tenureEvidence,
    },
  ];
  assert.equal(api.validateTenureSequence(tenures).status, "succeeded");
  assert.equal(api.defineModeTenure(tenures[0]).status, "succeeded");
  assert.equal(
    api.defineModeTenure({ ...tenures[0], endedAt: tenures[0].beganAt }).status,
    "invalid",
  );
  assert.equal(
    api.tenureAt(tenures, at("2026-06-01T00:00:00Z")).value.mode,
    "verifactu",
  );
  assert.equal(
    api.tenureAt(tenures, at("2025-01-01T00:00:00Z")).status,
    "conflict",
  );
  assert.equal(
    api.validateTenureSequence([
      { ...tenures[0], endedAt: at("2026-05-01T00:00:00Z") },
      tenures[1],
    ]).status,
    "conflict",
  );
});

test("mode tenure requires authorization, configuration and transition evidence", () => {
  const tenure = {
    ...common,
    ...tenureEvidence,
    id: "tenure-1",
    mode: "verifactu",
    beganAt: at("2026-01-01T00:00:00Z"),
  };
  assert.equal(api.defineModeTenure(tenure).status, "succeeded");
  assert.equal(
    api.defineModeTenure({ ...tenure, transitionEvidenceIds: [] }).status,
    "invalid",
  );
  assert.equal(
    api.validateTenureSequence([
      { ...tenure, endedAt: at("2026-02-01T00:00:00Z") },
      {
        ...tenure,
        id: "tenure-2",
        taxpayerId: id("taxpayer", "other"),
        beganAt: at("2026-02-01T00:00:00Z"),
      },
    ]).status,
    "conflict",
  );
});

test("P4-CB-011 event chronology is separate and strictly increasing", () => {
  const principalId = id("principal", "principal-1");
  const configured = api.defineEvent({
    kind: "configured",
    id: id("event", "event-1"),
    occurredAt: at("2026-01-01T00:00:00Z"),
    principalId,
    mode: "non-verifactu",
    ...common,
  });
  const requested = api.defineEvent({
    kind: "transition-requested",
    id: id("event", "event-2"),
    occurredAt: at("2026-02-01T00:00:00Z"),
    principalId,
    target: "verifactu",
  });
  assert.equal(
    api.validateEventChronology([configured, requested]).status,
    "succeeded",
  );
  assert.equal(
    api.validateEventChronology([requested, configured]).status,
    "conflict",
  );
  assert.equal(
    api.validateEventChronology([
      configured,
      { ...requested, occurredAt: configured.occurredAt },
    ]).status,
    "conflict",
  );
});

test("regulated events bind catalogue, context, two times, origin and evidence", () => {
  const event = {
    id: id("event", "regulated-1"),
    tenantId: id("tenant", "tenant-1"),
    ...common,
    editionId: id("edition", "edition-1"),
    catalogueCode: "MODE_CHANGE",
    occurredAt: at("2026-01-01T00:00:00Z"),
    observedAt: at("2026-01-01T00:00:01Z"),
    origin: { kind: "system", authenticatedAdapterId: "adapter-1" },
    affectedIdentityIds: ["installation-1"],
    outcome: "succeeded",
    reasonCode: null,
    evidenceIds: [id("evidence", "event-proof-1")],
    priorEventId: id("event", "regulated-0"),
    integrityArtifactId: id("artifact", "event-artifact-1"),
  };
  const rules = {
    editionId: event.editionId,
    codes: ["MODE_CHANGE"],
    codesRequiringPriorEvent: ["MODE_CHANGE"],
    codesRequiringIntegrity: ["MODE_CHANGE"],
  };
  assert.equal(api.defineRegulatedEvent(event, rules).status, "succeeded");
  assert.equal(
    api.defineRegulatedEvent({ ...event, observedAt: event.occurredAt }, rules)
      .status,
    "succeeded",
  );
  assert.equal(
    api.defineRegulatedEvent({ ...event, catalogueCode: "UNKNOWN" }, rules)
      .status,
    "invalid",
  );
  assert.equal(
    api.defineRegulatedEvent(
      { ...event, observedAt: at("2025-12-31T23:59:59Z") },
      rules,
    ).status,
    "invalid",
  );
  assert.equal(
    api.defineRegulatedEvent(
      { ...event, origin: { kind: "system", authenticatedAdapterId: "" } },
      rules,
    ).status,
    "invalid",
  );
  assert.equal(
    api.defineRegulatedEvent({ ...event, evidenceIds: [] }, rules).status,
    "invalid",
  );
  assert.equal(
    api.defineRegulatedEvent(
      { ...event, outcome: "failed", reasonCode: null },
      rules,
    ).status,
    "invalid",
  );
  assert.equal(
    api.defineRegulatedEvent({ ...event, priorEventId: null }, rules).status,
    "invalid",
  );
  assert.equal(
    api.defineRegulatedEvent({ ...event, integrityArtifactId: null }, rules)
      .status,
    "invalid",
  );
});

test("P4-CB-012 state transition outcomes remain explicit", () => {
  const principalId = id("principal", "principal-1");
  const configured = {
    kind: "configured",
    id: id("event", "event-1"),
    occurredAt: at("2026-01-01T00:00:00Z"),
    principalId,
    mode: "non-verifactu",
    ...common,
  };
  const active = api.transitionInstallation(
    api.INITIAL_INSTALLATION_STATE,
    configured,
  );
  assert.equal(active.status, "succeeded");
  const pending = api.transitionInstallation(active.value, {
    kind: "transition-requested",
    id: id("event", "event-2"),
    occurredAt: at("2026-01-02T00:00:00Z"),
    principalId,
    target: "verifactu",
  });
  assert.equal(pending.value.kind, "transition-pending");
  const verifactu = api.transitionInstallation(pending.value, {
    kind: "transition-completed",
    id: id("event", "event-3"),
    occurredAt: at("2026-01-03T00:00:00Z"),
    principalId,
  });
  assert.equal(verifactu.value.mode, "verifactu");
  const suspended = api.transitionInstallation(verifactu.value, {
    kind: "fault-suspended",
    id: id("event", "event-4"),
    occurredAt: at("2026-01-04T00:00:00Z"),
    principalId,
    faultCode: "DIAG-TEST",
  });
  assert.equal(suspended.value.kind, "suspended-by-fault");
  const resumed = api.transitionInstallation(suspended.value, {
    kind: "resumed",
    id: id("event", "event-5"),
    occurredAt: at("2026-01-05T00:00:00Z"),
    principalId,
  });
  assert.equal(resumed.value.mode, "verifactu");
  assert.equal(
    api.transitionInstallation(resumed.value, {
      kind: "retired",
      id: id("event", "event-6"),
      occurredAt: at("2026-01-06T00:00:00Z"),
      principalId,
    }).value.kind,
    "retired",
  );
  assert.equal(
    api.transitionInstallation(pending.value, configured).status,
    "conflict",
  );
  assert.equal(
    api.transitionInstallation(verifactu.value, {
      kind: "transition-requested",
      id: id("event", "event-wrong-mode"),
      occurredAt: at("2026-01-03T12:00:00Z"),
      principalId,
      target: "verifactu",
    }).status,
    "conflict",
  );
  assert.equal(
    api.transitionInstallation(active.value, {
      kind: "resumed",
      id: id("event", "event-invalid-resume"),
      occurredAt: at("2026-01-03T12:00:00Z"),
      principalId,
    }).status,
    "conflict",
  );
  assert.equal(
    api.transitionInstallation(suspended.value, configured).status,
    "conflict",
  );
  for (const status of ["rejected", "unavailable", "indeterminate"]) {
    assert.equal(
      api.failed(status, [api.diagnostic("DIAG-TEST", "input", "state", "")])
        .status,
      status,
    );
  }
});

test("independent record-state dimensions reject impossible combinations", () => {
  const artifactId = id("artifact", "record-artifact-1");
  const attemptId = id("attempt", "attempt-1");
  const base = {
    construction: "accepted",
    durability: "committed",
    chainVerification: "verified",
    submission: "attempting",
    authorityResponse: "not-observed",
    correction: "original",
    conservation: "retained",
    quarantine: "clear",
    artifactId,
    attemptId,
    evidenceIds: [id("evidence", "state-proof-1")],
  };
  assert.equal(api.defineRecordLifecycle(base).status, "succeeded");
  assert.equal(
    api.defineRecordLifecycle({
      ...base,
      submission: "not-eligible",
      authorityResponse: "not-observed",
      chainVerification: "not-verified",
      artifactId: undefined,
      attemptId: undefined,
    }).status,
    "succeeded",
  );
  assert.equal(
    api.defineRecordLifecycle({
      ...base,
      submission: "accepted",
      authorityResponse: "accepted",
    }).status,
    "succeeded",
  );
  assert.equal(
    api.defineRecordLifecycle({ ...base, durability: "not-committed" }).status,
    "conflict",
  );
  assert.equal(
    api.defineRecordLifecycle({ ...base, attemptId: undefined }).status,
    "conflict",
  );
  assert.equal(
    api.defineRecordLifecycle({
      ...base,
      submission: "not-eligible",
      authorityResponse: "accepted",
      attemptId: undefined,
    }).status,
    "conflict",
  );
  assert.equal(
    api.defineRecordLifecycle({
      ...base,
      submission: "accepted",
      authorityResponse: "not-observed",
    }).status,
    "conflict",
  );
  assert.equal(
    api.defineRecordLifecycle({
      ...base,
      submission: "not-eligible",
      chainVerification: "verified",
      artifactId: undefined,
    }).status,
    "conflict",
  );
  assert.equal(
    api.defineRecordLifecycle({ ...base, quarantine: "quarantined" }).status,
    "conflict",
  );
  assert.equal(
    api.transitionSubmissionState("queued", "attempting").status,
    "succeeded",
  );
  assert.equal(
    api.transitionSubmissionState("accepted", "attempting").status,
    "conflict",
  );
  assert.equal(
    api.transitionSubmissionState("indeterminate-outcome", "attempting").status,
    "succeeded",
  );
});
