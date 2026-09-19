---
id: PROD-DOC-0002
title: Actors and stakeholders
status: approved
authority: normative
owner: product-owner
created: 2026-09-12
last-reviewed: 2026-09-13
decisions: [ADR-0002, ADR-0004, ADR-0007, ADR-0008]
historical-inputs: [REV-017, REV-028, REV-063, REV-077]
---

# Actors and stakeholders

## Actor catalogue

| ID | Actor | Owns or needs | Must not be assumed to own |
| --- | --- | --- | --- |
| `ACT-0001` | Taxpayer / invoice issuer | Applicability facts, fiscal identity, mode choice, records, lawful operation and retention. | Product implementation or AEAT availability. |
| `ACT-0002` | Producer | Design, release, declaration, maintained-product compliance and evidence. | Truth of host-provided commercial facts. |
| `ACT-0003` | Commercializer | Accurate version/declaration delivery and support information. | Authority to weaken producer guarantees. |
| `ACT-0004` | Future Facturacion, synthetic conformance host or other host | Commercial invoice transaction, users, authorization, durable integration and operator UX. | RRSIF algorithms or private VeriFactu storage; existence of the future Facturacion product. |
| `ACT-0005` | Operator | Authorized configuration, certificates, monitoring, recovery and response. | Silent legal interpretation or record alteration. |
| `ACT-0006` | Representative / social collaborator | Submission authority supported by valid evidence and certificate context. | Taxpayer identity by implication. |
| `ACT-0007` | Certificate/signature provider | Protected key operations and evidence defined by its port. | Fiscal record correctness or chain state. |
| `ACT-0008` | Durable-store adapter | Atomic persistence, isolation, CAS/outbox and recovery semantics. | Domain policy. |
| `ACT-0009` | AEAT | Technical service, validation results and competent-authority functions. | Availability guarantees not officially stated. |
| `ACT-0010` | Invoice recipient | QR use and voluntary information/verification interactions. | Product administration access. |
| `ACT-0011` | Inspector/auditor | Authorized access, export, verification and evidence review. | Unrestricted access to unrelated confidential data. |
| `ACT-0012` | Verification Engine | Generic normalization, framed digests, chains and evidence through its public contract. | Fiscal, AEAT, signature, certificate or storage semantics. |
| `ACT-0013` | Maintainer | Source, decisions, releases, vulnerabilities and support. | Independent human review when none occurred. |
| `ACT-0014` | Security researcher | Coordinated private vulnerability reporting. | Customer data or production secrets. |

## Responsibility rules

- One person may perform several roles; authorization and evidence are still
  evaluated per role.
- The library never authenticates an end user on behalf of the host. It requires
  an explicit authorized command context at privileged boundaries.
- A representative credential proves a technical identity only within its
  certificate/authorization scope; it does not replace taxpayer context.
- AEAT acceptance is an external result, not producer certification.
- Automated agents can prepare analysis but cannot be recorded as independent
  human approval.

## Decision ownership

Regulatory interpretation belongs to the regulatory owner with project-owner
approval and external legal review when material ambiguity persists. Domain and
security owners specify behavior and controls. Release ownership may be
performed by the single maintainer but build, publish and post-publication
verification remain separate evidence steps.

## Escalation

Conflicting actor inputs block the affected operation. The component returns a
structured diagnostic identifying the missing authority or fact without
leaking protected data. It never guesses a taxpayer, installation, edition,
mode, certificate authority or correction intention.
