---
id: ADR-0040
title: Durable exact-subject release state machine
status: proposed
authority: decision
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0026, ADR-0037, ADR-0039]
historical-inputs: [REV-074, REV-079, REV-082]
---

# ADR-0040: Durable exact-subject release state machine

A release moves through `planned`, `ready`, `frozen`, `tagged`, `built`,
`verified`, `authorized`, `partially-published`, `registry-verified`,
`channels-updated`, `github-immutable`, `externally-verified` and `supported`,
plus `blocked`, `aborted`, `incident`, `deprecated` and end-of-support states.

Every transition names source/tag/tree, three package digests, edition/toolchain,
actor/workflow, prerequisites, external effects and evidence. Transitions are
idempotent; retry first observes reality and never repeats an uncertain publish.
A tag, workflow conclusion, npm version or prose assertion alone cannot infer a
later state.

A schema and model tests reject illegal order, missing subjects, conflicting
observations and false success after partial publication. The added ledger cost
is accepted because npm/GitHub effects are not transactional.
