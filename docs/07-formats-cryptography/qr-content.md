---
id: CRYPTO-DOC-0012
title: QR content
status: approved
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-24
sources: [SRC-0025]
historical-inputs: [REV-045, REV-046]
decisions: [ADR-0009, ADR-0021, ADR-0056]
---

# QR content

The selected edition defines eligibility, verification/collation base URL,
required query names/order, invoice issuer/number/date/amount lexical forms,
percent encoding, UTF-8 bytes, maximum length and mode-dependent legend. Test
and production endpoints/legends cannot be inferred from a loose boolean.

The builder accepts validated invoice/record facts and an edition endpoint
identity, not an arbitrary URL. It returns canonical payload text/bytes, parsed
field view, artifact digest and required visible legend. Verification parses
strictly, rejects duplicate/unknown/missing parameters, wrong environment/mode,
noncanonical encoding and mismatch with expected invoice/record.

Vectors cover reserved/non-ASCII series, boundary dates, zero and negative/
credit amounts where legally valid, decimal lexical boundaries, long values,
both modes and cross-environment substitution. URL construction never uses
locale or floating-point formatting.

The encoder consumes only the canonical payload bytes produced for the selected
edition and mode. The approved candidate is `@nuintun/qrcode@5.0.3`, subject to
exact dependency, licence and vulnerability admission before implementation;
QR matrix generation is not handwritten. This package does not retrieve the
verification URL, shorten it, follow it or infer environment from a caller URL.
The source edition's byte/length limits are authoritative; overflow rejects
before rendering, with no truncation or alternate encoding fallback. See
[ADR-0056](../00-governance/decisions/ADR-0056-edition-bound-qr-codec-and-rendering.md).
