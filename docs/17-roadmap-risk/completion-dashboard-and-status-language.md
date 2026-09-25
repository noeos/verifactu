---
id: ROADMAP-DOC-0016
title: Completion dashboard and status language
status: approved
authority: normative
owner: documentation-owner
created: 2026-09-12
last-reviewed: 2026-09-25
decisions: [ADR-0051, ADR-0052, ADR-0053, ADR-0055, ADR-0056, ADR-0057, ADR-0058]
historical-inputs: [REV-063, REV-074, REV-080]
---

# Completion dashboard and status language

Generated states are planned, ready, active, blocked, implemented, locally-
verified, CI-verified, externally-observed, published, externally-verified,
supported, deprecated and EOL. Each non-planned state links exact fresh evidence.

“Complete”, “secure”, “compliant”, “green”, “certified” and percentages cannot be
free text without scoped definition. Missing/expired/unknown evidence lowers state;
failed history remains visible. Dashboard is generated from canonical graph and
cannot edit underlying status or hide blocked work.

## Current scoped status

P1, P2, P3 and the mandatory P3-B pre-P4 assurance gate are evidence-complete
at their protected recovery points. P4 is planned but blocked: in addition to
`P3B-BASELINE-0001` and its first-commit policies, ADR-0055–0058 and the exact
machine-readable population, validator and required `gate:p4-readiness` from
[`p4-quality-plan.md`](p4-quality-plan.md) must be protected and green before
P4-A. P4–P8 remain unimplemented. `creationAllowed=false` and no fiscal-
compliance, AEAT-acceptance, publication or release claim is made.
