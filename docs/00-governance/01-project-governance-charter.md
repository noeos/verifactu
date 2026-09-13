---
id: GOV-001
title: Project governance charter
status: draft
authority: normative
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-13
decisions: [ADR-0001, ADR-0002, ADR-0003]
historical-inputs: [REV-063, REV-074]
---

# Project governance charter

## Mission

VeriFactu will be a complete, independently consumable implementation of the
RRSIF/VERI*FACTU responsibility assigned to this repository. It covers both
VERI*FACTU and NO VERI*FACTU, integrates with Noeos Verification Engine through
versioned public contracts, and is suitable for integration by Facturacion or
another conforming host.

## Completion, not an MVP

Phases order dependencies and bound reviewable work. They do not authorize a
reduced product, a knowingly incomplete substitute or a stable release with an
in-scope capability deferred. Required functionality may be blocked while its
prerequisites are unresolved, but it may not be relabelled optional to obtain a
green status.

Product scope includes functional behavior and also:

- security, privacy and abuse resistance;
- administration through explicit host contracts;
- deterministic errors and diagnostics;
- auditability, observability and evidence;
- bounded resources, performance and backpressure;
- durability, failure recovery and reconciliation;
- packaging, reproducibility and supply-chain assurance;
- compatibility, migration, support and regulatory evolution.

No `TODO`, scaffold, interface-only capability, mock, memory adapter, nominal
script or document title constitutes completion.

## Meaning of a complete product

A release is complete only for an explicitly named package version, regulatory
edition, platform matrix and integration scope, and only when:

1. every committed requirement has an allowed, evidenced disposition;
2. every normative branch and supported failure state is implemented;
3. positive, negative, boundary, adversarial, concurrency and recovery tests
   pass against the final packaged artifacts;
4. official bytes and protocols are checked with suitable independent oracles;
5. Verification Engine compatibility and host conformance are executed;
6. security, privacy, performance and operational exit criteria pass;
7. release artifacts are reproducible, inventoried, attested and independently
   verified after publication;
8. no known finding or residual risk contradicts the release claim.

Perfection is an engineering objective, not an unverifiable absolute. Public
claims must say what scope and evidence were verified and must never claim the
absence of every possible unknown defect.

## Product boundaries

- Verification Engine owns domain-independent normalization, integrity chains,
  evidence and verification. It contains no fiscal or AEAT semantics.
- VeriFactu exclusively owns RRSIF models, rules, formats, modes, state and AEAT
  communication.
- Facturacion is a future product. When built, it will own commercial invoicing,
  organizations, users, catalogue, payments, documents and customer experience
  and consume VeriFactu without duplicating regulatory logic. Its real integration
  is not a VeriFactu `1.0.0` release gate.
- Integrations use public contracts and do not share internal databases or
  privileged backdoors.

## Non-negotiable principles

- Fail closed when authority or evidence is insufficient.
- Preserve exact historical evidence; correct behavior through a new version.
- Prefer the strongest demonstrably suitable design. A weaker choice requires
  an ADR with the real constraint, consequences and exit strategy.
- Distinguish specification, implementation, local verification, external
  validation, publication and operational observation.
- Never make a check easier merely to make it green.
- Never represent an automated or AI review as independent human approval.
