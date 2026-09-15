---
id: QA-DOC-0005
title: Official vectors and independent oracles
status: approved
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-15
sources: [SRC-0017, SRC-0023, SRC-0024, SRC-0025, SRC-0046]
decisions: [ADR-0018, ADR-0019, ADR-0020, ADR-0027, ADR-0054]
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

## P3 oracle and vectors

Official observations reference immutable source bytes rather than duplicating
or relabelling them. Synthetic namespace/QName material, exact boundary cases,
adversarial XML and compatibility expectations live under their corresponding
`fixtures/` classes. Every negative case names the required diagnostic.

`internal/independent-oracles/regulatory_contract_oracle.py` uses Python 3.13.15
stdlib Expat and shares no parser or generator implementation with the JavaScript
path. It authenticates all 37 source objects with size, SHA-256 and SHA-512,
reconstructs all nine technical documents, and compares the exact document and
snapshot bindings, 13 imports, 416 field declarations including context,
cardinality, choices and QNames, simple-type facets, 45 catalogues, complete
WSDL/SOAP messages/operations/actions/uses/services/ports/addresses, six public
schemas and the generated output closure.

The declarative seed manifest proves sensitivity to ten independent faults:
snapshot binding, document identity, import closure, field cardinality,
simple-type facet, catalogue value, SOAP action, SOAP address, artifact digest
and blocked creation state. Its DTD exception independently requires the exact
XMLDSig source digest and never enables external or parameter entities. The
report records Python, Expat, oracle, seed, source-closure, edition and output
identities; the canonical runner denies network and undeclared secrets.

The executable P3 trace matrix maps the 19 requirements that P3 can enforce,
prevent or explicitly block to real source IDs, immutable contract paths and
registered task controls. It also dispositions all eight applicable historical
findings. Requirements allocated to later fiscal, privacy, delivery or release
phases are not relabelled as P3-complete; the source plan retains their authority
links and the roadmap retains their owning phase.

This is an independent implementation, not an independent organization or legal
assessment. Hash, XAdES, QR and complete semantic-rule oracles cannot exist until
their official sources are admitted; their absence remains a blocker rather than
an invented expected result.
