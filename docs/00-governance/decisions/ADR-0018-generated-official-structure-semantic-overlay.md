---
id: ADR-0018
title: Generated official structure with semantic overlay
status: accepted
authority: decision
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0009]
sources: [SRC-0017, SRC-0019, SRC-0020, SRC-0021]
historical-inputs: [REV-001, REV-008, REV-037, REV-039]
---

# ADR-0018: Generated official structure with semantic overlay

## Decision

For each immutable regulatory edition, import the complete pinned XSD/WSDL
dependency graph and generate structural types, catalogue entries and binding
metadata reproducibly. Keep legal and AEAT prose validations in a separately
versioned semantic rule registry linked to sources and structural paths.

Generated output is never hand edited. Generation records source and tool
digests, configuration, environment and byte-identical regeneration evidence.
Schema-valid does not mean semantically valid; semantic-valid does not mean
AEAT-accepted.

## Consequences

Drift becomes inspectable while prose-only obligations remain expressible. CI
will compare generated output, structural coverage and semantic-rule coverage,
including removed/renamed fields and negative fixtures.
