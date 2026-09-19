---
id: BUILD-DOC-0016
title: Provenance and attestations
status: approved
authority: normative
owner: supply-chain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0056, SRC-0057, SRC-0058]
decisions: [ADR-0037]
historical-inputs: [REV-067, REV-079, REV-082]
---

# Provenance and attestations

The provenance predicate records exact subject digests, builder identity,
repository/ref/commit, build type, external/internal parameters, resolved
materials with digests, invocation, timestamps and reproducibility context.
GitHub-hosted signed provenance targets SLSA 1.2 Build L2-compatible semantics.

OIDC/attestation permission exists only in protected release jobs and binds the
expected workflow/ref/environment. npm provenance and GitHub attestations are
separate evidence over the same verified package subject. Lot 3 rehearsal cannot
publish or claim attained release provenance.

Independent verification checks signature/transparency, issuer/identity, repo,
workflow/ref, predicate/build type, materials and subject bytes. Swapped repo/
branch/workflow/digest/material, unsigned statement and unsupported level fail.
L3 is forbidden without explicit hardened-build assessment.
