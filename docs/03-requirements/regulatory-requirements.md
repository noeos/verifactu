---
id: REQ-DOC-0002
title: Regulatory requirements
status: draft
authority: normative
owner: requirements-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
decisions: [ADR-0008, ADR-0009, ADR-0014]
historical-inputs: [REV-001, REV-002, REV-003, REV-004, REV-005, REV-006, REV-022, REV-023, REV-037, REV-045, REV-046, REV-063]
---

# Regulatory requirements

The final machine registry adds exact article/paragraph and edition references
to each item. Approval is blocked until that article-level matrix is complete.

## Authority, applicability and editions

| ID | Requirement |
| --- | --- |
| `REG-0001` | Applicability MUST be evaluated for one taxpayer, activity, operation, role and effective instant from complete governed facts. |
| `REG-0002` | Missing or contradictory applicability evidence MUST produce `indeterminate`, never implicit applicability/non-applicability. |
| `REG-0003` | Applicable RRSIF obligations MUST be derived from original enactments/amendments and enabled technical specifications. |
| `REG-0004` | Producer, commercializer and taxpayer/user obligations and dates MUST be modeled separately. |
| `REG-0005` | Every applicable invoice MUST produce its billing record automatically simultaneously with or immediately before issue. |
| `REG-0006` | Correction/annulment MUST preserve original records and add the applicable later record. |
| `REG-0007` | The system MUST guarantee integrity, conservation, accessibility, legibility, traceability and inalterability for the applicable scope. |
| `REG-0010` | Every generated fiscal artifact MUST identify one immutable approved regulatory edition. |
| `REG-0011` | An edition MUST pin every source/generator output that can affect semantics, bytes, validation or exchange. |
| `REG-0012` | A changed source byte or interpretation MUST create a candidate successor and MUST NOT mutate a published edition. |
| `REG-0013` | SII exclusion MUST be determined for its precise taxpayer/operation scope and supported evidence. |
| `REG-0014` | Foral/common-territory applicability MUST NOT be inferred from address alone. |
| `REG-0015` | An exceptional authorization affecting fields MUST be identified, scoped, valid and retained before omission is permitted. |
| `REG-0016` | Generation under sunset/revoked/inapplicable edition MUST fail while historical verification remains available. |
| `REG-0017` | Material interpretation MUST distinguish fact, inference, observation, recommendation and legal review. |
| `REG-0018` | Unresolved ambiguity affecting official behavior or declaration MUST block affected stable release/generation. |
| `REG-0019` | AEAT test acceptance/rejection MUST be bounded to the exact exchange and MUST NOT establish exhaustive legality. |

## Modes and core behavior

| ID | Requirement |
| --- | --- |
| `REG-0020` | Mode MUST be an explicit dated tenure per taxpayer/installation with no permissive default. |
| `REG-0021` | Both modes MUST calculate/store the official hash and maintain the applicable record chain. |
| `REG-0022` | VERI*FACTU operation MUST durably pursue continuous, secure, correct, integral, automatic, consecutive, immediate and reliable transmission of all generated records. |
| `REG-0023` | Non-verifiable operation MUST apply required XAdES signatures to billing and event records. |
| `REG-0024` | Non-verifiable operation MUST implement the complete official event and summary lifecycle. |
| `REG-0025` | Invoice QR/URL and visible wording MUST reflect the actual applicable mode and official specification. |
| `REG-0026` | Mode transition/renunciation MUST obey official minimum tenure, message and effective-date rules without rewriting history. |

## Monitoring, preservation and declaration

| ID | Requirement |
| --- | --- |
| `REG-0030` | Official legal/AEAT sources MUST be monitored automatically daily and reviewed by a human at least monthly and before release. |
| `REG-0031` | Source drift MUST create an immutable observation/candidate and MUST NOT auto-promote behavior. |
| `REG-0032` | Critical/high drift MUST block affected claims until impact, edition and tests are resolved. |
| `REG-0040` | All applicable records/events/evidence MUST be retained for a source-traced schedule whose trigger, suspension and holds are explicit. |
| `REG-0041` | Retained material MUST remain complete, integral, accessible, legible, exportable and restorably verifiable. |
| `REG-0042` | Authorized inspection MUST expose required fiscal/event information while disassociating unrelated confidential data. |
| `REG-0050` | Every produced/commercialized release requiring it MUST have a version-specific responsible declaration with complete official content. |
| `REG-0051` | The declaration MUST bind exact product bytes, edition, capabilities, producer identity, signature and evidence dossier. |
| `REG-0052` | Material post-release contradiction MUST invalidate or replace the affected declaration transparently. |
| `REG-0060` | RRSIF records MUST remain distinct from commercial invoice, SII, foral, B2B exchange and accounting objects. |
| `REG-0061` | Related-regime overlap MUST be mapped requirement by requirement and MUST NOT be assumed equivalent. |
| `REG-0062` | Scope expansion to another regime MUST require its own authority, model, controls and conformance evidence. |
| `REG-0070` | Regulatory acquisition MUST enforce host, redirect, time, byte, file, depth and decompression limits before parsing. |
| `REG-0071` | Schema/WSDL dependencies MUST resolve offline from a digest-pinned closed graph. |
| `REG-0072` | Generated regulatory contracts MUST reproduce from pinned sources in a clean network-denied environment. |
