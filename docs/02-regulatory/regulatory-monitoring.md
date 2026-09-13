---
id: REG-DOC-0008
title: Regulatory monitoring
status: approved
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
decisions: [ADR-0006, ADR-0009]
requirements: [REG-0030, REG-0031, REG-0032]
historical-inputs: [REV-004, REV-006, REV-070]
---

# Regulatory monitoring

## Monitored channels

- BOE alerts/search for every legal source and related enabling provision.
- AEAT SIF/VERI*FACTU portal, FAQ hierarchy and technical index.
- Direct resolved URLs and dependency graphs for WSDL, XSD, catalogues,
  validation/errors, hash, signature, QR and examples.
- EUR-Lex/AEPD sources for applicable privacy change.
- Verification Engine release/security advisories for boundary compatibility.

## Cadence

Automated metadata/byte checks run daily without changing canonical inputs.
Human regulatory review occurs at least monthly, before every candidate/stable
release and immediately after an alert, unexpected AEAT result or consumer
report. `review-by` expiry blocks new affected approval claims.

## Acquisition safety

Monitoring uses bounded timeouts, redirect count, response/body size and
decompression; verifies HTTPS host allowlists, media type and expected file
structure; stores no credentials in logs; and treats content as untrusted. HTML
returned where XML/ZIP/PDF is expected is drift/failure, never a new source.

## Classification and response

| Severity | Examples | Response |
| --- | --- | --- |
| Critical | Law/effective date, hash/signature, official bytes, endpoint trust or applicability changes. | Immediately block affected release/generation claim; preserve and analyze. |
| High | XSD/WSDL, catalogue, validation/error, QR or protocol change. | Open candidate edition and block promotion until full impact/tests. |
| Medium | FAQ clarification or non-breaking example change. | Trace interpretation and tests; promote only after review. |
| Informational | Presentation/navigation change with proven identical material bytes. | Record observation; no edition change. |

HTTP status, ETag or `Last-Modified` alone never proves identical content. Byte
digests decide material identity after safe acquisition.

## Operational evidence

Each run records start/end, source IDs, request policy version, final URI/status,
metadata, byte digest/length, comparison, errors and signed summary. Alert
delivery is tested; a green job with unprocessed sources fails closed.
