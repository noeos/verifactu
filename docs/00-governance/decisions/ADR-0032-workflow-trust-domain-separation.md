---
id: ADR-0032
title: Workflow trust-domain separation
status: accepted
authority: decision
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0012, ADR-0031]
sources: [SRC-0052]
historical-inputs: [REV-075, REV-076, REV-078, REV-080]
---

# ADR-0032: Workflow trust-domain separation

## Decision

Use separate domains for untrusted PR validation, trusted main/schedule audits
and privileged release operations. Repository default permission is read-only;
each job grants the minimum explicit scope. PR code receives no secrets, write,
OIDC, attestation or protected environment access.

`pull_request_target` and privileged follow-up workflows must not execute,
source, restore executable caches from or trust artifacts produced by untrusted
code. Metadata-only automation validates all interpolated input and never checks
out the PR head. Privileged release waits for Lot 4 and consumes a protected
immutable main subject rebuilt in its own trust domain.

## Alternatives and consequences

One workflow is simpler but mixes tokens and attacker-controlled execution.
Artifact handoff can preserve isolation only with authenticated subjects and
non-executable schemas; it remains disallowed for privilege elevation here.
Duplication is controlled through non-executable policy data and reviewed
reusable workflows pinned within the protected repository.

## Verification

Static and API audits enumerate event, ref, permissions, secrets, environment,
cache/artifact sources and checkout. Malicious PR fixtures attempt expression,
shell, cache and artifact injection and must receive no privileged capability.
