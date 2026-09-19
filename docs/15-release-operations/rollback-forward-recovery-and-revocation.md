---
id: RELEASE-DOC-0021
title: Rollback, forward recovery and revocation
status: approved
authority: normative
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0050]
historical-inputs: [REV-074, REV-078, REV-082, REV-083]
---

# Rollback, forward recovery and revocation

Host deployment may roll back only when persisted/edition compatibility proves
safe. Registry recovery is forward: new version, independently verified, then
dist-tag movement/deprecation/advisory. Versions, tags, assets, declarations and
evidence are never overwritten.

Runbooks distinguish package, key/tag signer, certificate, OIDC publisher,
regulatory edition, profile and external endpoint suspension/revocation. Each
defines authority, affected range, consumer detection, mitigation, historical
verification and resumption proof.

Unknown npm publish first queries registry; partials stay off `latest`. Unpublish
is last resort under npm/legal policy and cannot recall installed copies. All
actions preserve original subjects and append supersession/audit links.
