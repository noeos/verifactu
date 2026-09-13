---
id: ADR-0037
title: Honest provenance and attestation claims
status: proposed
authority: decision
owner: supply-chain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0032, ADR-0035, ADR-0036]
sources: [SRC-0056, SRC-0057, SRC-0058]
historical-inputs: [REV-067, REV-068, REV-079, REV-082]
---

# ADR-0037: Honest provenance and attestation claims

## Decision

Target SLSA 1.2 Build L2-compatible provenance for hosted builds: authenticated
source/build platform and signed provenance binding builder, source, parameters,
materials and exact subject digests. Do not claim Build L3 without evidence of
the required hardened/isolation properties and an explicit assessment.

GitHub artifact attestations and eligible npm trusted publishing use narrowly
scoped OIDC permissions in protected release jobs. Signing, provenance,
reproducibility, transparency and authorization remain separate claims. A clean
consumer verifies identity, issuer, workflow/ref, repository, predicate,
materials and digest without trusting the producer's summary.

## Consequences and verification

Attestation depends on platform identity and later release configuration; Lot 3
defines schemas and rehearsal while Lot 4 authorizes publication. Negatives
swap subjects, repos, refs, issuers, workflows and materials and test expiry/
revocation policy. If the platform cannot meet the declared level, claims are
downgraded explicitly rather than filled with custom unverifiable metadata.
