---
id: REPO-DOC-0010
title: SSH signatures and DCO
status: approved
authority: normative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0054, SRC-0055]
decisions: [ADR-0031]
historical-inputs: [REV-073, REV-077]
---

# SSH signatures and DCO

Human commits MUST use Git SSH signing (`gpg.format=ssh`, signing key configured,
`commit.gpgsign=true`) and `git commit -S -s`. Verification uses a versioned
allowed-signers file binding exact public key/principal/status; GitHub `Verified`
alone does not replace local cryptographic verification and revocation review.

DCO is a separate rights attestation. The exact `Signed-off-by: Name <email>`
matches the contributor identity and appears once per contributor. `Co-authored-
by` contributors require their own truthful sign-off or the contribution is
split/removed. Bots have explicit identity, authorization and trailer policy;
the owner cannot attest for an unknown third party.

The gate computes every non-main commit in the PR range, rejects shallow/empty/
ambiguous ancestry, untrusted/revoked key, bad signature, missing/malformed/
mismatched/duplicate trailer and unauthorized bot. Test fixtures carry dedicated
non-production keys.

GitHub's native squash commit is accepted as GitHub GPG-verified only after
checking expected repository/PR/head ancestry and preserved DCO attribution.
Key rotation overlaps narrowly and retains historic verification material.
