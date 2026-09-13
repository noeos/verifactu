---
id: ASSURANCE-DOC-0017
title: Release dossier model
status: draft
authority: normative
owner: assurance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0047, ADR-0052, ADR-0053]
historical-inputs: [REV-063, REV-074, REV-079, REV-082]
---

# Release dossier model

Dossier is a signed immutable graph root joining release identity/state, sources/
edition/legal reviews, requirements/ADRs/risks/findings/exceptions, code/tests/
audits, packages/SBOM/provenance, GitHub/npm/external observations, support,
runbooks and declaration handoff.

Completeness validator resolves every digest/location and recomputes conclusions.
Public subset redacts restricted evidence while committing to it. A synthetic
full dossier is rebuilt independently before first production candidate; historic
dossiers remain readable and never edited.
