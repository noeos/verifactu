---
id: GOV-006
title: Historical lessons policy
status: draft
authority: normative
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-12
decisions: [ADR-0005]
historical-inputs: [REV-001, REV-084]
---

# Historical lessons policy

## Status of the archive

`docs/previous-docs` is immutable `historical-input`. It has no authority over
new requirements, contracts or implementation, but it is mandatory input to
planning. Corrections and annotations live outside the archive. A deterministic
manifest will preserve every path, size and SHA-256/SHA-512 digest.

## Mandatory area review

Before an area can be approved it must:

1. inventory related historical documents and findings;
2. extract confirmed reproductions, failed assumptions and unfinished work;
3. reassess each item against current sources, architecture and dependencies;
4. map every applicable lesson to a current requirement, threat, control, ADR,
   negative test or acceptance criterion;
5. provide an explicit disposition for every related `REV-*`;
6. verify that no old completion claim was inherited as evidence.

## Historical disposition states

| State | Required meaning |
| --- | --- |
| `adopted` | Carried into a named current requirement/control/test. |
| `superseded` | Replaced by a named design that prevents the same failure class. |
| `not-applicable-demonstrated` | New scope or architecture removes the premise and evidence demonstrates it. |
| `blocked` | A material decision or proof is still missing. |
| `verified-prevented` | New packaged implementation detects or prevents the reproduced defect. |

`fixed` is forbidden for old findings because the reviewed implementation was
deleted. A historical remediation note may inform design but is not current
execution evidence.

## Finding identity

The original `REV-001` through `REV-084` identifiers remain immutable. New
defects use `FND-*`; they do not overwrite or reuse an old ID. A new finding may
link to an earlier failure class.

## Closure rule

No area or release closes with a relevant historical finding undisposed. A
`not-applicable-demonstrated` disposition requires stronger evidence than the
absence of the old file or function.

## Initial governance dispositions

These old governance failures are already adopted into the new design. They do
not reach `verified-prevented` until executable negative gates and effective
GitHub-state evidence exist.

| Finding | State | Current controls |
| --- | --- | --- |
| `REV-063` | `adopted` | `GOV-003`, `GOV-008`, `GOV-011`, `GOV-012` |
| `REV-073` | `adopted` | `GOV-004`, `GOV-011`, `ADR-0004` |
| `REV-074` | `adopted` | `GOV-001`, `GOV-003`, `GOV-008`, `GOV-012` |
| `REV-075` | `adopted` | `GOV-004`, `GOV-009`, `GOV-011`; implementation in `13-repository-ci` |
| `REV-076` | `adopted` | `GOV-004`, `GOV-009`, `GOV-011`; implementation in `13-repository-ci` |
| `REV-077` | `adopted` | `GOV-004`, `ADR-0004` |
| `REV-078` | `adopted` | `GOV-004`, `GOV-010`; implementation in `13-repository-ci` and `15-release-operations` |
| `REV-079` | `adopted` | `GOV-004`, `GOV-008`, `GOV-011`, `GOV-012` |
| `REV-080` | `adopted` | `GOV-004`, `GOV-005`, `GOV-011` |
| `REV-081` | `adopted` | `GOV-002`, `GOV-004`, `GOV-012` |

## Initial routing of remaining findings

Routing is not closure. It assigns every remaining finding to the first area
that must produce a full disposition record; cross-cutting areas remain linked.
Ranges below are inclusive and the future checker must expand them to prove
coverage of every individual ID.

| Findings | Primary planning owner | Main concern |
| --- | --- | --- |
| `REV-001`–`REV-006` | `02-regulatory`, `03-requirements`, `04-domain` | Complete fiscal model, rules, editions and official sources. |
| `REV-007`–`REV-014` | `07-formats-cryptography` | XML/XSD, canonicalization, XAdES and certificates. |
| `REV-015`–`REV-021` | `07-formats-cryptography`, `16-integrations-conformance` | Trusted bytes, identity, chronology, chain verification and Verification Engine. |
| `REV-022`–`REV-027` | `04-domain`, `06-contracts`, `08-persistence-consistency` | Modes, events, reconciliation, export and runtime API contracts. |
| `REV-028`–`REV-036` | `05-architecture`, `08-persistence-consistency`, `16-integrations-conformance` | Atomic host boundary, durable state, outbox, leases and idempotency. |
| `REV-037`–`REV-044` | `02-regulatory`, `07-formats-cryptography`, `09-aeat-integration` | Complete AEAT SOAP protocol, responses, retries, limits and TLS. |
| `REV-045`–`REV-046` | `02-regulatory`, `03-requirements`, `07-formats-cryptography` | QR mode, payload and rendering correctness. |
| `REV-047`–`REV-055` | `06-contracts`, `11-quality-testing` | Executable CLI grammar, streaming, JSON, filesystem and exit semantics. |
| `REV-056`–`REV-062` | `11-quality-testing`, `12-performance-reliability` | Honest coverage, mutation, budgets, fuzz, stress and independent oracles. |
| `REV-064` | `10-security-privacy`, `11-quality-testing` | Boundary-proving security controls rather than word matching. |
| `REV-065`–`REV-071` | `13-repository-ci`, `14-supply-chain-build` | Package inspection, clean consumers, reproducibility, SBOM, licences and toolchain. |
| `REV-072` | `05-architecture`, `13-repository-ci` | Enforceable module organization, exports and cost boundaries. |
| `REV-082` | `14-supply-chain-build`, `15-release-operations` | Real, blocked-until-ready release workflows. |
| `REV-083` | `08-persistence-consistency`, `15-release-operations` | Executable retention, legal preservation and restoration contract. |
| `REV-084` | `04-domain`, `06-contracts` | Obtainable public regulatory-edition type. |
