---
id: AEAT-INDEX
title: AEAT integration documentation index
status: approved
authority: informative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-10-04
dependencies: [REG-INDEX, DOM-INDEX, SEC-INDEX]
historical-inputs: [REV-037, REV-046]
---

# AEAT integration

Status: all 18 substantive specifications are approved as design authority.
P5's executable edition-bound transport, protocol harness and deterministic
fault evidence are active on issue #113's `work/p5-implementation` branch;
exact local results are in the roadmap handoff. The local peer is synthetic and
does not establish external AEAT acceptance. Authorized portal/certificate
evidence remains an external gate.

Authority for official service bindings, network observations and remote result
classification.

Every operation is bound to an immutable regulatory edition's complete
WSDL/XSD/service corpus. The transport observes once; durable orchestration
owns batching, wait, retry and reconciliation. Local protocol evidence is
deterministic, while AEAT portal exercises are separately scoped external
observations.

Approved specifications (18):

- `services-environments-and-endpoints.md`
- `wsdl-xsd-and-binding-profile.md`
- `soap-binding-and-wire-message.md`
- `https-mtls-and-transport.md`
- `certificate-representation-and-authorization.md`
- `headers-and-system-identity.md`
- `batches-order-and-limits.md`
- `response-model.md`
- `record-correlation.md`
- `faults-and-transport-errors.md`
- `submission-timing-and-wait-instructions.md`
- `retry-policy.md`
- `indeterminate-delivery-and-reconciliation.md`
- `consultation-and-required-submission.md`
- `local-protocol-harness.md`
- `aeat-portal-validation.md`
- `protocol-drift-and-compatibility.md`
- `operational-observability-and-runbooks.md`

Exit requires exact bounded request/response semantics, fail-closed identity and
endpoint selection, durable timing/retry/ambiguity state, complete consultation
paths and hostile local-protocol coverage without treating remote availability
as a deterministic CI oracle.
