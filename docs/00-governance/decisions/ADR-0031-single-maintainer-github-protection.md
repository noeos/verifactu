---
id: ADR-0031
title: Honest single-maintainer GitHub protection
status: accepted
authority: decision
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0004]
sources: [SRC-0053, SRC-0054, SRC-0055]
historical-inputs: [REV-073, REV-075, REV-076, REV-077, REV-078, REV-081]
---

# ADR-0031: Honest single-maintainer GitHub protection

## Decision

All ordinary changes reach `main` through a strict up-to-date PR and native
squash. Main requires linear/signed history and stable checks, resolved
conversations, and prohibits direct push, force-push and deletion with no
ordinary bypass. Source branches delete automatically after merge.

Because one human maintains the repository, required approvals are zero and
`CODEOWNERS`, last-push approval and unattributed-change approval are disabled.
All human branch commits use an allowed SSH signer and canonical DCO trailer.
Co-authors and bots receive truthful contributor-specific treatment.

Native GitHub squash produces a GitHub-authored verified GPG commit, not the
maintainer's SSH signature. It is accepted only with verified GitHub identity,
PR/head attribution and retained DCO semantics. A maintainer-SSH-signed squash
would require a separately governed signing bot/key and is not fabricated.

## Consequences and verification

This removes fictional human separation and relies on automation, evidence and
small reviewable PRs. API read-back tests exact effective rules, bypass actors,
expected check producers and merge settings. Negative fixtures cover unsigned/
untrusted SSH, malformed/missing DCO, direct push and stale-head merge.
