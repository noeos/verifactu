---
id: QA-DOC-0001
title: Complete-product verification strategy
status: approved
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0026, ADR-0027, ADR-0028]
historical-inputs: [REV-056, REV-062, REV-063, REV-079]
---

# Complete-product verification strategy

Verification is claim- and risk-driven across library, CLI, adapter kit, both
RRSIF modalities, every supported edition/runtime/module system and all owned
failure behavior. No MVP subset, happy-path milestone or mocked integration may
be labelled product completion.

For every requirement the assurance registry MUST name owner, implementation
surface, positive/boundary/negative obligations, independent oracle, fixture,
task, environment, report and exact subject. Depth follows regulatory,
integrity, privacy, security, irreversibility and blast-radius risk; low risk
may reduce technique count, never remove a claim without disposition.

The pyramid is not a quota: deterministic unit/property tests provide breadth;
contract tests lock public and provider boundaries; process integration proves
packaging/resources; E2E proves complete owned flows; external observations
measure only the authority/environment actually reached. All failures remain
diagnosable at the lowest responsible layer.

Merge requires bounded deterministic gates. Release additionally requires full
mutation/fuzz/security/compatibility/performance/recovery campaigns and retained
evidence. Missing, skipped, empty, stale, cancelled or malformed work blocks.
