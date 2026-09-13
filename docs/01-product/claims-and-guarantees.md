---
id: PROD-DOC-0008
title: Claims and guarantees
status: draft
authority: normative
owner: product-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0001, ADR-0003, ADR-0007, ADR-0009]
requirements: [PROD-0030, PROD-0031, PROD-0032]
historical-inputs: [REV-049, REV-063, REV-074, REV-080, REV-082]
---

# Claims and guarantees

## Allowed claim levels

| Claim | Required evidence |
| --- | --- |
| `specified` | Approved normative requirement/contract for named scope. |
| `implemented` | Production implementation linked to requirement; no verification claim. |
| `verified-locally` | Pinned local toolchain passed defined evidence for exact commit/tree. |
| `verified-in-ci` | Required jobs from expected workflows passed exact candidate SHA. |
| `validated-against-aeat-test` | Named official environment accepted/returned defined cases at recorded times; scope limited to those cases. |
| `published` | Registry/release bytes exist and match signed provenance/digests. |
| `operationally-observed` | Named deployment/version/period produced retained privacy-safe observations. |
| `externally-reviewed` | Named competent independent reviewer, scope, date and report actually exist. |

## Product guarantee envelope

Guarantees always state product version, package digest, regulatory edition,
mode, runtime/platform, adapter/provider versions, test scope and residual risk.
A host is conforming only after its own transaction, authorization, storage,
certificate, operation and recovery boundaries pass conformance.

## Forbidden claims

- “Certified/approved/homologated by AEAT” unless AEAT creates such a process and
  exact evidence exists. The producer's responsible declaration is not an AEAT
  certification.
- “100% secure”, “bug-free”, “always available” or “legally compliant in every
  case”. Unknown defects, operator behavior and applicability remain bounded.
- “Complete validation” based only on XSD, a small rule count or one accepted XML.
- “Reproducible”, “signed”, “SBOM”, “mutation-tested” or “fuzzed” when the named
  artifact/check does not implement the recognized property.
- “Green” as a substitute for listing job conclusion, findings and alerts.

## Truthful core guarantees

Within its evidenced envelope, the component may guarantee deterministic
transformation, rejection of specified invalid inputs, immutable edition
identity, explicit context separation, bounded resources, defined durable
protocols and reproducible verification. It cannot guarantee correct
caller-supplied invoice facts, lawful applicability decisions made without facts,
third-party uptime, certificate authority or operator compliance.

## Claim invalidation

Source drift, unsupported runtime, changed package bytes, failed required check,
open contradictory finding, expired exception, incompatible adapter, revoked
release or declaration mismatch invalidates the affected claim immediately and
must be visible to consumers.
