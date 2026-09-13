---
id: REG-DOC-0001
title: Regulatory source hierarchy
status: approved
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
decisions: [ADR-0006, ADR-0008, ADR-0009]
requirements: [REG-0001, REG-0002]
historical-inputs: [REV-004, REV-005, REV-006, REV-062, REV-063]
---

# Regulatory source hierarchy

## Precedence

For one applicable question, use the highest controlling source:

1. directly applicable European Union law;
2. Spanish law in original BOE publications and amendments;
3. royal decrees/regulations;
4. ministerial orders and annexes;
5. AEAT technical specifications expressly enabled by the above;
6. official XSD, WSDL, catalogues and versioned examples within their scope;
7. official FAQ, criteria and guidance;
8. referenced W3C/IETF/ETSI/ISO/OASIS standards;
9. official tool/platform documentation;
10. professional and community material.

Chronology resolves changes at the same authority only after verifying
applicability, transitional law, derogation and effective date. Specific rules
govern their scope without silently displacing a higher general obligation.

## Source roles

`binding` establishes an obligation; `delegated-technical` supplies enabled
technical detail; `interpretive` explains competent-authority position;
`normative-standard` defines an incorporated technical mechanism; `engineering`
guides design; `discovery` supplies hypotheses and failure modes.

An XSD establishes structural validity, not every business rule. A WSDL defines
service contract shape, not availability or all retry semantics. An example
proves one construction, not exhaustive coverage. FAQ content is recorded by
date because it can evolve without a BOE amendment.

## Conflict procedure

1. Freeze affected approval/generation claims.
2. Preserve exact competing bytes, metadata and applicable dates.
3. Identify question, actor, operation, edition and downstream artifacts.
4. Apply authority, competence, scope and temporal rules.
5. Obtain external tax/legal interpretation when material ambiguity persists.
6. Record ADR/interpretation and update requirements, vectors, migration and
   declarations atomically.
7. Issue a new edition; never rewrite an old one.

No conflict is resolved by choosing the easiest implementation, a search-engine
snippet, majority community practice or a single AEAT response with unknown
scope.

## Consolidated texts

Consolidated BOE texts are discovery/reading conveniences explicitly labelled
informative by BOE. Edition manifests retain the original enactment and every
applicable amendment. A digest of a consolidated rendering cannot replace that
legal chain.
