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

P1, P2, P3, P3-B and the zero-code P4-readiness gate are evidence-complete at
their protected subjects. P4-A is ready at protected `main`
`763b58239d9e589e377b86928ecfc953d72f321b`; no P4 implementation has started.
P4–P8 remain unimplemented. `creationAllowed=false` and no fiscal-compliance,
AEAT-acceptance, publication or release claim is made.
