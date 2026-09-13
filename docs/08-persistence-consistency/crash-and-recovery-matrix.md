---
id: PERSIST-DOC-0015
title: Crash and recovery matrix
status: draft
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
historical-inputs: [REV-028, REV-035, REV-042]
---

# Crash and recovery matrix

The canonical matrix enumerates cuts before/after: preparation; provider request
and returned bytes; each staged write; CAS; commit send/ack; outbox wakeup;
claim/renew; attempt journal; request connect/write/flush; response headers/body;
response artifact/result commit; wait update; consultation; checkpoint; export;
backup and migration steps.

Each row records injected fault, durable facts expected after hard restart,
forbidden facts, detection query, next safe command, idempotency behavior,
operator requirement and invariant/test IDs. Unknown local commit and unknown
remote application are distinct rows.

Tests kill the process/provider/backend connection rather than throwing only at
high-level mocks. Evidence includes pre/post store inspection and exact artifact
digests. Coverage is complete only when every irreversible boundary has both
sides and the harness proves the fault actually occurred; unsupported fault
injection blocks adapter qualification.
