---
id: BUILD-DOC-0017
title: Artifact signing and verification
status: approved
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0054, SRC-0058]
decisions: [ADR-0031, ADR-0037]
historical-inputs: [REV-073, REV-079, REV-082]
---

# Artifact signing and verification

Git commits/tags, GitHub attestations, npm registry integrity/provenance and any
detached release signature have separate subjects, identities, roots and claims.
Verification always recomputes bytes/digest first and checks algorithm, signer/
issuer, repository/ref/workflow, validity/revocation and authorization policy.

Human source commits use SSH allowed signers; native squash uses verified GitHub
GPG with PR attribution. Release tag/key/signing choice is finalized in Lot 4.
No signature transfers trust to dependencies, proves reproducibility or asserts
regulatory correctness.

Offline verification bundles contain only public roots, policy and immutable
statements. Rotation preserves historic keys/status and overlap evidence;
compromise revokes future authority, identifies affected subjects and triggers
rebuild/reissue. Wrong key, expired/revoked identity, altered bytes and cross-
repository replay are mandatory negatives.
