---
id: SEC-DOC-0011
title: Data classification and privacy
status: draft
authority: normative
owner: privacy-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
dependencies: [REG-DOC-0010, REG-DOC-0011, REQ-DOC-0005]
historical-inputs: [REV-069, REV-070, REV-073, REV-075]
---

# Data classification and privacy

## Classes

| Class | Examples | Baseline handling |
|---|---|---|
| P0 secret | private keys, tokens, credentials | never log/export; custody-only |
| P1 highly restricted | full fiscal payloads, responses, evidence, tax IDs | authorized encrypted store/export |
| P2 restricted | pseudonymous correlations, configuration/audit metadata | minimized, bounded retention |
| P3 internal | non-sensitive build/operational metadata | access-controlled |
| P4 public | published docs/schemas/releases | integrity/provenance controls |

## Processing record

Before implementation each data flow records field/category, data subject,
purpose and legal basis determined by the deploying controller, controller/
processor roles, source, recipients/subprocessors, transfer/locality, storage,
access, retention/deletion trigger, rights interaction, breach impact and
security controls. Verifactu documents capabilities and defaults but does not
invent the customer's lawful basis or contractual role.

## Principles

Collect and expose only data required for the fiscal purpose or explicit support
purpose. Purpose change requires review. Fiscal conservation does not justify
duplicating payloads into telemetry, test fixtures or indefinite backups.
Pseudonymization lowers exposure but remains personal data when relinkable.
Encryption does not remove minimization, access or deletion obligations.

## Rights and legal preservation

Access, portability, correction, restriction and deletion requests are routed
through authenticated, audited exports/actions. Immutable legally required
records are not silently altered; conflicts between a request and preservation
duty produce a scoped legal decision and restrict unnecessary processing.
Retention expiry deletes or cryptographically renders inaccessible every owned
copy, subject to documented backup propagation and legal hold.

A DPIA trigger assessment is required for new large-scale, novel, monitoring or
high-risk processing. Breach readiness covers detection, impact evidence,
controller notification inputs and data-subject risk without promising legal
decisions the library cannot make.
