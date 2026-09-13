---
id: CONTRACT-DOC-0001
title: Public library API
status: approved
authority: normative
owner: api-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0017]
historical-inputs: [REV-020, REV-024, REV-026, REV-027, REV-049]
---

# Public library API

The root factory `createVerifactu(configuration, capabilities)` validates both
arguments and returns a frozen client. Construction performs no network,
filesystem, signing or storage mutation. `capabilities()` reports supported
operations/editions/provider levels without claiming their current availability.

The stable surface groups:

- `records`: validate, prepare alta/anulación/event, confirm and atomically
  commit; no one-shot shortcut may hide head/UoW semantics;
- `submissions`: plan batch, claim work, execute one attempt, record observation,
  reconcile and inspect state;
- `verify`: official record/chain/artifact/signature/certificate/evidence claims
  separately and aggregate without erasing failures;
- `qr`: construct/validate payload and render/inspect a symbol;
- `exports`: plan and stream authenticated evidence packages;
- `editions`: enumerate and open installed immutable edition assets.

Every method is total over decoded input and returns `OperationResult<T>`; only
programmer defects throw. Effects, cancellation, limits, context, edition and
operation IDs are explicit. Returned objects are deeply immutable snapshots;
no method exposes provider, store or key internals.

Normative examples cover every result variant and are compiled, executed and
compared to schemas. A method cannot be exported before its production path,
negative cases and CLI/schema mapping exist.
