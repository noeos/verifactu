---
id: SEC-DOC-0015
title: Residual risk register and acceptance
status: approved
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
dependencies: [SEC-DOC-0003, SEC-DOC-0014, GOV-008]
historical-inputs: [REV-010, REV-011, REV-012, REV-079]
---

# Residual risk register and acceptance

## Initial risks

| ID | Residual risk after planned controls | Owner | Treatment before release |
|---|---|---|---|
| RISK-0001 | caller supplies false/incomplete fiscal facts or applicability inputs | product + integrator | explicit contract, validation, evidence; no false guarantee |
| RISK-0002 | official sources are ambiguous or change without machine-readable notice | regulatory-owner | interpretation record, monitoring, edition freeze |
| RISK-0003 | custody/storage/network adapters violate declared guarantees | security-owner | conformance kits, capability negotiation, deployment attestation |
| RISK-0004 | zero-day in parser/crypto/runtime/dependency | security-owner | minimization, isolation, bounded input, monitoring and response |
| RISK-0005 | privileged operator or build identity is compromised | repository-owner | least privilege, signed changes/releases, protected audit |
| RISK-0006 | authority outage/timeout leaves submission outcome unknown | operations-owner | durable attempt, reconciliation, no blind regeneration |
| RISK-0007 | deployment capacity is below a legally valid workload | performance-owner | calibrated sizing, admission control, observable queue bounds |
| RISK-0008 | legal retention conflicts with a data-subject request or jurisdiction | privacy + regulatory owners | scoped documented decision and restricted processing |
| RISK-0009 | clock/trust service unavailable prevents safe decision | operations-owner | fail closed, evidence, recovery procedure |
| RISK-0010 | unknown exploit bypasses a modeled control | security-owner | defense in depth, anomaly detection, incident readiness |

## Acceptance record

Acceptance is a time-bounded decision containing risk/threat IDs, affected
assets/versions/editions/environments, likelihood and impact basis, evidence,
existing and compensating controls, alternatives considered, responsible owner,
approver, start/expiry, review trigger and rollback/remediation plan. It does not
change a requirement to “met”. Critical risk cannot be accepted by the author
alone; while this repository has one human developer, an independent automated
gate plus an explicitly recorded owner decision is required, with no invented
second human approval.

## Closure and review

Expiry fails the relevant gate. Source, boundary, exploitability, dependency,
adapter, incident or edition change invalidates acceptance. Closure cites the
implemented control and fresh verification evidence; it never deletes the
historical decision. Unknown severity is treated conservatively until triaged.
