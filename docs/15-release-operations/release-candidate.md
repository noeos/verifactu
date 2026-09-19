---
id: RELEASE-DOC-0005
title: Release candidate
status: approved
authority: normative
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-13
decisions: [ADR-0040, ADR-0041, ADR-0045]
historical-inputs: [REV-067, REV-079, REV-082]
---

# Release candidate

`vX.Y.Z-rc.N` is an annotated SSH-signed protected-main tag. Candidate workflow
does two clean isolated builds, full supported matrices/campaigns, package
allowlists/consumers, SBOM/licences/provenance rehearsal, recovery and dossier.

Optional npm publication uses unique immutable prerelease versions under `next`
through `npm-prerelease` OIDC; it never moves `latest` or claims stable support.
Downloaded packages undergo independent verification, complete Engine/adapter
scenarios, synthetic future-Facturacion host-contract conformance and available
external AEAT scenarios. No real Facturacion integration is claimed or required.

Every confirmed defect becomes regression and a new RC; no tag/version overwrite.
RC evidence remains for audit even when abandoned. Stable selection compares
semantic trees but repeats every gate from new stable source.
