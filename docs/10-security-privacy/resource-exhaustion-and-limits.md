---
id: SEC-DOC-0009
title: Resource exhaustion and hard limits
status: draft
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
dependencies: [SEC-DOC-0005, PERF-DOC-0006]
historical-inputs: [REV-009, REV-027, REV-059, REV-079]
---

# Resource exhaustion and hard limits

Every untrusted cardinality is finite and enforced before allocation/work:
encoded and decoded bytes, XML depth/nodes/attributes/text, Unicode expansion,
field/list counts, decimal digits/scale, batch records, diagnostics, artifact and
response size, decompression ratio, open descriptors, concurrent operations,
queued bytes/items, retries and total deadline. Nested limits include a global
budget so individually valid children cannot multiply without bound.

## Limit derivation

Legal/schema maxima are hard semantic ceilings. Security ceilings may be lower
only if all legally supported cases remain possible. Deployment capacity limits
are explicit adapter configuration within safe documented ranges. Every value
has unit, scope, rationale, enforcement point, observed metric and boundary
tests. There is no unbounded/default-zero interpretation.

## Overload behavior

Admission control happens before fiscal mutation. Overload returns stable,
non-sensitive capacity diagnostics with retry guidance only when retry is safe.
Queues are bounded by count and bytes; publishers receive backpressure rather
than silent drop. Reserved capacity protects recovery, health and evidence paths.
Timeout/cancellation propagates to CPU, parser, crypto, storage and network work.

## Verification

Tests cover exactly below/at/above each limit, adversarial multiplication, slow
producer/consumer, compressed expansion, cancellation, concurrent contexts and
recovery after pressure. Assertions include peak RSS/heap/external memory,
descriptors, event-loop delay, queue high-water marks, durable consistency and
absence of sensitive output. Limit checks themselves are fuzzed for overflow.
