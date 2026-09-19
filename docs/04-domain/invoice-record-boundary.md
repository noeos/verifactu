---
id: DOM-DOC-0004
title: Invoice and billing-record boundary
status: approved
authority: normative
owner: domain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [DOM-DOC-0002, REG-DOC-0002]
historical-inputs: [REV-001, REV-003, REV-018, REV-020]
---

# Invoice and billing-record boundary

## Boundary contract

The caller supplies an `InvoiceFact` plus provenance. Verifactu determines
applicability, validates the semantic combination and constructs regulated
records. It does not become the accounting ledger, invoice renderer, customer
database, payment engine or tax-advice authority.

Input preserves presence exactly: omitted, explicit empty, explicit zero,
explicit false and supplied value are distinct until an edition rule says
otherwise. Monetary values use decimal representations with declared currency
and scale; binary floating point is forbidden. Unknown external fields are
rejected at strict public boundaries and retained only in an explicitly opaque,
non-semantic extension area allowed by contract.

## Transformation stages

1. Decode transport without coercion and attach input/media provenance.
2. Resolve explicit context, applicability, edition and mode tenure.
3. Construct value objects and accumulate deterministic diagnostics.
4. Apply cross-field, catalogue, chronology and state rules.
5. Build immutable semantic record and ordered integrity input.
6. Serialize once under the pinned schema/edition and compute its artifact ID.
7. Atomically append record, artifact reference and chain-head transition.

Each stage consumes the prior typed result. Failure produces no later-stage
artifact. Validation does not mutate caller input and never substitutes a
default taxpayer, date, mode, identifier, amount or catalogue code.

## Host transaction and outbox

The host must not report an invoice issuance outcome that contradicts the RRSIF
record. The adapter contract therefore supplies one of two explicitly verified
patterns:

1. one shared durable transaction commits the host invoice fact, immutable
   billing record, artifact, chain-head compare-and-append and submission-outbox
   item; or
2. a journaled prepare/commit protocol with stable command identity makes those
   effects recoverably equivalent to one atomic decision.

An in-memory callback, “save invoice then best-effort record”, or “record then
best-effort enqueue” is forbidden. The core returns success only after the
chosen protocol proves durability. Crash tests at every prepare/write/head/
outbox/finalize boundary must recover to either no issued outcome or the one
complete committed outcome, never a guessed repair. External AEAT network work
occurs later from the durable outbox and is not part of the host transaction.

## Ownership and replay

The caller owns invoice correctness outside RRSIF and supplies correction
intent. Verifactu owns record-level conformance and evidence. Replaying a
committed record uses stored semantic and byte artifacts; it does not rerun
edition resolution or time-dependent defaults. Importing historical artifacts
is a separate verified operation and cannot masquerade as native generation.

## Error boundary

Business-invalid input returns ordered diagnostics with field paths and sources.
Programmer contract violations and detected corruption are distinct failures.
No thrown error may include raw fiscal payloads, keys, certificates or response
bodies.
