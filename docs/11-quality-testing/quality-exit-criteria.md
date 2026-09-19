---
id: QA-DOC-0019
title: Quality exit criteria
status: approved
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0026, ADR-0027, ADR-0028, ADR-0033]
historical-inputs: [REV-056, REV-057, REV-058, REV-059, REV-060, REV-061, REV-062, REV-063, REV-064, REV-079]
---

# Quality exit criteria

Merge eligibility requires complete impacted claim paths, all required leaf and
closure checks on the final head, thresholds satisfied, no hidden skip/flake,
valid evidence schemas and no unresolved applicable critical finding. Merge is
not release qualification.

Release-candidate eligibility additionally requires the full supported matrix,
critical/noncritical mutation thresholds, extended property/fuzz/security,
calibrated performance/stress/soak, crash/recovery, package consumers, supply-
chain and integration conformance with retained exact-subject artifacts.

Stable release requires Lot 4 operational/legal/source freshness, publication
rehearsal and independent verification. Zero unowned requirements, historical
findings, expired exceptions or unknown states is mandatory. `not-applicable`
requires positive proof; accepted risk cannot waive law or misstate public
guarantees.

The approval report identifies candidate SHA, graph digest, every campaign and
residual limitation. Words such as complete, compliant, secure or compatible
are limited to that evidenced scope.

## Non-negotiable phase closure controls

Every phase must declare its complete source/test population before execution
and retain raw coverage, mutation, property, fuzz, fault, recovery,
compatibility and performance reports. Global values are not inferred from
public API tests or a passing aggregate. Critical branches and mutations need
a versioned catalogue; compile errors, timeouts, `NoCoverage`, skips and
infrastructure retries are never silently counted as kills or passes. Missing
tooling or unavailable denominators produce `blocked`.

The final-head campaign must run through the canonical task graph and the full
declared OS/runtime matrix, bound to commit, tree, toolchain, configuration and
dependency lock. A closure is invalid if any threshold or applicable control
is untested, unreported or passed only in another subject.
