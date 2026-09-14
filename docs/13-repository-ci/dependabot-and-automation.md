---
id: REPO-DOC-0019
title: Dependabot and repository automation
status: approved
authority: normative
owner: supply-chain-owner
created: 2026-09-12
last-reviewed: 2026-09-14
decisions: [ADR-0031, ADR-0034]
historical-inputs: [REV-070, REV-073, REV-075]
---

# Dependabot and repository automation

Dependabot monitors npm and GitHub Actions weekly with separate ecosystems,
bounded open PRs and conservative groups only where packages share risk and
compatibility. Security updates are not delayed by grouping. Lockfile-only
updates still undergo source, integrity, licence, scripts/native and transitive
diff review.

The admitted configuration is `.github/dependabot.yml`: npm runs Monday at
`05:17` and GitHub Actions Tuesday at `05:47`, both in `Europe/Madrid`, both at
the repository root and each limited to five open version-update PRs. Automatic
rebases are disabled so an already reviewed head cannot change silently. npm uses
`increase-if-necessary`; no registry credential, assignee/reviewer, update group,
ignore rule or alternate target branch is admitted.

Bots never auto-merge, approve, bypass or weaken checks. GitHub documents that
Dependabot signs its own commits, but its configuration has no DCO-signoff option;
`commit-message` controls only prefix and dependency scope. Therefore a bot PR is
an untrusted update proposal and all 17 contexts are emitted, but it is not
mergeable if its exact commit lacks a truthful author signoff accepted by the
repository policy. The maintainer independently regenerates/adopts the exact
change on a new branch, links the originating bot PR and dependency diff, and
creates an SSH-signed/DCO commit. Bot authorship or a human attestation is never
fabricated, and the bot branch is never rewritten to disguise provenance.

Every update regenerates dependency inventory, dual SBOM, licences/notices,
package allowlists where affected and runs the complete compatibility/security
impact. Action PRs prove the new full SHA belongs to reviewed upstream source/tag.

Stale/abandoned automation, excessive PR storms and failing update credentials
create findings. Automation configuration itself is protected policy code.
