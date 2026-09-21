---
id: ROADMAP-DOC-0016
title: Completion dashboard and status language
status: approved
authority: normative
owner: documentation-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0051, ADR-0052, ADR-0053]
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

P1 and P2 are evidence-complete at their protected recovery points. P3 source
custody has a successor authoritative snapshot and candidate contract, and P3-B
is active pending its protected exact-subject closure/read-back. P4–P8 remain
planned. `creationAllowed=false` and no fiscal-compliance, AEAT-acceptance,
publication or release claim is made.
