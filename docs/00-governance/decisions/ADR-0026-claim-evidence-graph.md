---
id: ADR-0026
title: Exact-subject claim and evidence graph
status: accepted
authority: decision
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0010, ADR-0016]
sources: [SRC-0030, SRC-0032]
historical-inputs: [REV-063, REV-074, REV-079]
---

# ADR-0026: Exact-subject claim and evidence graph

## Question and context

The deleted system linked requirements to test names but did not prove that the
named test ran, produced a valid report or tested the candidate artifact. The
project needs one machine-checkable assurance identity from authority through
release evidence.

## Options considered

- prose matrices are readable but drift and cannot prove execution;
- coverage/test-file discovery is automatable but loses claim and oracle scope;
- a typed graph with generated views costs schema/tooling work but exposes
  missing, stale and contradictory edges.

## Decision

Use one canonical graph whose nodes include source, requirement, decision,
implementation owner, verification obligation, oracle, fixture, canonical
task, CI producer, report, commit/tree, package digest, edition and disposition.
Edges have cardinality and scope rules. Generated documents are views, never a
second truth.

Evidence is valid only for its exact subject and environment. Missing,
unexecuted, skipped, malformed, stale or digest-mismatched nodes remain
`blocked`; they cannot default to satisfied. Deleting a node requires governed
impact analysis.

## Consequences and residual risks

The graph increases authoring discipline and requires stable schemas. It makes
orphan claims, fake green reports and evidence reuse detectable. Completeness
still depends on correct requirement discovery and independent review.

## Verification and reversal

Positive fixtures traverse complete claims; negatives cover unknown IDs,
cycles, wrong SHA, absent execution, invalid cardinality and orphan evidence.
Reconsider only if another representation preserves the same typed semantics,
deterministic generation and falsification tests without migration loss.
