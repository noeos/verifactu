---
id: ADR-0004
title: Single-maintainer protected change flow
status: accepted
authority: decision
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-12
supersedes: []
---

# ADR-0004: Single-maintainer protected change flow

## Context

The repository has one human maintainer. Requiring `CODEOWNERS` or two approvals
would be either impossible or ceremonial, but unrestricted direct changes would
remove valuable controls.

## Options considered

1. Require unavailable reviewers: nominal separation, operational deadlock.
2. Permit direct pushes: simple, but weak provenance and stale/missing checks.
3. Require PRs with zero approvals plus strong technical controls: honest about
   human independence while preserving deterministic enforcement.

## Decision

Adopt option 3. Do not create `CODEOWNERS`; require no approving review. Require
purpose branches, SSH-signed commits, DCO sign-off, strict required checks,
resolved conversations, squash-only signed merge to protected `main`, linear
history, no force pushes/deletion/bypass and automatic source-branch deletion.

The empty-repository bootstrap is the sole time-bounded exception described in
`GOV-004` and `GOV-010`.

## Consequences

Automation carries more assurance responsibility and requires adversarial
negative tests and effective-state audits. Bus factor remains one and release
claims disclose the absence of independent human review. Adding maintainers may
later add real review without weakening existing controls.

## Verification and reversal

Repository-policy tests query effective GitHub state; CI verifies signature,
DCO, commit range and final SHA. A successor ADR is required to change approval
or bypass semantics.
