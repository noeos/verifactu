---
id: CRYPTO-DOC-0014
title: Noeos evidence profile
status: draft
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0021]
sources: [SRC-0029]
---

# Noeos evidence profile

The profile ID is namespaced and versioned, initially
`es.noeos.verifactu.record@1.0.0` subject to clean-consumer confirmation. Its
projection contains opaque context/sequence/record identities, regulatory
edition, ordered official artifact digests, predecessor evidence reference,
operation kind and explicit algorithm identifiers. IDs contain no NIF, invoice
number, customer data or other personal/fiscal plaintext.

The profile schema defines canonical field order/encoding, maximum sizes,
genesis/link semantics and verification result mapping. Profile input is built
only after official record/artifact claims succeed; Engine output is parsed and
verified before commit. It supplies generic tamper-evident evidence, not the
official fingerprint, XAdES, certificate authorization or AEAT status.

Version changes are breaking when projection bytes or interpretation changes.
Vectors include genesis/link, wrong predecessor/context/edition/artifact digest,
unknown profile/algorithm and privacy scanning. Historical versions remain
verifiable for their support window.
