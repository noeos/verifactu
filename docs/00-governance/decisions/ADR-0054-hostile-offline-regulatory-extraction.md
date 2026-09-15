---
id: ADR-0054
title: Hostile offline regulatory extraction from blocked source snapshots
status: accepted
authority: decision
owner: regulatory-owner
created: 2026-09-15
last-reviewed: 2026-09-15
dependencies: [ADR-0006, ADR-0009, ADR-0018, ADR-0019, ADR-0027]
historical-inputs: [REV-004, REV-005, REV-006, REV-008, REV-009, REV-019]
---

# ADR-0054: Hostile offline regulatory extraction from blocked source snapshots

The 2026-09-15 observation can authenticate the current BOE corpus and the
complete production WSDL/XSD graph, but mandatory AEAT record-design,
validation, hash, signature and QR material is unavailable through an admitted
channel. The snapshot therefore remains immutable and `blocked`; structural
extraction may create an inspectable `candidate`, but neither object can approve
an edition or authorize creation of a fiscal artifact.

The current production WSDL locations published in the AEAT service document
govern the import. Archived test-environment copies that differ by one byte are
historical evidence only and cannot replace current production bytes. A failed
official TLS chain is recorded as a blocker; certificate validation, security
level and authority are never weakened to obtain a document.

All XML is hostile after digest verification. DTD, declared or malformed entity,
XInclude, processing instruction, invalid XML character or QName, reserved or
ambiguous namespace, remote resolution, path escape and resource overflow fail
before interpretation. XML grammar whitespace is distinct from general Unicode
whitespace. The sole exception is the exact digest-pinned W3C XMLDSig schema:
its historical DTD is preserved in custody, then removed by a bounded scanner
before parsing. No declared entity is expanded, no DTD is resolved and any byte
change invalidates the exception.

Generated structure preserves namespace declarations, expanded QNames, order,
cardinality, choices, facets, imports, service/binding/operation/endpoint data
and documentation digests. It does not infer absent cross-field rules or legal
semantics. The candidate cannot exit P3 until a separately implemented oracle
challenges source identities, imports, fields, catalogues and SOAP surface and
catches maintained seeded defects. New authoritative bytes create a successor
source snapshot and candidate; published identities are never rewritten.
