---
id: RELEASE-INDEX
title: Release and operations documentation index
status: approved
authority: informative
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [BUILD-INDEX, REPO-INDEX, REG-INDEX]
historical-inputs: [REV-063, REV-067, REV-068, REV-069, REV-073, REV-074, REV-075, REV-076, REV-077, REV-078, REV-079, REV-080, REV-081, REV-082, REV-083, REV-084]
---

# Release and operations

Status: all 25 substantive specifications drafted under `PLAN-L4`; formal
approval and executable release/operations evidence pending

Authority for versioning, publication, verification and the supported life of a
release.

Substantive documents (25):

- `versioning-and-regulatory-editions.md`
- `release-identities-and-state-machine.md`
- `release-readiness.md`
- `change-freeze-and-candidate-selection.md`
- `release-candidate.md`
- `stable-release.md`
- `signed-tags.md`
- `github-release-and-immutable-assets.md`
- `npm-package-ownership-and-preflight.md`
- `npm-oidc-publication.md`
- `npm-dist-tags-deprecation-and-removal.md`
- `release-artifacts-and-dossier.md`
- `responsible-declaration-handoff.md`
- `external-aeat-validation.md`
- `post-publication-verification.md`
- `release-observability.md`
- `support-policy.md`
- `compatibility-and-deprecation.md`
- `vulnerability-disclosure-and-advisories.md`
- `incident-response.md`
- `rollback-forward-recovery-and-revocation.md`
- `maintainer-account-and-key-recovery.md`
- `regulatory-change-operation.md`
- `continuity-and-disaster-recovery.md`
- `operations-runbook-catalog.md`

Exit requires a synthetic complete release rehearsal, then exact protected tag,
OIDC, three-package, registry/GitHub, external, declaration, support and recovery
evidence before a production release can be called supported. The approved
elaboration contract is [`PLAN-L4`](../lot-4-release-assurance-closure-plan.md).
