---
id: QA-DOC-0005
title: Official vectors and independent oracles
status: approved
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-15
sources: [SRC-0017, SRC-0023, SRC-0024, SRC-0025, SRC-0046]
decisions: [ADR-0018, ADR-0019, ADR-0020, ADR-0027]
historical-inputs: [REV-057, REV-062]
---

# Official vectors and independent oracles

Official material MUST be captured through the regulatory source pipeline with
resolved URI, observed edition/date, media type, dependency closure and digest.
Examples are authoritative only for the behavior they explicitly demonstrate;
they do not override law, order, schema or later official correction.

Critical oracle inventory covers hash preimages/digests, XML/XSD, XAdES/XMLDSig,
QR payload/rendering, SOAP structure, validation catalogues, state transitions
and Verification Engine evidence. At least one independent implementation or
literal official result challenges each critical production algorithm.

Reference tools run offline on the same immutable input and report exact version,
configuration and output bytes. Majority vote is forbidden. Conflicts are
classified as product defect, oracle defect, edition mismatch or authority
ambiguity, retain all evidence and block affected claims.

Negative vectors modify one boundary at a time: encoding/order/namespace,
digest/reference/transform, certificate, occurrence/length/catalogue, correlation
or state. The expected diagnostic and rejection layer are explicit.

## Initial oracle state

The oracle and vector model above is approved as a design requirement only. No
executable independent oracle, source snapshot, generated contract closure or
phase trace matrix is currently available in the repository.

The implementation must first admit immutable official inputs, generate the
required vectors and fixtures, provide independent challenge paths and bind
every result to exact source, toolchain, configuration and artifact identities.
Until then, no source, contract or regulatory claim is evidence-complete.
