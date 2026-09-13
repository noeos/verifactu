---
id: BUILD-DOC-0014
title: SPDX 3.0.1 SBOM
status: draft
authority: normative
owner: supply-chain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0059]
decisions: [ADR-0036]
historical-inputs: [REV-068, REV-069, REV-070]
---

# SPDX 3.0.1 SBOM

Emit SPDX 3.0.1 JSON-LD from the canonical graph with creation information,
software packages/files where required, external identifiers, hashes, licences,
origin and explicit dependency/contains/generated-from relationships. The exact
distributed package digest is the subject.

Conformance requires official structural JSON Schema and semantic ontology/SHACL
validation, plus repository rules for unique IDs, closed relationships, licence
evidence and canonical serialization. Passing generic JSON parsing or using an
SPDX-like field set is forbidden.

Historical verification retains schema/context and validator identity. Negatives
exercise invalid vocabulary/type, dangling relationship, missing subject/hash,
licence contradiction and semantically invalid but structurally valid documents.
