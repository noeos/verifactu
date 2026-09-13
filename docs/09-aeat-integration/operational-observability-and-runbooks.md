---
id: AEAT-DOC-0018
title: AEAT operational observability and runbooks
status: draft
authority: normative
owner: operations-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ARCH-DOC-0014, SEC-DOC-0012]
historical-inputs: [REV-024, REV-026, REV-032, REV-041]
---

# AEAT operational observability and runbooks

Indicators cover eligible backlog age/count, oldest wait/retry/reconciliation,
attempt/result rates by safe category, transport phase latency, response size,
unknown codes/correlation failures, lease conflicts, provider availability and
certificate expiry windows. Taxpayer, invoice, record, certificate subject and
payload values are forbidden metric labels/log content.

Runbooks address AEAT outage/slowdown, TLS/certificate expiry/revocation,
endpoint/schema drift, stuck lease, growing backlog, indeterminate attempt,
partial/rejected batch, corrupted response/artifact, clock anomaly, provider
failure and credential compromise. Each states detection, safety stop, evidence
preservation, authorized diagnosis, recovery/reconciliation, validation and
communication; no runbook authorizes deletion or blind resend.

Alerts are actionable and scoped to owned behavior; the library does not claim
AEAT availability. Operational events link opaque attempt/incident IDs to
restricted evidence. Drills use the local harness and restored stores, measure
time/resource objectives and record gaps as `FND-*` before release.
