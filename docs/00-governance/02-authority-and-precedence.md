---
id: GOV-002
title: Authority and precedence
status: draft
authority: normative
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-12
decisions: [ADR-0002, ADR-0006]
historical-inputs: [REV-004, REV-006, REV-063, REV-074]
---

# Authority and precedence

## External authority

For regulatory behavior, apply the first applicable level:

1. applicable European Union law;
2. Spanish laws and original official publications, including amendments;
3. royal decrees and ministerial orders;
4. AEAT specifications expressly enabled by the applicable rules;
5. official WSDL, XSD and catalogues fixed by the regulatory edition;
6. official FAQ, examples and interpretative material;
7. referenced W3C, IETF, ETSI, ISO, OASIS or equivalent standards;
8. official maintainer documentation for adopted tools;
9. professional secondary literature.

A lower level can clarify but cannot silently remove or widen an obligation from
a higher level. Consolidated text aids reading; the original publication and
amendments remain part of the legal record.

## Internal authority

Within an applicable external constraint, internal precedence is:

1. the approved project charter and product scope;
2. approved, source-traced requirements;
3. accepted decision records;
4. versioned public contracts and regulatory editions;
5. normative internal specifications;
6. verification plans, vectors and test contracts;
7. implementation;
8. examples, explanatory text, issues and conversation.

An accepted ADR explains and authorizes a choice but cannot override applicable
law. Code and tests reveal actual behavior but do not turn an accidental
behavior into the desired contract.

## Scoped ownership

| Subject | Canonical owner |
| --- | --- |
| Generic evidence and integrity protocol | Verification Engine public contract. |
| RRSIF and AEAT semantics | VeriFactu regulatory edition and requirements. |
| Commercial invoice and host business transaction | Facturacion or another host contract. |
| Desired GitHub state | Versioned repository policy. |
| Actual GitHub state | Authenticated, timestamped API observation. |
| Test outcome | Report produced for the exact commit and toolchain. |
| Published package | Registry artifact reconciled with release evidence. |

## Contradiction protocol

On a material contradiction:

1. record the conflict and affected identifiers;
2. stop approval, implementation or release claims in the affected scope;
3. preserve all competing sources and their versions;
4. determine applicability, authority, dates and interpretation;
5. open a decision or regulatory review;
6. update requirements, contracts, tests and migrations atomically;
7. rerun every invalidated verification;
8. close only with a recorded resolution and evidence.

Silently choosing the easiest, newest or most permissive interpretation is
forbidden. Unresolved material conflict is `blocked` or `indeterminate`, never
`passed`.
