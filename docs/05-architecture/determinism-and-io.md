---
id: ARCH-DOC-0010
title: Determinism and I/O boundary
status: approved
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [REQ-DOC-0004, ADR-0025]
---

# Determinism and I/O boundary

Given identical validated inputs, edition bytes, explicit time/identifier/
algorithm inputs and provider observations, core operations produce identical
results and exact official bytes. Replay envelopes record all such inputs and
their digests.

Nondeterminism is limited to ports for clocks, identifiers, randomness,
credentials, durable storage, XML/XAdES engines, Verification Engine and
transport. Locale, timezone database, object iteration accident, platform line
endings, ambient environment, mutable defaults and network discovery cannot
affect core output.

I/O commands are descriptions until an owning coordinator executes them.
Adapters return bounded observations with start/end instants and ownership; they
cannot call another effect implicitly. Determinism tests vary process timezone,
locale, property construction order, runtime invocation and restart, comparing
typed output and byte digests.
