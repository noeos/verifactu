---
id: PERSIST-DOC-0014
title: Backup restore and disaster recovery
status: draft
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
historical-inputs: [REV-030, REV-083]
---

# Backup restore and disaster recovery

Backup captures a transactionally consistent logical closure or records exact
positions needed to complete one. Its signed manifest includes store identity,
schema, contexts, edition assets, entity/artifact counts, heads/journal/outbox
positions, digests, encryption/key references, tool/version and checkpoint.
Success requires read-back verification, not command exit zero.

Restore targets a new validated store identity, verifies/decrypts all bytes,
rebuilds constraints/indexes, checks counts/digests/chains/evidence and prevents
workers/network until checkpoint/rollback analysis completes. Pending and
attempt-started work is reclassified by the state machine; uncertain attempts
require reconciliation.

RPO/RTO are deployment objectives with measured evidence, never library
guarantees. Disaster exercises cover loss/corruption of primary store, archive,
credential provider, edition assets and checkpoints, plus alternate-host restore.
A restoration is complete only after authorized inspection/export and a new
external checkpoint succeed.
