---
id: PERSIST-DOC-0012
title: Storage schema versioning and migrations
status: draft
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ARCH-DOC-0015]
---

# Storage schema versioning and migrations

Storage schema version is independent of product and regulatory edition. Each
migration declares source/target, prerequisites, affected entities/constraints,
online/offline mode, resource budget, resumability, rollback boundary,
verification queries and backup requirement. Unknown newer versions are
read-only/blocked, never best-effort written.

Migrations preserve immutable bytes, IDs, digests, history, edition references
and idempotency keys. Transforming a representation creates an explicitly
linked derived object unless the physical encoding changes without altering
logical bytes and is verified. Fiscal facts are never normalized retroactively.

The journal records migration start, checkpoint, batches, validation and finish.
Crashes at every step resume deterministically. Pre/post counts, referential and
digest checks, chain verification and sampled/full evidence comparison are
mandatory. Mixed application/schema versions require an explicit compatibility
window and fencing; otherwise startup blocks.
