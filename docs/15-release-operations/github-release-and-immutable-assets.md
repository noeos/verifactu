---
id: RELEASE-DOC-0008
title: GitHub release and immutable assets
status: draft
authority: normative
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0071]
decisions: [ADR-0046]
historical-inputs: [REV-078, REV-079, REV-082]
---

# GitHub release and immutable assets

The closed draft contains three exact tarballs, SHA-256/SHA-512, both SBOMs,
reconciliation/build manifest, public dossier/declaration handoff, provenance/
attestation locators, changelog/migration/support and verification instructions.
Names/types/sizes/digests form an allowlist.

Draft publishes only after npm bytes and channels verify; prerelease/draft/tag
flags and notes/claims are audited, then immutable-release state is enabled/read
back where available. No asset may be appended/replaced afterward.

Without platform immutability, assets are labelled monitored replicas of signed
tag/npm/external evidence. Scheduled digest/metadata drift creates incident and a
new corrective release. Deleting a release never erases canonical evidence.
