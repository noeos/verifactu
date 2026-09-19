---
id: DOM-DOC-0009
title: States, correction and substitution
status: approved
authority: normative
owner: domain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [DOM-DOC-0005, DOM-DOC-0007]
historical-inputs: [REV-021, REV-022, REV-023, REV-031]
---

# States, correction and substitution

## Independent state dimensions

A record has immutable construction state and independent append-only dimensions:
durability, chain verification, submission, authority response, correction
relationship, conservation and quarantine. They are not collapsed into one enum.
For example, `acceptedByAuthority` does not mean `uncorrected`, and `rejected`
transport does not make a committed local record disappear.

## Submission state

Allowed progression is `notEligible` → `queued` → `attempting` → one of
`accepted`, `acceptedWithQualification`, `rejected`, `retryableFailure`,
`indeterminateOutcome`. A retryable or indeterminate result creates a new attempt
after reconciliation; it does not regenerate the record. State transitions are
conditioned on authenticated response semantics of the pinned edition.

## Correction graph

Correction and substitution edges identify source and target fiscal documents,
legal relationship, affected period/amounts and evidence. Graph validation
prevents self-reference, forbidden cycles, cross-context relations, ambiguous
targets and unsupported relationship types. Originals remain queryable and
exports reproduce the complete lineage.

## Cancellation and duplicates

Cancellation adds an `AnulacionRecord` relation. Physical deletion is never a
business transition. Repeated identical cancellation commands are idempotent;
conflicting target identity, cause or context fails. An already corrected,
cancelled or authority-rejected target is handled by the exact edition rule and
never by a universal heuristic.

## Impossible and indeterminate states

Invalid combinations—including response without attempt, accepted attempt for
an uncommitted record, correction to unknown ambiguous target or chain-verified
record with missing artifact—cannot be constructed. External uncertainty uses
`indeterminate` plus reconciliation action and deadline; it never becomes false,
success or retryable merely for convenience.
