---
id: ADR-0046
title: Closed immutable GitHub release
status: accepted
authority: decision
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0041, ADR-0045]
sources: [SRC-0071]
historical-inputs: [REV-078, REV-079, REV-082]
---

# ADR-0046: Closed immutable GitHub release

Prepare a draft with a closed allowlist of three tarballs, SHA-256/SHA-512,
SBOMs, provenance/attestation references, release manifest/dossier/public notes
and verification instructions. Publish only after npm subjects and channels are
verified, then enable/read back immutable-release protection where available.

If platform immutability is unavailable, the signed tag, npm subjects and
external immutable evidence store remain canonical; GitHub assets are explicitly
monitored replicas. Mutation/deletion is forbidden and triggers incident/new
release, never an equivalent-immutability claim.

Draft/prerelease flags, tag, asset names/types/sizes/digests, notes/claims and
feature state are independently audited. Adding “missing” assets after public
release is prohibited; completeness must be achieved before transition.
