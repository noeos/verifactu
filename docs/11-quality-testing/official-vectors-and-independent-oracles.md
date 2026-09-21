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

P3-B provides an offline Python oracle and hostile XML parser, official
entry-point vectors, synthetic boundary/compatibility vectors and five seeded
adversarial fixtures. The oracle recomputes source SHA-256/SHA-512 identities,
checks generated output provenance and detects deliberate baseline corruption;
it does not import the Node generator or claim legal/organizational
independence. The authoritative snapshot closes all 27 source-custody edges.
Its generated candidate remains `creationAllowed=false`; P4 must add the
independent fiscal, format and cryptographic vectors before those claims can be
evidence-complete.
