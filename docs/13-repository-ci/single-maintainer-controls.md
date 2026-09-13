---
id: REPO-DOC-0011
title: Single-maintainer compensating controls
status: draft
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0004, ADR-0031, ADR-0033]
historical-inputs: [REV-077, REV-078, REV-081]
---

# Single-maintainer compensating controls

The repository truthfully requires zero human approvals and has no CODEOWNERS,
last-push or unattributed-change approval. Role labels separate concerns but do
not pretend distinct people. Controls are small PRs, explicit impact templates,
independent oracles, deterministic negative gates, strict current-head checks,
no main bypass, evidence retention and post-merge audit.

High-risk changes to rulesets/workflows, crypto/regulatory sources, signing,
release identity, dependencies or evidence schemas use focused PRs, machine
desired-state diff and cooling/review interval where urgency permits. The same
PR cannot silently weaken the gate that judges it: bootstrap or pre-existing
independent checks must validate policy changes.

Recovery credentials/keys are minimal, hardware-protected where available and
documented in Lot 4; possession is not routine bypass authority. Emergency use
requires `EXC-*`, immutable event/API evidence, bounded repair and retrospective
verification. Bus-factor limitations and any unavailable organization control
are reported as risk/unknown, never hidden as passing.
