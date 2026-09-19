---
id: PERSIST-DOC-0002
title: Host transaction boundary
status: approved
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0022]
historical-inputs: [REV-028]
---

# Host transaction boundary

The atomic publication set is: host invoice publication/revision fact; immutable
alta/anulación/event; official preimage/XML/signed artifacts as applicable;
official and Noeos verification claims; sequence/event head CAS; domain journal;
and outbox intent for any required external action.

The host begins one context-bound UoW and passes its capability to VeriFactu.
VeriFactu stages writes and expected-head mutation without committing. The host
adds its invoice fact, then one owner invokes commit. Network, observer callbacks,
edition acquisition and key interaction are forbidden inside commit.

Commit success means all members are durably visible. Conflict means none of
the candidate writes are visible. Unknown acknowledgment is resolved using
command ID and exact digests before retry. After-commit notification may fail
without losing outbox discovery. Integration tests inspect both host and
VeriFactu views after injected failures and process/database restart.
