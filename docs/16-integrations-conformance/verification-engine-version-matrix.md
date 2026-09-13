---
id: INTEGRATION-DOC-0003
title: Verification Engine version matrix
status: approved
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0029]
decisions: [ADR-0029, ADR-0038]
historical-inputs: [REV-017, REV-066, REV-067]
---

# Verification Engine version matrix

Baseline is Engine 1.0.1 at the researched contract, but implementation locks the
verified npm tarball digest and provenance. The matrix crosses Engine semver/API,
profile version, Node minimum/primary, ESM/CJS, VeriFactu version and evidence
schema with `required`, `read-only-historical`, `unsupported` or `blocked` status.

Required cells pack/install both projects independently and execute success,
invalid, indeterminate, malformed profile/evidence, cancellation and resource
limits. Candidate cross-repository CI may test future versions but cannot publish,
mutate or trust sibling source.

Upgrade requires public diff, profile/vector compatibility and historic evidence
verification. Downgrade/mixed incompatible versions fail before processing with
stable diagnostics; no silent fallback. Dropped versions retain the verifier or
documented migration needed for the evidence retention window.
