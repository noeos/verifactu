---
id: CONTRACT-DOC-0005
title: JSON and NDJSON contract
status: draft
authority: normative
owner: api-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0041, SRC-0042, SRC-0050]
historical-inputs: [REV-048, REV-051, REV-052]
---

# JSON and NDJSON contract

External JSON is UTF-8 without BOM, parsed with duplicate-member detection.
Objects are closed unless a schema explicitly defines an extension map. Strings
must contain valid Unicode scalar values. Fiscal decimals, large counters,
digests and identifiers are strings with canonical lexical forms; unsafe IEEE
754 coercion is prohibited. Dates/times use the exact contract-defined lexical
form, never JavaScript implementation formatting.

Canonical JSON output fixes member order from schema, minimal escaping,
lowercase booleans/null and LF termination. It is a stable interchange artifact,
not the official RRSIF fingerprint serialization unless explicitly stated.

NDJSON has one complete JSON value per LF-terminated physical record; embedded
newlines are escaped. Parsing is incremental with maximum line/input/result
bytes, bounded queue and backpressure. Each input receives an ordered result
with line number and optional safe operation ID. Fail-fast versus continue mode
is explicit; cancellation stops intake, completes/aborts owned work according
to its commit point and closes streams.

Round-trip/property tests cover Unicode, boundary decimals, duplicate keys,
overlong lines, partial final lines, invalid UTF-8, slow consumers and aborts.
