---
id: PERSIST-DOC-0001
title: Storage semantics and logical data model
status: draft
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0022, ADR-0023, ADR-0025]
historical-inputs: [REV-028, REV-036]
---

# Storage semantics and logical data model

Logical entities are fiscal context/mode tenure, invoice publication link,
record/event, sequence head/history, byte artifact, verification/signature
claim, outbox item, attempt/observation/result, checkpoint, edition reference,
export and migration journal. Every row/object carries context, immutable ID,
schema version and creation provenance; artifacts additionally carry length and
digests.

Constraints enforce unique scoped fiscal identity, unique command/idempotency
key, one genesis per sequence, predecessor/head relations, monotonic head and
attempt versions, artifact digest consistency, allowed state transition and
foreign-context prohibition. Business truth is never a cache or mutable JSON
blob lacking queryable constraints.

Ports specify atomicity, isolation, durability acknowledgment, consistency of
reads/enumeration, maximum values and conflict/corruption results. Physical
tables/indexes are adapter decisions documented and performance-tested, but
cannot weaken logical invariants. Store timestamps are explicit values, not
hidden database defaults.
