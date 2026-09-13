---
id: QA-DOC-0011
title: Fault injection
status: approved
authority: normative
owner: reliability-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0022, ADR-0023, ADR-0028, ADR-0038]
historical-inputs: [REV-060, REV-061]
---

# Fault injection

The catalogue covers before/during/after effects for filesystem, stream,
process, store transaction, lock/CAS/lease, clock, entropy, signer/HSM,
certificate status, XML provider, DNS/TCP/TLS/mTLS, HTTP/SOAP and cancellation.
Each fault has stable ID, exact trigger, supported adapter level and expected
observable/durable post-state.

The harness MUST prove the injection point was reached before accepting the
outcome. Generic monkeypatches that bypass real I/O are insufficient for durable
or provider claims. Process-crash cases terminate outside the subject process,
restart from persisted bytes and inspect invariants using an independent reader.

Faults never target production: destructive scenarios require disposable
namespace, explicit marker, endpoint allowlist and teardown verification.
Unavailable hooks yield unsupported/blocking, not pass. Reports retain trigger,
attempt, timing, process IDs, state snapshots and cleanup result.
