---
id: REPO-DOC-0021
title: GitHub effective-state audit
status: approved
authority: normative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-14
sources: [SRC-0052, SRC-0053]
decisions: [ADR-0031, ADR-0033]
historical-inputs: [REV-075, REV-076, REV-077, REV-078, REV-080, REV-081]
---

# GitHub effective-state audit

The read-only collector paginates and schema-validates repository/settings,
Actions policy/permissions, rulesets and bypass actors, classic protection,
environments/reviewers, apps, hooks/deploy keys, secrets metadata, security
features/alerts, workflows/runs and required check producers. Organization/private
surfaces are queried where authorized.

Raw redacted responses retain endpoint, parameters, HTTP/status, observed time,
ETag where available and digest. Normalization distinguishes `verified`,
`absent`, `inaccessible`, `unknown`, `not-applicable` and `error`; 403/404 or an
empty page is never silently converted to an empty secure set.

Desired/effective diff reports exact field, severity, inheritance and remediation
without mutating state. Required producer binding considers App identity and
actual recent run/SHA, not context text alone. Scorecard JSON/SARIF is imported
as findings only and cannot override direct evidence.

Offline API fixtures cover pagination, schema drift, permission denial, inherited
controls, duplicate rules, tag bypass and partial outage. The ephemeral Actions
token does not have repository-administration authority and MUST NOT be presented
as a full effective-state auditor. The scheduled `github-audit.yml` job therefore
tests the collector and proves that exact authority boundary, retaining a report
whose claim is explicitly `authority-boundary-only`.

The full desired/effective audit is run by the authenticated maintainer from a
clean protected-main checkout, with read-only API calls, and its redacted report
is retained in the protected phase-closure PR. No PAT, GitHub App key or other
persistent repository secret is introduced merely to automate administrative
read-back. A future credentialed monitor requires its own threat model, ADR,
least-privilege design and protected approval before it can replace this split.
Critical drift or an unreadable required surface blocks phase/release closure.
