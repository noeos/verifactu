---
id: CRYPTO-DOC-0016
title: Conformance vectors and independent oracles
status: approved
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-16
historical-inputs: [REV-008, REV-062]
---

# Conformance vectors and independent oracles

The vector manifest records ID, claim, edition/profile, source/provenance and
licence, exact input/output digests, expected diagnostics, oracle/tool version,
independence analysis and supported platforms. Official examples are retained
unaltered; derived mutations identify parent and transformation.

Suites cover structural/semantic record validity, official serialization,
fingerprint/chaining, XML round trip/XSD, C14N, XAdES/reference selection,
certificate policy, QR payload/render, Noeos evidence and SOAP wire artifacts.
For each positive, minimal mutations target every selected field, ordering,
namespace, encoding, digest, identity, signature property and trust dimension.

An oracle is independent only if it does not share the production builder,
parser, rules or generated intermediate assumption for the claim. Disagreement
blocks the vector and creates a finding; majority vote is not correctness.
Vectors run offline and deterministically. Live AEAT observations are separate
evidence linked to, but never replacing, local vectors.

## Initial oracle state

The structural, semantic and cryptographic oracle suites described above are
design requirements only. No executable oracle currently exists in the
repository and no source snapshot or generated contract set is admitted as a
runtime input.

Implementation must provide independent structural and semantic oracles,
offline deterministic vectors, minimal mutations, source/provenance bindings
and explicit claim classification before any format or cryptographic claim can
be verified.
