---
id: CRYPTO-DOC-0012
title: QR content
status: approved
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0025, SRC-0089]
historical-inputs: [REV-045, REV-046]
---

# QR content

The selected edition defines eligibility, verification/collation base URL,
required query names/order, invoice issuer/number/date/amount lexical forms,
percent encoding, UTF-8 bytes, maximum length and mode-dependent legend. Test
and production endpoints/legends cannot be inferred from a loose boolean.

The builder accepts validated invoice/record facts and an edition endpoint
identity, not an arbitrary URL. It returns canonical payload text/bytes, parsed
field view, lowercase-hex SHA-256 artifact digest and required visible legend. Returned bytes
are defensive copies and parsed facts are immutable. Verification parses
strictly, rejects duplicate/unknown/missing parameters, wrong environment/mode,
noncanonical encoding and mismatch with expected invoice/record.

Vectors cover reserved printable-ASCII series, rejection of non-ASCII values,
boundary dates, zero and negative/credit amounts where legally valid, decimal
lexical boundaries, long values, both modes and cross-environment substitution.
URL construction never uses locale or floating-point formatting.

The AEAT QR specification defines a numeric amount with up to 12 integer and 2
fractional digits but does not spell out the sign. AEAT's official rectification
examples include a negative invoice total; the profile therefore preserves a
leading minus sign (`-210.00`) while applying those digit limits to its
magnitude. Plus signs, grouping separators, exponent notation and locale
decimals remain invalid. This is a profile interpretation grounded in the
official negative-total examples, not a claim that the QR PDF explicitly
describes signed lexical syntax.
