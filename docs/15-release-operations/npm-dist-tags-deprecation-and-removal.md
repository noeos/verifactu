---
id: RELEASE-DOC-0011
title: npm dist-tags, deprecation and removal
status: draft
authority: normative
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0069]
decisions: [ADR-0044, ADR-0050]
historical-inputs: [REV-074, REV-082]
---

# npm dist-tags, deprecation and removal

Allowed channels are `next`, unique `verification-X-Y-Z` and `latest`. The
desired/effective registry records all three packages; unexpected tags fail.
`latest` moves only to a fully verified stable triple and each mutation records
before/after, actor, reason and subsequent read-back.

Deprecation messages identify affected range, impact, safe replacement/mitigation
and advisory URL without leaking embargo details. Partial/bad releases are never
made latest. Removal/unpublish is exceptional, legally/security reviewed and
must satisfy npm policy; installed consumers cannot be recalled.

Tests simulate partial tag movement, eventual consistency, wrong package/version,
concurrent release and permission loss. Repair uses a new immutable version and
preserves the old evidence/advisory history.
