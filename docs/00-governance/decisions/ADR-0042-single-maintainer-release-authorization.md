---
id: ADR-0042
title: Single-maintainer release authorization
status: accepted
authority: decision
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0004, ADR-0031, ADR-0041]
sources: [SRC-0072]
historical-inputs: [REV-077, REV-078, REV-081]
---

# ADR-0042: Single-maintainer release authorization

Release intent is a focused protected PR, SSH+DCO branch commits, exact readiness
record and the maintainer's annotated SSH-signed tag. Environments
`npm-prerelease` and `npm-production` require zero reviewers, no admin bypass and
exact deployment/ref rules. This is honest single-person governance.

OIDC subject binding, minimal permissions, immutable inputs, complete automated
gates, cooling where safe, external read-back and post-publication verification
are compensating controls. Self-review, fake accounts, bot approvals and a
permanent OrganizationAdmin bypass are forbidden.

API/UI evidence proves effective settings and usability before GA. Emergency
recovery is separately logged, time-bounded and tested; it cannot alter published
bytes. A future real team may add independent review through a successor ADR.
