---
id: CRYPTO-DOC-0012
title: QR content
status: draft
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0025]
historical-inputs: [REV-045, REV-046]
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
