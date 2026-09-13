---
id: CRYPTO-DOC-0008
title: XML canonicalization
status: approved
authority: normative
owner: cryptography-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0043, SRC-0044]
historical-inputs: [REV-010, REV-012]
---

# XML canonicalization

Canonicalization is performed only by an admitted standards backend using the
algorithm URI explicitly required by the AEAT/XAdES profile and SignedInfo or
Reference. Input is the specified document/node-set after the declared
transforms; comment inclusion, inclusive namespace context and character
normalization follow that algorithm exactly.

The API does not expose a generic “canonicalize string” shortcut. It returns
algorithm, selected-node identity, input artifact digest, output bytes/digest
and backend identity. Unsupported URI, ambiguous selection, external reference,
duplicate ID or transform chain fails closed before signature acceptance.

Interoperability vectors compare at least two independent implementations and
cover namespace ancestors/rebinding, default namespace, `xml:*`, attributes,
empty elements, whitespace/text, character references, comments and subdocument
selection. Trimming whitespace, sorting text or normalizing serialized bytes is
never canonicalization.
