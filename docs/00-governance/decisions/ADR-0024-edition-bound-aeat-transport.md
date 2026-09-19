---
id: ADR-0024
title: Edition-bound AEAT transport and durable orchestration
status: accepted
authority: decision
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0019, SRC-0020, SRC-0022, SRC-0047, SRC-0048]
historical-inputs: [REV-037, REV-044]
---

# ADR-0024: Edition-bound AEAT transport and durable orchestration

## Decision

Generate structural service metadata from the selected edition's pinned
WSDL/XSD closure and bind each operation to an immutable environment endpoint
allowlist. The public production API cannot inject arbitrary URLs; redirects
are denied unless a future edition explicitly authorizes and pins them.

One transport-port call makes at most one network observation and returns exact
request/response metadata or an indeterminate transport outcome. Durable
orchestration above it owns batch selection, attempts, AEAT wait instructions,
retry policy and reconciliation. The adapter cannot hide automatic retries.

## Consequences

The deterministic local protocol peer proves wire and failure behavior. Portal
tests remain separately authorized external observations and cannot be the sole
release oracle.
