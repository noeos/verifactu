---
id: CRYPTO-DOC-0002
title: Official serialization
status: draft
authority: normative
owner: cryptography-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [CRYPTO-DOC-0001, ADR-0025]
historical-inputs: [REV-007, REV-011, REV-015]
---

# Official serialization

An edition defines the projection from a validated immutable record/event to
ordered official fields and each field's exact lexical form. Absence, empty,
zero and `xsi:nil` are distinct and only emitted where authorized. Decimal
scale/rounding, date/time/offset, identifier casing, Unicode normalization (if
any), boolean/catalogue values and predecessor selection are rule IDs, never
host formatting choices.

Serialization is UTF-8 with declared XML version, namespaces and element order;
no BOM or platform line endings. XML escaping applies once at the text/attribute
boundary. The fingerprint preimage is a separate official serialization and is
not inferred from XML text or canonicalization.

The result is an `ART-*` object containing kind, edition, semantic-input digest,
bytes, media type, length and digests. Re-serialization of the same captured
inputs is byte-identical. Golden vectors cover optional/present-empty values,
Unicode, boundary decimals/times and field-order mutations.
