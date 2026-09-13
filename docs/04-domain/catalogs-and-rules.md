---
id: DOM-DOC-0010
title: Regulatory catalogues and rule execution
status: approved
authority: normative
owner: domain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [REG-DOC-0004, REG-DOC-0005, REG-DOC-0012]
historical-inputs: [REV-018, REV-028, REV-029, REV-030]
---

# Regulatory catalogues and rule execution

## Catalogue package

Each regulatory edition ships an immutable catalogue package containing source
snapshot IDs/digests, effective interval, schema components, official codes and
labels, cardinalities, conditional-rule AST, fingerprint descriptor, endpoint
profile and generated fixture manifest. The package has a content digest and a
reviewed provenance record. Runtime never fetches "latest" catalogues.

## Rule classes and order

1. lexical/presence and type construction;
2. field cardinality and length/precision;
3. catalogue membership and effective date;
4. cross-field choices and conditions;
5. arithmetic and totals reconciliation;
6. identity, chronology and relationship rules;
7. mode/applicability rules;
8. chain/integrity preconditions;
9. schema and semantic conformance of the final artifact.

All applicable findings are accumulated in deterministic order unless continued
evaluation would be unsafe or nonsensical; that stop is itself a diagnostic.
Rules are pure over explicit context. No wall clock, network, locale, process
environment or mutable singleton is read implicitly.

## Updates

A source change produces a new package and edition-impact assessment. Code
generation must be reproducible, schema-valid and reviewable as a semantic diff.
Removal or renaming of a code never changes historical interpretation. Future
effective catalogues can be installed but cannot be selected before their
effective conditions.

## Completeness controls

Bidirectional coverage proves every imported official enum/field/rule maps to a
domain representation and every exported domain code exists in the edition.
Manual exceptions identify source clause, rationale, owner, review date and test.
Unknown code, edition, condition operator or catalogue digest fails closed.
