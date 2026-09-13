---
id: CRYPTO-INDEX
title: Formats and cryptography documentation index
status: draft
authority: informative
owner: cryptography-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [REG-INDEX, DOM-INDEX, SEC-INDEX]
historical-inputs: [REV-007, REV-021, REV-045, REV-046]
---

# Formats and cryptography

Status: all 17 substantive specifications drafted under `PLAN-L2`; formal
approval and executable conformance evidence pending

Authority for official byte representations and their distinct integrity and
cryptographic guarantees.

Official fingerprinting/chaining, XML/XSD, XAdES, certificate trust and
authorization, QR, and Verification Engine evidence are separate claims with
separate artifacts and independent oracles. Exact bytes are first-class
digest-addressed objects; no callback or TypeScript type is trusted as proof.

Planned documents (17):

- `official-field-and-contract-generation.md`
- `official-serialization.md`
- `byte-artifact-lifecycle.md`
- `xml-model-and-serializer.md`
- `xsd-validation.md`
- `rrsif-fingerprint.md`
- `official-chaining.md`
- `canonicalization.md`
- `xades-profile.md`
- `signature-creation-and-verification.md`
- `certificates-and-revocation.md`
- `qr-content.md`
- `qr-rendering-and-verification.md`
- `noeos-evidence-profile.md`
- `verification-engine-adaptation.md`
- `conformance-vectors-and-independent-oracles.md`
- `cryptographic-agility.md`

Exit requires pinned official inputs, real bounded XSD validation, exact
artifact custody and independent positive/negative evidence for every format,
cryptographic, certificate, QR and generic-evidence claim.
