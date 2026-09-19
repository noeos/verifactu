---
id: CRYPTO-DOC-0009
title: XAdES profile
status: approved
authority: normative
owner: cryptography-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0024, SRC-0043, SRC-0045]
historical-inputs: [REV-012, REV-013]
---

# XAdES profile

For every edition and signable record/event, the profile registry pins XAdES
form, signature placement, namespace, required `Id` uniqueness, references and
their expected targets/types, transforms/canonicalization, digest/signature
algorithms, `SignedProperties`, signing certificate property, signing time,
policy identifier (or explicit absence) and permitted unsigned properties.

Generation creates the complete profile or fails; structural presence does not
establish validity. Verification resolves each reference by unique expanded
identity, validates exact target bytes/node set, recomputes digests/signature,
then validates qualifying properties and certificate policy. Unreferenced
attacker-controlled duplicates cannot influence the application-selected
record.

Algorithms are edition allowlists with downgrade rejection. Tests include
official/reference signatures plus missing/extra/wrong references, duplicate
IDs, wrapping, namespace changes, altered SignedProperties, wrong transform,
weak algorithm and signature-valid-but-wrong-record cases.
