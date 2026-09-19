---
id: RELEASE-DOC-0010
title: npm OIDC publication
status: approved
authority: normative
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0056, SRC-0068]
decisions: [ADR-0042, ADR-0043, ADR-0044]
historical-inputs: [REV-075, REV-078, REV-082]
---

# npm OIDC publication

Only hosted protected tag workflows in `npm-prerelease`/`npm-production` receive
`id-token: write`; default is read-only, no persistent token/cache/untrusted
artifact. Immediately before publish validate OIDC-bound repo/workflow/environment,
tag/SHA/version, authorization, package/owner/access and subject digest.

Publish explicit tarball path with `--provenance --access public --tag <unique>`;
never run package lifecycle scripts or rebuild inside publish. Record request
identity, npm response/version/integrity/attestation and uncertain outcome before
retrying via registry observation.

Wrong audience/subject, missing provenance, package mismatch or environment
bypass fails. Publication order and recovery follow `ADR-0044`; logs redact all
claims/tokens and permissions expire with the job.
