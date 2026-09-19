---
id: GOV-SCHEMA-INDEX
title: Governance schemas
status: approved
authority: normative
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-12
---

# Governance schemas

These JSON Schemas define the first machine-readable contracts. They use
JSON Schema Draft 2020-12 and intentionally reject unknown properties. The
documentation toolchain will extract YAML front matter, normalize YAML dates to
strings and validate it against `document-metadata.schema.json`.

- [`document-metadata.schema.json`](document-metadata.schema.json) defines
  common document identity and lifecycle metadata.
- [`traceability-record.schema.json`](traceability-record.schema.json) defines
  canonical typed relationships and dispositions.
- [`historical-disposition.schema.json`](historical-disposition.schema.json)
  defines the required treatment of every `REV-*` finding.

Schema presence is not enforcement. P1 must provide the pinned checker and
negative fixtures that prove these contracts in execution.
