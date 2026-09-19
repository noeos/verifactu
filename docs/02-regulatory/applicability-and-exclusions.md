---
id: REG-DOC-0003
title: Applicability and exclusions
status: approved
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
sources: [SRC-0011, SRC-0015, SRC-0016]
decisions: [ADR-0008]
requirements: [REG-0001, REG-0013, REG-0014, REG-0015]
historical-inputs: [REV-001, REV-002, REV-027, REV-063]
---

# Applicability and exclusions

## Required decision input

Applicability is evaluated for a specific taxpayer, activity, operation and
instant using at least:

- taxpayer type and direct-tax regime;
- exemption status and exact legal basis;
- territory and applicable common/foral competence;
- SII status and scope;
- economic activity and whether a SIF is used for it;
- invoice/operation type and obligation to invoice;
- recipient/third-party/self-billing or representative arrangement;
- exceptional authorization that changes required record data;
- producer/commercializer/user role;
- effective dates and regulatory edition.

Missing data is not equivalent to `false`.

## Decision outcomes

| Outcome | Meaning | Permitted action |
| --- | --- | --- |
| `applicable` | Every predicate is resolved and RRSIF governs the operation. | Generate using named edition and mode tenure. |
| `not-applicable-demonstrated` | A cited exclusion applies to the precise scope. | Preserve basis; do not make an RRSIF compliance claim for that operation. |
| `indeterminate` | Facts, authority or interpretation are insufficient/contradictory. | Block compliance-significant generation and return actionable diagnostic. |

## Mandatory branches

The table must cover corporate-tax taxpayers and statutory exemptions; IRPF
economic activities; non-resident permanent establishments; income-attribution
entities; SII exclusions; common versus Basque/Navarre foral taxation; Canarias,
Ceuta and Melilla specialties; excluded operations in RRSIF article 4; invoices
issued materially by recipient/third party; agricultural/travel and other
special provisions; partial use across activities; and exceptional
authorizations.

## SII and foral boundaries

SII or foral exclusion is not inferred from address alone. The host supplies the
applicable status and evidence under the proper tax/activity scope. TicketBAI,
Batuz and foral SII results are never emitted through an RRSIF compatibility
alias. Mixed groups/activities are evaluated per taxpayer and operation.

## Time behavior

Evaluation uses legal effective time, not workstation current time alone.
Boundary-date tests cover timezone, leap day, retrospective evidence, edition
publication/activation and a transaction spanning midnight. A previously stored
decision is re-used only if its facts and validity interval still cover the
operation.

## Verification

Decision tables become generated executable fixtures. Pairwise coverage is
insufficient for exclusion branches: every legal branch, contradiction and
missing-input class requires an expected outcome and source. External legal
review resolves material cases before they can produce `applicable` or
`not-applicable-demonstrated`.
