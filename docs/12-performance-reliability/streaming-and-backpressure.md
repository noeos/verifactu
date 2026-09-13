---
id: PERF-DOC-0007
title: Streaming and backpressure
status: draft
authority: normative
owner: performance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [PERF-DOC-0006, SEC-DOC-0009]
historical-inputs: [REV-024, REV-026, REV-027, REV-058]
---

# Streaming and backpressure

Streams are used for large exports, imports, chain verification and controlled
transport bodies. Producers honor downstream demand/high-water marks; ignoring a
false `write()` result or accumulating unresolved promises is prohibited. Every
pipeline has byte/object mode, high-water marks, total byte/item limits, abort
signal, deadline, error propagation and cleanup ownership.

## Semantic boundaries

Streaming cannot split a fiscal record's atomic validation/commit boundary.
Incremental parsers retain enough state to enforce schema and security rules and
publish nothing before complete validation. Export emits only committed records
in deterministic order with rolling and final integrity metadata. A partial file
is visibly incomplete and cannot be mistaken for a valid evidence bundle.

## Backpressure policy

Admission considers queued bytes and estimated work. When saturated, callers
wait within a bound or receive an explicit capacity diagnostic before mutation.
No silent drop, unbounded buffer or priority inversion. Recovery and security
control traffic have reserved, bounded capacity; tenant fairness prevents one
context monopolizing shared resources.

## Cancellation and errors

Abort closes upstream/downstream resources once, releases tokens/descriptors,
removes uncommitted temporary files and preserves already committed facts.
Errors keep their primary cause and safe context; secondary cleanup errors are
attached without leaking payloads. Slow producer, slow consumer, mid-record
abort, disk full and downstream failure tests assert memory plateaus, cleanup,
state atomicity and no unhandled rejection.
