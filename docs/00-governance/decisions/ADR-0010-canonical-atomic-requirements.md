---
id: ADR-0010
title: Canonical atomic requirements
status: accepted
authority: decision
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
supersedes: []
requirements: [NFR-0001, NFR-0002]
risks: [RISK-0004]
---

# ADR-0010: Canonical atomic requirements

## Context

Hand-written requirement lists, matrices and tests previously diverged and
allowed broad claims to close without executed evidence.

## Decision

Store each atomic requirement once as schema-validated canonical data. Generate
readable catalogues, traceability matrices and coverage summaries. A requirement
has one subject/action, applicability, authority/rationale, success and forbidden
outcomes, oracle, downstream owner, lifecycle and evidence definition.

Markdown explains context but cannot duplicate normative fields. BCP 14 terms
express obligation strength; ISO/IEC/IEEE 29148 and ISO/IEC 25010 are mapped as
engineering guidance without claiming certification.

## Consequences and verification

Generators and schemas become trusted tooling and need negative fixtures.
Duplicate IDs, orphans, compound statements, unknown links, stale views and
unsupported completion states fail CI.
