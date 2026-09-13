---
id: QA-DOC-0002
title: Claim, evidence and oracle model
status: draft
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0026, ADR-0027]
historical-inputs: [REV-062, REV-063, REV-074]
---

# Claim, evidence and oracle model

A claim is `(claim-id, exact subject, scope, edition, environment, validity
window)`. Evidence is an immutable observation, not a conclusion. A disposition
combines validated evidence with the claim rule and is one of `satisfied`,
`superseded`, `not-applicable-demonstrated`, `accepted-risk` or `blocked`.

The canonical graph MUST enforce source→requirement→decision/design→owner→test
obligation→oracle/fixture→task→CI producer→report→commit/tree/package digest.
All release-affecting nodes require complete paths; generated matrices MUST be
reproducible and carry the graph digest.

Oracle records state authority, implementation independence, supported domain,
version/digest and known limitations. Production code and its copied algorithm
cannot jointly be the only oracle. Disagreement retains raw inputs/outputs and
blocks until resolved against higher authority.

Reports MUST state selected/executed/passed/failed/error/skipped counts and
input/output identities. Meta-tests remove edges, swap SHAs, emit empty reports,
reuse old evidence and create oracle disagreement; every case MUST fail with a
stable diagnostic.
