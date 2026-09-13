---
id: DOM-DOC-0005
title: Alta and anulacion semantics
status: draft
authority: normative
owner: domain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [DOM-DOC-0004, REG-DOC-0005, REQ-DOC-0003]
historical-inputs: [REV-018, REV-020, REV-021, REV-022, REV-023]
---

# Alta and anulacion semantics

## Registration (`alta`)

An alta records one invoice fact under exactly one context and edition. Its
edition schema must cover, without loss, the official identification,
issuer/recipient where applicable, invoice classification, correction or
substitution references, dates, descriptions, totals, tax breakdowns,
software/system identification, integrity, generation and mode-specific fields.
The generated field catalogue—not handwritten interfaces—is the exhaustive
authority for names, cardinality, lexical form and official codes.

Alta construction requires:

- unique fiscal document identity in the applicable context;
- internally reconciled totals and tax breakdowns using edition-defined
  rounding order and precision;
- catalogue values valid on the fiscal event date, not merely today;
- explicit modeling of simplified, corrective, substitution, summary and other
  supported official categories;
- valid predecessor relation or an edition-permitted first-record marker; and
- a committed record before it is eligible for submission or export.

## Cancellation (`anulación`)

An anulacion identifies the target using the official identity fields and
records the legally meaningful cancellation fact. It never deletes or mutates
the target. It validates target context, existence/knowledge state, permitted
cause/flags, chronology, prior cancellations and mode/edition rules. Where an
edition allows cancellation of an externally generated or unavailable target,
that state is explicit and evidence-backed rather than fabricated locally.

## Shared outcomes

Construction returns `accepted(record)`, `rejected(diagnostics)` or
`indeterminate(diagnostics, requiredEvidence)`. Indeterminate covers facts the
library cannot lawfully infer. Neither rejected nor indeterminate advances the
chain. Duplicate identical commands resolve through idempotency; conflicting
duplicates fail.

## Completeness and conformance

For every supported edition, generated conformance fixtures enumerate every
official element, choice, cardinality and catalogue. Tests cover minimum,
maximum, mutually exclusive, conditional, absent/empty, boundary amount/date,
correction and cancellation combinations. Unsupported official constructs fail
with a capability diagnostic; they are never silently dropped.
