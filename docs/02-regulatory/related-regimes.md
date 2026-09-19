---
id: REG-DOC-0011
title: Related regimes and boundaries
status: approved
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
sources: [SRC-0011, SRC-0015, SRC-0016, SRC-0027, SRC-0028]
decisions: [ADR-0002, ADR-0008]
requirements: [REG-0060, REG-0061, REG-0062]
historical-inputs: [REV-001, REV-028, REV-063, REV-072]
---

# Related regimes and boundaries

## Boundary matrix

| Regime/subject | Relationship to this product | Required behavior |
| --- | --- | --- |
| Invoicing Regulation RD 1619/2012 | Governs invoice obligation/content; RRSIF adds record/representation effects. | Host owns commercial invoice; VeriFactu validates required fiscal projection and returns QR/wording contract. |
| SII | Certain obligated taxpayers/operations are excluded from RRSIF under applicable rules. | Applicability decision records exact SII scope; never send RRSIF by assumption. |
| Basque/Navarre foral systems | Separate tax competence and systems such as TicketBAI/Batuz. | Explicit unsupported boundary; no format or claim reuse. |
| Canarias/Ceuta/Melilla | RRSIF can apply with territorial tax specialties. | Model applicable tax/catalogue facts by edition; do not exclude by mainland-only assumption. |
| B2B structured electronic invoicing | Separate present/future exchange and anti-late-payment regime. | Facturacion/another component owns exchange; shared invoice facts cannot merge compliance claims. |
| Accounting/tax ledgers | May consume invoice/fiscal information but are not RRSIF record identity. | No shared mutable database or inferred chain from ledger order. |
| GDPR/LOPDGDD | Applies to personal data in records, diagnostics, evidence and support. | Controller/processor roles, minimization, security and retention reconciliation. |
| Electronic signature/trust services | Supplies cryptographic/trust context for applicable XAdES and certificates. | Provider/validation policy explicit; no claim beyond evidence/profile. |
| Verification Engine | Technical evidence protocol, not a legal regime. | Remains domain-neutral and versioned through public contract. |

## No double-counting

One action may satisfy several obligations only when each requirement maps to
the same evidenced behavior. A SII submission, electronic invoice, accounting
entry or TicketBAI record is never labelled an RRSIF billing record by analogy.

## Host contract

The host supplies complete invoice facts and applicable regime decisions. It
must prevent mutually incompatible workflows, preserve atomicity and present
mode-specific output. VeriFactu returns structured scope and cannot mutate the
commercial invoice to conceal missing host capability.

## Evolution

Related-regime monitoring records legislation and integration impact but does
not automatically expand this repository. Expansion requires product/regulatory
ADR, source corpus, threat/privacy analysis, domain separation and independent
conformance.
