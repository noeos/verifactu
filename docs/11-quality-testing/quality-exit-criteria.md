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
