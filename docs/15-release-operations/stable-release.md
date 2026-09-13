---
id: RELEASE-DOC-0006
title: Stable release
status: draft
authority: normative
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0040, ADR-0044, ADR-0045, ADR-0046]
historical-inputs: [REV-074, REV-078, REV-079, REV-082]
---

# Stable release

Stable begins with a protected version/changelog/support/dossier PR and full
final-head readiness. Annotated signed `vX.Y.Z` selects main. Hosted clean build
repeats every release gate without RC/PR cache and creates three attested subjects.

Publish library, adapter kit, CLI under `verification-X-Y-Z`; record each call.
Independent registry verification precedes three `latest` movements. Only after
convergence may the closed GitHub draft become public/immutable and the final
verifier mark `supported`.

Any skip, unknown, partial, mismatch, external-effect uncertainty, legal/source
expiry or missing artifact aborts. Security releases may restrict disclosure but
not critical testing/integrity. `1.0.0` additionally requires every complete-
product and external gate in `ROADMAP-DOC-0014`.
