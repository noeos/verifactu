---
id: REPO-DOC-0019
title: Dependabot and repository automation
status: approved
authority: normative
owner: supply-chain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0031, ADR-0034]
historical-inputs: [REV-070, REV-073, REV-075]
---

# Dependabot and repository automation

Dependabot monitors npm and GitHub Actions weekly with separate ecosystems,
bounded open PRs and conservative groups only where packages share risk and
compatibility. Security updates are not delayed by grouping. Lockfile-only
updates still undergo source, integrity, licence, scripts/native and transitive
diff review.

Bots never auto-merge, approve, bypass or weaken checks. Their commits have
verified platform/bot identity and an explicit DCO policy compatible with actual
authorship; they cannot inherit the human's attestation. Maintainer regeneration
is SSH-signed/DCO and preserves the bot PR attribution.

Every update regenerates dependency inventory, dual SBOM, licences/notices,
package allowlists where affected and runs the complete compatibility/security
impact. Action PRs prove the new full SHA belongs to reviewed upstream source/tag.

Stale/abandoned automation, excessive PR storms and failing update credentials
create findings. Automation configuration itself is protected policy code.
