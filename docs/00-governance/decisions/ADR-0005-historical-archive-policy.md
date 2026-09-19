---
id: ADR-0005
title: Historical archive policy
status: accepted
authority: decision
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-12
supersedes: []
---

# ADR-0005: Historical archive policy

## Context

The deleted codebase produced extensive planning and `REV-001`–`REV-084`
findings. Treating it as current authority repeats old assumptions; ignoring it
repeats discovered failures.

## Options considered

1. Delete it: clean surface, lost lessons and provenance.
2. Treat it as current documentation: convenient, but contradictory and stale.
3. Preserve immutable historical input and require explicit dispositions in
   new planning: retains evidence without granting authority.

## Decision

Adopt option 3. `docs/previous-docs` is non-normative `historical-input`, covered
by a deterministic digest manifest. Every affected area must disposition old
findings and map applicable lessons into current controls and tests.

## Consequences

Planning has an inventory cost and must distinguish old remediation claims from
new evidence. Archive corrections are annotations elsewhere, never silent edits.

## Verification and reversal

CI verifies the manifest and disposition completeness. Archive removal or
mutation requires a successor ADR and preserved recoverable evidence.
