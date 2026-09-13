---
id: PROD-DOC-0005
title: Compliance modes
status: draft
authority: normative
owner: product-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0010, SRC-0011]
decisions: [ADR-0014]
requirements: [REG-0020, FUN-0020, FUN-0021, FUN-0022]
historical-inputs: [REV-022, REV-023, REV-037]
---

# Compliance modes

## Common obligations

Both modes use applicable billing records, automatic generation timing,
complete validation, hashes/chaining, immutable history, QR rules, taxpayer
isolation, capacity to communicate with AEAT, inspection/export, retention,
diagnostics, editioning and evidence. Mode never bypasses basic correctness.

## Asymmetric capabilities

| Concern | VERI*FACTU | Non-verifiable SIF |
| --- | --- | --- |
| Billing-record transmission | All generated records transmitted continuously, automatically, consecutively and immediately under the official protocol. | Not routinely transmitted; complete response-to-requirement capability remains. |
| Billing-record signature | Not legally required while acting as VERI*FACTU; optional signing, if supported, cannot change official semantics. | Applicable billing records are signed with required XAdES profile. |
| Event records | Not required by the mode unless another applicable obligation says otherwise; implementation must not invent compliance-significant events. | Complete official event lifecycle, chaining, signature, summaries, retention and inspection required. |
| Invoice representation | Mode-specific QR/URL and visible VERI*FACTU wording where applicable. | Non-verifiable QR/URL; no false verifiable wording. |
| Integrity presumption | Depends on effective systematic transmission as provided by regulation. | Depends on local integrity, traceability, signature, events, conservation and inspection controls. |
| External outage | Durable ordered backlog with prompt safe retry/reconciliation; outage cannot silently change mode. | Local generation continues within capacity; requirement/export paths remain available. |

## Mode tenure

Mode belongs to one taxpayer context and installation for a dated interval.
There is no repository, process or organization-wide default. The first
systematic effective VERI*FACTU transmission establishes legally relevant mode
state; the domain records intent, attempts and evidence without falsely claiming
activation before evidence.

The option continues for at least the legally applicable period. Renunciation
uses the official mechanism and final effective date. Clock rollback, restart,
configuration replacement or installation migration cannot shorten tenure.

## Forbidden transitions

- Changing a configuration flag cannot rewrite prior mode.
- Transmission failure cannot fall back to non-verifiable mode.
- Non-verifiable operation cannot omit signatures/events because a future
  VERI*FACTU transition is planned.
- One taxpayer's choice cannot affect another sharing the process/store.
- An indeterminate first transmission cannot be treated as either proven
  activation or proven non-activation without reconciliation.

## Verification

Tests span year boundaries, leap days, timezone/clock errors, first successful
and lost transmissions, renunciation dates, multi-taxpayer mixed modes, restore,
edition upgrade and unauthorized changes. Mode-specific output and obligations
are checked against official vectors and AEAT behavior.
