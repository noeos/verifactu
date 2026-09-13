---
id: RELEASE-DOC-0003
title: Release readiness
status: approved
authority: normative
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0040, ADR-0051, ADR-0052]
historical-inputs: [REV-001, REV-084]
---

# Release readiness

Readiness requires current official/legal/CRA/applicability review; complete
requirements/ADRs; all 84 historical dispositions; no material finding/expired
exception/unknown platform state; full quality/security/performance/recovery/
integration evidence; three reproducible packages; licences/SBOM/provenance;
support/runbooks/communications; and exact GitHub/npm desired-state read-back.

The machine report lists every gate, subject, freshness and blocker. `not-
applicable` needs positive proof. External AEAT/provider evidence is required for
every publicly claimed available scenario; unavailable mandatory scope blocks.

Approval freezes exact inputs and produces a signed authorization candidate. A
source, dependency, toolchain, edition, workflow, finding or policy change after
readiness invalidates affected evidence and returns to `planned`, never waives it.
