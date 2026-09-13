---
id: REPO-DOC-0012
title: GitHub repository desired state
status: approved
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
approve PRs. Every external contributor requires owner approval before a fork PR
workflow can execute. Artifact/log retention is the public-repository maximum of
90 days. Reusable-workflow access is explicitly `not-applicable` because GitHub's
repository endpoint applies only to private/internal repositories; a `422` with
that documented reason is retained rather than misreported as configured. These
are versioned desired-state fields, never platform defaults.

P1 enables Dependabot alerts/updates, secret scanning and push protection; the
dependency graph is an always-on public-repository capability. Validity checks
and non-provider patterns MUST be enabled when the repository's plan and
organization entitlement actually admit the change. P1 attempted both fields
and the immediate repository read-back remained `disabled`, so policy records
that observed state and P2 MUST reassess capability rather than claim success.

Code scanning is implemented in P2 through the admitted versioned CodeQL
workflow, after executable source exists. P1 records default setup as
`not-configured` and the alerts surface as `not-found`; it does not create an
unversioned default-setup workflow or call this state enabled. Private/
organization settings are recorded `verified`, `inaccessible`, `not-found`,
`unknown` or `not-applicable-demonstrated`; none of the latter states is silently
converted to disabled, absent or passing.

A versioned machine schema declares value, API source, required visibility,
normalization and drift severity. Mutation is ordered, least-privileged and
always followed by independent read-back and stored redacted diff.
