---
id: DOCS-STRUCTURE
title: Documentation structure and planning method
status: approved
authority: normative
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-13
decisions: [ADR-0001, ADR-0002, ADR-0003, ADR-0005, ADR-0006]
---

# Documentation structure and planning method

## Purpose

This document fixes the initial map of everything that must be researched,
decided and specified before implementation. It does not approve the future
contents of any area and does not inherit completion claims from the deleted
codebase.

## Product-completion principle

VeriFactu is not an MVP, prototype or partial compliance layer. Planning MUST
cover the complete product responsibility defined for this repository:

- complete VERI*FACTU and NO VERI*FACTU behavior;
- the full RRSIF domain and supported regulatory editions;
- official formats, validation, fingerprinting, signatures, certificates and QR;
- durable state, atomic host integration, outbox, recovery and reconciliation;
- complete AEAT protocol behavior and external verification;
- a stable library, CLI and adapter conformance surface;
- complete integration with the public API of Noeos Verification Engine;
- security, privacy, performance, observability and operability;
- reproducible packages, supply-chain evidence, release and long-term support.

Phases order dependencies and make work reviewable. They MUST NOT be used to
remove an in-scope capability, ship a knowingly incomplete substitute or defer
a release requirement indefinitely. A superior known design may only be
rejected through an explicit decision that records constraints, evidence,
trade-offs and residual risk.

## Ecosystem boundaries

```text
Facturacion application
        |
        | public VeriFactu contracts
        v
VeriFactu regulatory component
        |
        | public versioned evidence profile
        v
Noeos Verification Engine
```

- Verification Engine owns generic normalization, integrity chains, evidence
  and verification. It does not know invoices, taxpayers or AEAT.
- VeriFactu is the only owner of RRSIF/VERI*FACTU semantics, official formats,
  regulatory states and AEAT communication.
- Facturacion will own commercial invoicing, users, organizations, catalogue,
  payments, documents and customer experience. It will consume VeriFactu as an
  external integration and MUST NOT duplicate its regulatory rules.
- No repository shares internal storage to bypass a public contract.

## Use of historical material

`previous-docs` has status `historical-input` and no normative authority. It is
nevertheless mandatory evidence for avoiding recurrence.

For every new area:

1. identify the previous documents and `REV-*` findings that affect it;
2. extract assumptions, confirmed failures, reproductions and unfinished work;
3. validate them against current primary sources and current dependencies;
4. map each applicable lesson to a requirement, risk, ADR, negative test or
   acceptance criterion;
5. record why an old item is superseded or not applicable when it is not carried
   forward;
6. prohibit a new area from closing while a relevant historical finding has no
   explicit disposition.

Historical remediation notes are not evidence for new code. The new
implementation must produce new evidence from its own commit and toolchain.

## Planning cycle for each area

Each numbered area is developed using the same sequence:

1. **Inventory:** scope, questions, dependencies and historical lessons.
2. **Research:** primary sources, standards, current platform behavior and
   independent professional references.
3. **Options:** feasible designs with benefits, disadvantages, failure modes,
   costs and reversibility.
4. **Decision:** ADR for every significant regulatory, public, security,
   architectural or difficult-to-reverse choice.
5. **Specification:** normative behavior, boundaries, invariants and failures.
6. **Verification design:** positive, negative, boundary, adversarial, recovery
   and performance evidence defined before implementation.
7. **Cross-review:** consistency with all previously approved authorities.
8. **Approval:** no unresolved question may remain if it can materially change
   implementation or release claims.

## Document states

Content lifecycle:

```text
proposed -> researching -> draft -> under-review -> approved
                                              \-> blocked
approved -> superseded | retired
```

Implementation and evidence are tracked separately:

```text
not-implemented -> in-progress -> implemented-unverified -> verified
                                                    \-> blocked
```

An approved specification is not implemented evidence. A green job is not
proof unless the job demonstrably tests its named guarantee.

## Canonical identifier families

The exact catalog will be approved in `00-governance`, using at least these
non-overlapping families:

| Family | Meaning |
| --- | --- |
| `SRC-*` | External or official source. |
| `ADR-*` | Approved decision. |
| `PROD-*` | Product requirement. |
| `REG-*` | Regulatory requirement. |
| `FUN-*` | Functional requirement. |
| `NFR-*` | Non-functional requirement. |
| `SEC-*` / `THR-*` / `CTL-*` | Security requirement, threat and control. |
| `PERF-*` | Performance or resource budget. |
| `TEST-*` | Verification obligation or scenario. |
| `CI-*` | Repository or CI control. |
| `RISK-*` | Tracked risk. |
| `EVD-*` | Evidence definition or result. |

Matrices will be generated from canonical metadata wherever practical. A
manually copied matrix must not become a second authority.

## Directory rules

- Every area has one responsibility and one `README.md` index.
- Normal depth is at most three directories below `docs/`.
- The numbered order aids navigation; it does not override authority.
- Documents use stable kebab-case names. Renames update all references in the
  same change.
- Generated material is explicitly marked and never edited manually.
- Large run artifacts do not live in `docs`; their identity, location, digest,
  producer, retention and result do.
- Diagrams are stored as reviewable text and checked automatically.
- Examples that represent executable contracts must be tested against packaged
  code.
- Secrets, real taxpayer/customer data, private keys and workstation-specific
  paths are forbidden.
- Placeholder documents do not count as completed documentation.

## Planned documentation tree

Each area index contains its planned document set. `13-repository-ci` is the
authority for the complete future source-code tree, file placement rules,
module ownership, allowed dependencies and checks that prevent architectural
drift before product code is created.

## Order of elaboration

```text
00 Governance
 -> 01 Product
 -> 02 Regulatory
 -> 03 Requirements
 -> 04 Domain
 -> 05 Architecture
 -> initial 10 Security and 12 Performance constraints
 -> 06-09 executable contracts and operational semantics
 -> 11 verification strategy
 -> 13-14 repository, CI, build and supply chain
 -> 16 integrations
 -> 15 release and operation
 -> 17 roadmap and risk closure
 -> 18 assurance
 -> 99 final reference indexes
```

Security, privacy, performance and reliability begin before architecture is
approved and are revisited when concrete contracts and workloads exist.

## Implementation execution documents

After documentation elaboration, implementation is governed by three canonical
documents in `17-roadmap-risk`:

- `implementation-roadmap.md` instantiates the complete dependency-driven work,
  verification and release sequence;
- `handoff.md` records exact observed state and immutable evidence between phases;
- `prompts.md` supplies derived Codex execution prompts and has no authority to
  weaken the roadmap or any governing specification.

The roadmap uses eight macro-phases to bound context while internal work packages
and protected PRs keep changes reviewable. A phase boundary cannot remove scope,
substitute an MVP or promote planning/implementation into verified evidence.
