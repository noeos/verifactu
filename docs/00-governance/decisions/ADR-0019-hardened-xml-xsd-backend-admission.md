---
id: ADR-0019
title: Hardened XML and XSD backend admission
status: accepted
authority: decision
owner: cryptography-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0020, SRC-0035, SRC-0043, SRC-0044]
historical-inputs: [REV-008, REV-009, REV-010, REV-011]
---

# ADR-0019: Hardened XML and XSD backend admission

## Decision

Admit no XML/XSD implementation until a recorded spike proves real XSD
validation, namespace/QName/attribute fidelity, deterministic serialization,
offline pinned resolution, disabled DTD/entities/network, limits before and
during materialization, cancellation, isolation, maintained provenance,
compatible licence and reproducible supported-runtime packaging.

Use an independently implemented oracle for conformance and hostile fixtures.
A native or WASM libxml2-class backend is a candidate, not a preselected
dependency. Regex validation, post-DOM size checks and custom
whitespace-based “canonicalization” are prohibited.

## Consequences

The project accepts provider/process complexity to obtain real validation and
resource isolation. Failure to find an admissible backend blocks the affected
capability; it does not authorize a substitute that weakens the claim.
