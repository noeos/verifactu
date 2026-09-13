---
id: SEC-DOC-0014
title: Security verification plan
status: draft
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
dependencies: [SEC-DOC-0003, SEC-DOC-0005, REQ-DOC-0009]
historical-inputs: [REV-043, REV-052, REV-059, REV-064, REV-079, REV-080, REV-081]
---

# Security verification plan

## Verification layers

| Layer | Required coverage |
|---|---|
| construction/type | invalid states, context and secret types unrepresentable |
| unit/property | validators, authorization, canonicalization, limits, redaction |
| official/conformance | schemas, algorithms, catalogues, source vectors |
| adversarial/fuzz | XML/signature, decoder, diagnostics, state commands |
| integration | storage/key/network/clock adapters and authority responses |
| concurrency/fault | races, cancellation, crash points, rollback and recovery |
| supply chain | dependency/action pinning, secrets, SAST, SBOM/provenance |
| system/manual | architecture/threat review and scoped penetration testing |

Every `THR-*` maps to at least one `CTL-*`, negative test and evidence artifact.
Critical control tests must prove the test fails when the control is removed or
bypassed. Test-only substitutes cannot stand in for production parser, crypto,
storage or network configuration at release acceptance.

## Determinism and safety

Fixtures are synthetic and contain no production personal data or secrets. Fuzz
seeds and minimized regressions are versioned. Tests deny unexpected network and
file access, pin time/randomness where relevant and enforce wall/resource limits.
Flaky security tests fail the gate and are fixed; retries cannot manufacture a
pass. Reports contain tool/rule/config/database versions and complete logs safely
redacted.

## Gates and cadence

Fast deterministic negatives run on every PR. Full malicious corpora, dependency
analysis and fault/concurrency tests are required before merge or on a required
trusted workflow according to cost. Scheduled fuzz/soak and source/advisory drift
open tracked failures; release consumes a fresh successful evidence set for the
exact SHA. Security-owner review is mandatory for boundary, parser, crypto,
auth, custody, network, retention and critical-risk changes.

## Exit

Release is blocked by an uncovered critical/high threat, failed required test,
unknown scanner failure, leaked secret/data, expired exception, unverifiable
provenance or critical residual risk without explicit acceptance.
