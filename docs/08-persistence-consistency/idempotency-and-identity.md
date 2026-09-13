---
id: PERSIST-DOC-0008
title: Idempotency and identity
status: draft
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
historical-inputs: [REV-036, REV-040, REV-042]
---

# Idempotency and identity

Distinct keys identify host command, fiscal record, semantic revision,
prepared/committed artifact, outbox item, batch, network attempt and remote
line. Keys include or reference fiscal context and edition; none is reused after
retention or across environment.

For every command/store operation: new key executes; existing key plus identical
canonical digest returns the original immutable result; existing key plus
different digest is `idempotency-conflict`; unknown prior commit is queried
before retry. A caller-provided key is syntax only until bound to the canonical
request digest.

Remote submission idempotency is never assumed from a local key. Attempts keep
the same immutable request artifact where replay is authorized but obtain a new
attempt ID/count. Correlation validates every expected remote identity and
cannot mark a missing line accepted. Retention of keys lasts at least as long
as the operation can be replayed, restored or legally inspected.
