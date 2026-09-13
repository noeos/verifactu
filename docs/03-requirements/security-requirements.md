---
id: REQ-DOC-0005
title: Security and privacy requirements
status: draft
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0027, SRC-0028, SRC-0032, SRC-0033, SRC-0034, SRC-0035]
decisions: [ADR-0012]
historical-inputs: [REV-009, REV-080]
---

# Security and privacy requirements

## Trust, integrity and isolation

| ID | Requirement |
| --- | --- |
| `SEC-0001` | Every trust boundary MUST have authenticated/validated inputs, explicit authority, limits, failure semantics and adversarial tests. |
| `SEC-0002` | A security control MUST link to a concrete threat and executable proof; keyword/file-presence checks MUST NOT be sole evidence. |
| `SEC-0003` | Caller-supplied derived metadata, validity flags, hashes, bytes or provider claims MUST be independently recomputed/verified before trust. |
| `SEC-0004` | Taxpayer, installation, edition, mode, sequence and request contexts MUST be isolated in types, storage keys, transactions, caches, queues and logs. |
| `SEC-0005` | Privileged operations MUST require explicit authorized command context and MUST be attributable without exposing secrets. |
| `SEC-0006` | Default configuration MUST be closed, network-minimal, telemetry-off and unsuitable for production until required capabilities validate. |
| `SEC-0007` | Security-sensitive comparisons and identifiers MUST use exact canonical bytes and constant-time comparison where secret-dependent timing is relevant. |

## XML, cryptography, network and secrets

| ID | Requirement |
| --- | --- |
| `SEC-0010` | XML processing MUST prohibit DTD, external entities, XInclude, network schema resolution and unbounded expansion. |
| `SEC-0011` | Signature verification MUST defend against wrapping/substitution by binding unique expected element identity, transforms, algorithms and complete certificate evidence. |
| `SEC-0012` | Only edition-allowlisted cryptographic algorithms/profiles MUST be generated; unknown/deprecated algorithms fail closed and remain explicitly reportable for historical verification policy. |
| `SEC-0013` | Private keys MUST remain behind a least-privilege provider boundary and MUST NOT enter configuration, logs, fixtures, dumps or package artifacts. |
| `SEC-0014` | Certificate use MUST validate identity/authorization, purpose, validity interval and required chain/revocation evidence for the operation time. |
| `SEC-0015` | AEAT network access MUST use immutable environment/service allowlists, TLS/mTLS verification, no redirects and bounded request/response behavior. |
| `SEC-0016` | Unexpected HTML/media, malformed SOAP/XML, duplicate nodes and namespace confusion MUST fail before state interpretation. |

## State, replay and availability

| ID | Requirement |
| --- | --- |
| `SEC-0020` | Unauthorized or ambiguous mode changes MUST fail without altering tenure, records, events or queues. |
| `SEC-0021` | Replay/idempotency controls MUST bind complete request identity and distinguish exact retry from conflicting reuse. |
| `SEC-0022` | Leases MUST use fencing/ownership so an expired worker cannot commit after reassignment. |
| `SEC-0023` | Corruption, rollback, truncation, reordering and cross-context restoration MUST be detected before operation resumes. |
| `SEC-0024` | Every externally controlled byte/count/depth/time/concurrency path MUST have enforced pre-allocation limits and safe overload response. |
| `SEC-0025` | Security/availability errors MUST not trigger automatic downgrade, disabled validation, alternate endpoint or destructive retry. |

## Privacy and supply chain

| ID | Requirement |
| --- | --- |
| `PRIV-0001` | Processing MUST minimize personal/fiscal data to the stated purpose and expose no telemetry by default. |
| `PRIV-0002` | Logs/diagnostics MUST use allowlisted fields, redaction and pseudonymous correlation; raw taxpayer/invoice/XML/certificate/secret data are forbidden by default. |
| `PRIV-0003` | Data exports/support evidence MUST be taxpayer- and purpose-scoped, authorized, encrypted as required and auditable. |
| `PRIV-0004` | The host/controller contract MUST expose retention, access, restriction, export and incident capabilities without promising unlawful deletion of fiscal evidence. |
| `PRIV-0010` | Retention MUST reconcile applicable legal preservation with minimization, access restriction, copy inventory and verified expiry handling. |
| `SEC-0030` | Runtime and development dependencies/actions MUST be exact, provenance-reviewed, vulnerability/licence checked and minimized. |
| `SEC-0031` | Build/release artifacts MUST be reproducible, inventoried, signed/attested and verified after publication. |
| `SEC-0032` | Untrusted pull-request code MUST NOT access secrets, write tokens, caches/artifacts later trusted, or privileged environments. |
| `SEC-0070` | Regulatory imports MUST treat all downloaded/archive/schema content as hostile until bounded and digest-verified. |

## Verification minimum

Each requirement maps to threat, control, unit/property/adversarial/fault test,
negative fixture and release evidence. Applicable ASVS identifiers include their
`v5.0.0` prefix; unmapped or inapplicable items carry rationale.
