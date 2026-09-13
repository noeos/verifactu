---
id: REPO-DOC-0013
title: Branch and tag rulesets
status: draft
authority: normative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0053]
decisions: [ADR-0031, ADR-0033]
historical-inputs: [REV-075, REV-076, REV-077, REV-078]
---

# Branch and tag rulesets

The active `main` ruleset targets exactly the default branch with no bypass
actor and requires pull request, squash, linear history, signed commits, resolved
conversations, strict up-to-date required checks, and blocks force-push/deletion.
Required approvals, code-owner review, last-push approval and extra approval for
unattributed changes are zero/false.

Required contexts come only from the canonical registry and, after the first
trusted run, bind expected GitHub App/source. Renames use an overlap migration:
produce/require old and new, verify, remove old in a later protected change.
Ruleset editing cannot be a routine bypass.

Release tags are immutable signed release subjects, but their creator, pattern,
recovery/bypass and environment relationship remain blocked until Lot 4. Before
that approval no workflow creates/publishes tags or packages. Verification
Engine's organization-admin tag bypass is observed, not copied.

The auditor verifies targets, enforcement, rule parameters, bypass mode/actors,
required producers and absence of conflicting classic protection; absent classic
protection is recorded accurately rather than advertised as redundancy.
