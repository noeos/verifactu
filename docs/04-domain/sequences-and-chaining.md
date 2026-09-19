---
id: DOM-DOC-0008
title: Sequences, integrity and chaining
status: approved
authority: normative
owner: domain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [DOM-DOC-0003, DOM-DOC-0005, SEC-DOC-0006]
historical-inputs: [REV-007, REV-019, REV-020, REV-024, REV-084]
---

# Sequences, integrity and chaining

## Chain scope and ordering

The active edition defines the chain discriminator and ordered fingerprint input.
Implementation represents both as generated, versioned descriptors. Generic
object iteration, locale collation or JSON serialization cannot determine either.
One context cannot read or update another context's head.

## Append protocol

1. Read a versioned chain head under the storage port.
2. Build the semantic record with the predecessor identity/fingerprint or the
   prescribed first-record marker.
3. Construct the exact ordered byte sequence, preserving absence and lexical
   rules; compute the new record's own fingerprint.
4. Validate fingerprint/signature and serialize the edition artifact.
5. Compare-and-append record, artifact reference and new head atomically.
6. On conflict, discard the uncommitted construction and retry from fresh state.

The predecessor fingerprint is an input field of the new record; the hash field
of the new record contains its newly computed result. These fields are never
aliased, which directly prevents the prior design error recorded by `REV-007`.

## Concurrency and failure

The storage adapter must offer linearizable compare-and-append within one chain.
Process-local mutexes alone are insufficient for multiple processes. Crash
fixtures cover every boundary before and after durable append. Recovery selects
the one committed state by transaction evidence and treats split-brain heads,
missing artifacts or digest mismatch as corruption requiring quarantine.

## Verification and export

Chain verification starts at an authenticated checkpoint, recomputes every
ordered input and reports verified, broken or indeterminate. It proves continuity
and artifact identity, not truth of source invoice facts. Exports include chain
scope, endpoints, edition, algorithm, artifact digests and verification result.
Large chains are verified incrementally with bounded memory.

## Algorithm agility

Algorithm identifiers and parameters belong to the edition descriptor. Unknown,
deprecated or disallowed algorithms fail closed. Migration never recomputes old
records; a new edition records the continuity mechanism explicitly.
