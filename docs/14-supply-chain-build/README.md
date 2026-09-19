---
id: BUILD-INDEX
title: Supply chain and build documentation index
status: approved
authority: informative
owner: supply-chain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [REPO-INDEX, SEC-INDEX, QA-INDEX]
historical-inputs: [REV-065, REV-066, REV-067, REV-068, REV-069, REV-070, REV-071, REV-075, REV-079, REV-080]
---

# Supply chain and build

Status: all 19 substantive specifications are approved as design authority.
Executable build and supply-chain evidence remain pending.

Authority for dependencies, build integrity, package contents and provenance.
It covers every executable input and every distributed artifact of the complete
product; a lockfile, scanner, nominal SBOM or successful pack command is never
sufficient evidence on its own.

Substantive documents (19):

- `dependency-admission.md`
- `dependency-inventory-and-drift.md`
- `github-action-admission.md`
- `lockfile-and-registry-integrity.md`
- `install-scripts-native-and-optional-code.md`
- `external-tool-downloads.md`
- `build-system.md`
- `clean-and-hermetic-builds.md`
- `reproducibility.md`
- `package-content-allowlists.md`
- `tarball-consumers.md`
- `licenses-and-attribution.md`
- `cyclonedx-sbom.md`
- `spdx-sbom.md`
- `sbom-reconciliation.md`
- `provenance-and-attestations.md`
- `artifact-signing-and-verification.md`
- `build-evidence-manifest.md`
- `supply-chain-threats-and-recovery.md`

Area completion requires immutable admitted inputs, clean network-bounded
builds, isolated reproducibility, closed tarball allowlists, real installed
consumers, complete licences/notices, reconciled CycloneDX 1.7 and SPDX 3.0.1,
and independently verifiable subject-bound provenance/signatures. The approved
elaboration contract is in [`PLAN-L3`](../lot-3-assurance-delivery-plan.md).
