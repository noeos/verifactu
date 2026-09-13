---
id: CRYPTO-DOC-0006
title: RRSIF fingerprint
status: draft
authority: normative
owner: cryptography-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0014, SRC-0023]
historical-inputs: [REV-007, REV-010]
---

# RRSIF fingerprint

Each edition declares record/event kind, selected source field paths, exact
order, labels/separators, omission/empty rule, lexical conversion, character
encoding, algorithm identifier and output casing. The preimage is materialized
as its own immutable artifact before hashing; XML canonicalization is unrelated.

Digest computation accepts only the edition algorithm suite and returns
preimage artifact ID, algorithm, bytes length and fingerprint. It recomputes
and compares rather than trusting supplied metadata. Unsupported algorithms and
edition mismatch fail closed; no fallback or downgrade exists.

Vectors include every record/event variant, Unicode, empty optionals, decimal/
time boundaries, predecessor/no-predecessor and official examples. Independent
reference code must match. Each single-field/order/separator/encoding/case
mutation must fail verification, preventing a shared faulty builder from being
its own oracle.
