---
id: DOM-DOC-0001
title: Ubiquitous language
status: approved
authority: normative
owner: domain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [REG-DOC-0002, REG-DOC-0003, PROD-DOC-0003]
historical-inputs: [REV-001, REV-003, REV-015, REV-018]
---

# Ubiquitous language

These terms are used consistently in requirements, code, tests, diagnostics and
evidence. Official terms retain the meaning of their cited regulatory edition;
an internal convenience term can never silently redefine them.

## Fiscal concepts

- **Invoice**: commercial and tax document governed by invoicing rules. It is
  not the same object as a billing record.
- **Billing record**: immutable RRSIF record generated for an invoice fact,
  either registration (`alta`) or cancellation (`anulación`).
- **Registration record**: positive recording of the fiscal fact represented by
  an invoice. Subsequent correction does not mutate it.
- **Cancellation record**: record that identifies and cancels a prior billing
  record under an applicable legal cause; it is not physical deletion.
- **Correction/substitution**: a new, explicit fiscal fact linked to affected
  documents. It preserves the original history.
- **Event record**: immutable evidence of a regulated system event. It is not a
  billing record and has its own catalogue, identity and chronology.
- **Chain**: ordered, context-scoped sequence in which each record commits to its
  predecessor as prescribed by the active regulatory edition.
- **Fingerprint/hash**: result of the edition-defined algorithm over the exact
  ordered input fields. The predecessor fingerprint participates in the next
  record's input; it is distinct from that record's own computed fingerprint.
- **Signature**: cryptographic proof applied only where the mode and edition
  require it. A hash is not a signature and neither proves legal validity alone.
- **VERI*FACTU mode**: dated lifecycle state in which the system operates under
  the applicable immediate-remittance obligations.
- **Non-VERI*FACTU mode**: dated lifecycle state with the additional integrity,
  signing, event and conservation duties defined by the active edition.

## Identity and evidence terms

- **Fiscal document identity**: issuer identity plus invoice series/number and
  issue date, normalized only according to an explicit edition rule.
- **Record identity**: stable identifier for one immutable billing record,
  separate from fiscal document identity and content digest.
- **Attempt identity**: identifier for one transport attempt. Retries never
  become new fiscal records accidentally.
- **Context**: tenant, taxpayer, installation/system identity, mode and edition
  needed to interpret an operation. Missing context is an error.
- **Canonical input**: typed semantic value set before serialization.
- **Wire representation**: exact bytes sent or received, including encoding and
  schema edition. Re-serialization is not presumed byte-equivalent.
- **Evidence bundle**: attributable, integrity-protected collection connecting
  input, decision, artifact, attempt, response, time source and software build.
- **Diagnostic**: stable machine-readable explanation. It must not leak secrets
  or replace the underlying legal source.

## Time terms

`invoiceEventTime`, `recordGenerationTime`, `durableCommitTime`,
`submissionTime`, `responseTime` and `observationTime` are different values.
Each carries timezone/offset, precision, provenance and clock-quality metadata.
The generic names `date`, `timestamp`, `current` and `latest` are forbidden at
domain boundaries unless qualified.

## Forbidden conflations

The model rejects invoice=record, object identity=business identity,
validation=legal compliance, accepted transport=accepted invoice,
schema-valid=semantically valid, absent=false, empty=absent, UTC offset=tax
timezone, retry=regeneration and logging=evidence retention.
