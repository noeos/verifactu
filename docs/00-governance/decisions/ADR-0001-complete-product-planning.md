---
id: ADR-0001
title: Complete-product planning
status: proposed
authority: decision
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-12
supersedes: []
---

# ADR-0001: Complete-product planning

## Context

The deleted implementation appeared advanced while material regulatory,
security, recovery, testing and repository defects remained. Calling an early
subset an MVP would permit the same mismatch between apparent and real
completion.

## Options considered

1. MVP followed by deferred hardening: faster first demonstration, but creates
   incomplete contracts, migration debt and misleading readiness pressure.
2. Complete target architecture with thin vertical releases: validates early,
   but can normalize missing final obligations if “thin” becomes product scope.
3. Complete-product planning with phased dependency order: greater planning and
   verification cost, but keeps the final obligation explicit at every phase.

## Decision

Adopt option 3. Plan every in-scope product, regulatory and quality obligation
before stable release. Phases sequence proof and implementation; they never
remove final scope. Executable prototypes may reduce uncertainty but are not
production completion.

## Consequences

The repository must maintain a full requirement/verification inventory and
reject placeholder completion. Delivery takes longer to claim but reduces
unsafe redesign and makes release claims precise. Unknowns remain possible, so
“perfect” is expressed as complete defined scope plus rigorous evidence rather
than an absolute absence-of-defects claim.

## Verification and reversal

Area and release gates detect deferred mandatory scope and unmatched
requirements. Reversal would require a successor ADR, explicit product-scope
change and reconciliation with legal and consumer obligations.
