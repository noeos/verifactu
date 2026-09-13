---
id: ARCH-DOC-0014
title: Observability boundaries
status: draft
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [SEC-DOC-0012]
historical-inputs: [REV-026]
---

# Observability boundaries

Durable domain facts and attempt observations are part of correctness. Logs,
metrics and traces are best-effort operational projections and cannot change or
contradict the returned durable result. Observer failure is captured/redacted
and never turns a committed operation into failure or an uncommitted operation
into success.

Correlation uses opaque operation/record/attempt IDs, never NIF, invoice text,
certificate, XML or payload digest exposed beyond its classified channel.
Telemetry is disabled by default and cannot transmit fiscal content.

The event schema defines name/version, producer, instant source, context scope,
outcome, diagnostic codes and classification. Cardinality budgets prohibit
taxpayer/invoice/record identifiers as metric labels. Tests inject throwing,
blocking, reentrant and leaking observers and verify isolation, deadlines and
redaction.
