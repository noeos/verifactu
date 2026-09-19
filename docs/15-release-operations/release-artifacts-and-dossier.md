---
id: RELEASE-DOC-0012
title: Release artifacts and dossier
status: approved
authority: normative
owner: assurance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0047, ADR-0052, ADR-0053]
historical-inputs: [REV-063, REV-068, REV-074, REV-079]
---

# Release artifacts and dossier

The immutable dossier indexes source/tag/version, three packages/checksums,
official edition/sources, requirements/ADRs/risks/findings/exceptions, toolchain/
dependencies/licences/SBOM/provenance, all quality/security/performance/recovery/
integration/external results, GitHub/npm state, support and declaration handoff.

Every item has schema, subject, producer, digest, sensitivity/access, location,
retention and conclusion. Missing/expired/inconclusive/wrong-subject evidence is
visible and blocks affected claims; summaries never replace raw proof.

A public subset excludes secrets/personal/test credentials/embargo evidence while
cryptographically committing to completeness. Independent reconstruction from
artifacts validates the index. Corrections create a new signed dossier/version.
