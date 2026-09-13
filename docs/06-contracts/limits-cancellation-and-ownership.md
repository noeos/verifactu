---
id: CONTRACT-DOC-0011
title: Limits cancellation and ownership contracts
status: approved
authority: normative
owner: api-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ARCH-DOC-0012, SEC-DOC-0009]
---

# Limits cancellation and ownership contracts

Each operation declares input/output bytes, item/count/depth/string limits,
memory and concurrency budget, deadline semantics and maximum diagnostic
volume. Enforcement occurs before allocation when length is knowable and
incrementally otherwise; decompression/XML/base64 amplification has separate
post-expansion ceilings.

One operation context carries `AbortSignal`, absolute deadline from an explicit
monotonic/wall-clock policy, limit set and operation ID. Child work cannot
outlive it unless ownership is deliberately transferred to durable outbox.
Cancellation precedence relative to commit/network observation is specified:
it never returns “cancelled with no effect” if an effect might have occurred.

Requests label buffers/streams/handles as borrowed; responses label created or
transferred resources. Owners close exactly once with idempotent cleanup and
bounded wait. Error paths aggregate cleanup failures without masking the
primary durable result. Stress and race tests verify zero leaked workers,
sockets, descriptors, leases and temporary files.
