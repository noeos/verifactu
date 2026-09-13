---
id: ADR-0003
title: Docs-as-code governance
status: proposed
authority: decision
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-12
supersedes: []
---

# ADR-0003: Docs-as-code governance

## Context

Implementation cannot be verified against plans that are unversioned,
ambiguous, duplicated or detached from changes and evidence.

## Options considered

1. Free-form repository prose: accessible, but weakly enforceable.
2. External planning system as authority: rich workflow, but history and access
   can diverge from code.
3. Versioned Markdown plus validated metadata, generated views and ADRs:
   reviewable with code and machine-checkable without hiding rationale.

## Decision

Adopt option 3. Canonical requirements and decisions live in the repository.
Schemas validate metadata; matrices are generated; executable gates run locally
and in CI. External systems may mirror or coordinate but are not canonical.

## Consequences

Authors must maintain identifiers and traceability. Checker/tooling work is
required before approval. Markdown remains readable without proprietary tools;
large execution artifacts live in governed evidence storage rather than Git.

## Verification and reversal

Negative fixtures prove enforcement and regeneration must produce a clean tree.
A successor must preserve history, portability and traceability during any
format migration.
