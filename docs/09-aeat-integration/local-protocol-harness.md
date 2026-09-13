---
id: AEAT-DOC-0015
title: Local AEAT protocol harness
status: draft
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0024]
historical-inputs: [REV-037, REV-044, REV-062]
---

# Local AEAT protocol harness

The harness is a strict independent TLS/SOAP peer generated/validated against
the pinned binding but not importing production serializers/parsers. It captures
exact request bytes and connection/TLS metadata, validates endpoint/mTLS,
HTTP/SOAPAction/content type, XML/XSD, header/body identities, order, batch
limits and correlation manifest.

Scripted responses cover every official global/line result and wait value plus
wrong namespace/QName/order/count/identity, SOAP Fault, unknown code, HTML,
invalid UTF-8/XML, truncation, compression bomb, oversized/slow body and
disconnect before/during/after request processing. Network scripts record the
fault trigger so an unexercised fault cannot pass.

Runs are offline, seeded, time-controlled and parallel-isolated with ephemeral
credentials and ports. Evidence includes harness/build/source digests, request/
response digests, scenario ID and resource-leak result. Harness success proves
local contract behavior, not AEAT availability or legal compliance.
