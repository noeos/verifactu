---
id: REPO-DOC-0012
title: GitHub repository desired state
status: draft
authority: normative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0052, SRC-0053]
decisions: [ADR-0031, ADR-0032]
historical-inputs: [REV-075, REV-076, REV-077, REV-081]
---

# GitHub repository desired state

`noeos/verifactu` is public with `main` default; issues enabled and wiki,
projects, discussions and merge queue disabled unless separately decided. Only
squash merge is allowed; merge commits, rebase merge and auto-merge are disabled;
head branches delete automatically. Web commit/signoff behavior cannot weaken
SSH+DCO policy.

Actions permit GitHub-owned Actions plus an exact admitted allowlist and require
full SHA pinning. Default workflow token is read-only and Actions may not create/
approve PRs. Fork workflow approval, artifact/log retention and reusable workflow
access are explicit desired-state fields, never platform defaults.

Dependabot alerts/updates, dependency graph, secret scanning, push protection,
validity checks and code scanning are enabled where GitHub exposes them. Private/
organization settings are recorded `verified`, `inaccessible`, `unknown` or
`not-applicable-demonstrated`; inaccessible never equals disabled or passing.

A versioned machine schema declares value, API source, required visibility,
normalization and drift severity. Mutation is ordered, least-privileged and
always followed by independent read-back and stored redacted diff.
