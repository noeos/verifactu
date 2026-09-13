---
id: PERSIST-DOC-0009
title: Leases and fencing
status: approved
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0023]
historical-inputs: [REV-032, REV-033]
---

# Leases and fencing

Lease state contains item ID, owner instance, monotonically increasing fencing
token, authoritative acquired/expiry instants and version. The adapter declares
whether time is backend-supplied and its maximum skew/precision; worker local
time alone cannot grant ownership.

Claim/renew/release/complete are atomic conditional operations. Every state
write carries current fencing token, and storage rejects lower/stale tokens even
if the old worker resumes. Renewal after expiry is a new claim/token. Release
does not erase an initiated attempt or convert `submitting` into retryable.

Tests pause workers across expiry, race renew/complete/reclaim, jump clocks,
partition connections, duplicate delivery and restart all parties. Safety
outranks availability: inability to prove ownership prevents mutation and
creates inspectable stuck/reconciliation state.
