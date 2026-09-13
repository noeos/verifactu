---
id: ADR-0025
title: Exact byte artifact identity and custody
status: accepted
authority: decision
owner: cryptography-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0011, ADR-0021, ADR-0022]
historical-inputs: [REV-015, REV-016, REV-019, REV-025, REV-042]
---

# ADR-0025: Exact byte artifact identity and custody

## Decision

Fingerprint preimages, unsigned record XML, signed XML, SOAP envelopes,
transmitted requests, received responses and exports are distinct immutable
artifacts. Each has a typed identity, media type, edition, byte length,
SHA-256/SHA-512, producer, creation instant source, parent transformations,
custodian and retention classification.

An operation persists or transmits the exact verified bytes required by its
contract. Later regeneration may be compared but cannot replace custody
evidence. Provider-returned or remotely received bytes remain untrusted until
bounded validation; metadata never substitutes recomputing the digest.

## Consequences

Storage and export costs increase deliberately. Tampering, swapped artifacts,
prepared/committed mismatch and lost-response evidence receive direct negative
tests and audit paths.
