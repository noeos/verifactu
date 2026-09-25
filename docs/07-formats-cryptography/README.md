---
id: CRYPTO-INDEX
title: Formats and cryptography documentation index
status: approved
authority: informative
owner: cryptography-owner
created: 2026-09-12
last-reviewed: 2026-09-25
dependencies: [REG-INDEX, DOM-INDEX, SEC-INDEX]
historical-inputs: [REV-007, REV-021, REV-045, REV-046]
---

# Formats and cryptography

Status: all 17 substantive specifications are approved as design authority.
Executable format, cryptographic and independent-oracle evidence remains
pending.

Authority for official byte representations and their distinct integrity and
cryptographic guarantees.

Official fingerprinting/chaining, XML/XSD, XAdES, certificate trust and
authorization, QR, and Verification Engine evidence are separate claims with
separate artifacts and independent oracles. Exact bytes are first-class
digest-addressed objects; no callback or TypeScript type is trusted as proof.

Approved specifications (17):

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

P4-specific boundaries are governed by ADR-0055 (offline CRL/OCSP evidence),
ADR-0056 (edition-bound QR and independent decode), ADR-0057 (local EU DSS
provider) and ADR-0021 (separate integrity claims). These decisions add
verification obligations; they do not assert that P4 is implemented.
