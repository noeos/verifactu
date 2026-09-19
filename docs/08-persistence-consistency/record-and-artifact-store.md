---
id: PERSIST-DOC-0003
title: Record and artifact store
status: approved
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0025]
historical-inputs: [REV-015, REV-016, REV-019, REV-025]
---

# Record and artifact store

Records/events are append-only canonical semantic objects with edition,
context, sequence and official identity. `append` is create-only: identical
identity/digest is an idempotent replay, while same identity/different content
is corruption/conflict. Update/delete are absent; correction and retention
actions append governed facts.

Artifacts store exact bytes plus independent length, media type and SHA-256/
SHA-512. On write and every evidence-critical read, the adapter recomputes
digests. Descriptors cannot exist without bytes in the same transaction.
Streaming reads preserve exact bytes, enforce declared/actual maximums and make
ownership explicit.

Enumeration is stable, complete, paginated by opaque snapshot/cursor and scoped
to context/edition/type. Missing bytes, digest mismatch, duplicate identity,
unexpected mutable version or incomplete page returns corruption/indeterminate,
not absence. Conformance covers concurrent create, partial/blob truncation,
bit flips, reordered pages and restore.
