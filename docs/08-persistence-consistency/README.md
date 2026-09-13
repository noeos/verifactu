---
id: PERSIST-INDEX
title: Persistence and consistency documentation index
status: draft
authority: informative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [DOM-INDEX, ARCH-INDEX, SEC-INDEX]
historical-inputs: [REV-015, REV-019, REV-028, REV-036, REV-083]
---

# Persistence and consistency

Status: all 16 substantive specifications drafted under `PLAN-L2`; formal
approval and executable durability evidence pending

Authority for durable state, atomic host integration, concurrency and recovery
invariants.

Persistence is specified by observable durability and consistency invariants,
not by one preferred database. Invoice publication, fiscal record, exact
artifacts/evidence, confirmed head and outbox intent form one atomic host
outcome. Network delivery is never described as exactly once.

Planned documents (16):

- `storage-semantics-and-data-model.md`
- `host-transaction-boundary.md`
- `record-and-artifact-store.md`
- `event-and-evidence-store.md`
- `outbox-store.md`
- `atomic-commit.md`
- `heads-cas-and-forks.md`
- `idempotency-and-identity.md`
- `leases-and-fencing.md`
- `state-machine-and-journal.md`
- `checkpoints-and-rollback-detection.md`
- `schema-versioning-and-migrations.md`
- `retention-archival-and-purge.md`
- `backup-restore-and-disaster-recovery.md`
- `crash-and-recovery-matrix.md`
- `adapter-durability-requirements.md`

Exit requires defined constraints for every durable entity, one atomic
protocol for every coupled write, deterministic replay/concurrency outcomes,
fenced workers, reconciliation before uncertain resend and proven complete
export/restoration.
