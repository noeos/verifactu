---
id: ADR-0041
title: Signed immutable release tags and independent trust roots
status: accepted
authority: decision
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0031]
sources: [SRC-0054, SRC-0071]
historical-inputs: [REV-073, REV-076, REV-078, REV-082]
---

# ADR-0041: Signed immutable release tags and independent trust roots

Release tags are annotated, strict `vX.Y.Z` or `vX.Y.Z-rc.N`, SSH-signed by an
authorized non-revoked release key and point to protected-main ancestry whose PR
evidence is complete. Tag rules block update/deletion with no routine bypass.

Verification checks tag object and peeled commit, grammar/version/channel,
signature, signer validity at creation, ancestry and authorization record. Trust
roots/policy are pinned by the protected verifier and separate recovery custody;
a signer file controlled only by the candidate cannot authorize itself.

Lightweight/mutable tags and platform “verified” text alone are rejected.
Rotation overlaps narrowly and preserves historical keys/revocation chronology.
Emergency administration may create a new corrective tag/version but never
rewrite an existing release.
