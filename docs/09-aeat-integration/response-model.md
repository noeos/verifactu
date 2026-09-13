---
id: AEAT-DOC-0008
title: AEAT response model
status: draft
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0021, SRC-0022]
historical-inputs: [REV-039, REV-040, REV-041]
---

# AEAT response model

Parsing separates HTTP/TLS observation, SOAP envelope/fault, global service
metadata and individual record lines. The edition supplies exact namespaces,
QNames, catalogues, cardinalities, identities, CSV/receipt fields, timestamps
and `TiempoEsperaEnvio`. Local-name or descendant searches are prohibited.

Outcomes include accepted, accepted-with-errors/requiring correction, rejected,
duplicate/previously processed where officially defined, and unrecognized.
Warnings and errors retain official codes/text safely and map to sourced domain
states without inventing retryability. Unknown codes/fields remain visible and
block overconfident classification.

The parser returns the raw response artifact plus normalized typed observation.
It never mutates durable state itself. Tests cover every catalogue state, global
failure with/without lines, repeated/missing/extra lines, reordered lines,
unknown code, malformed values, invalid namespace, HTML, truncation and
oversized diagnostics.
