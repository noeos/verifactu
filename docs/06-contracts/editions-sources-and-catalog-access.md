---
id: CONTRACT-DOC-0013
title: Edition source and catalogue access
status: approved
authority: normative
owner: api-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0009, ADR-0018]
historical-inputs: [REV-084]
---

# Edition source and catalogue access

`editions.list()` returns immutable installed descriptors. `editions.open(id,
expectedDigest?)` verifies the manifest and dependency closure before exposing
read-only record designs, schemas, WSDL/binding metadata, catalogues, rules,
errors, algorithms, vectors, source provenance and redistribution notices.

Assets are accessed through documented streams/byte views with size limits and
digests, not guessed package filesystem paths. Enumeration order is canonical.
Absent, corrupt, unknown or unsupported editions fail explicitly; there is no
network fallback or mutable alias called `latest` in persisted commands.

CLI provides equivalent list/inspect/verify/export-source-evidence operations.
Packed clean-consumer tests prove all declared assets exist, are byte-identical
to the manifest and remain usable offline. Restricted-redistribution sources
are represented by provenance/digest/acquisition instructions without unlawful
bundling.
