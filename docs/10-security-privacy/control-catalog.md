---
id: SEC-DOC-0005
title: Security control catalog
status: approved
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
dependencies: [SEC-DOC-0003, SEC-DOC-0004]
historical-inputs: [REV-043, REV-044, REV-052, REV-053, REV-064, REV-068]
---

# Security control catalog

| ID | Control | Enforcement and minimum evidence |
|---|---|---|
| CTL-0001 | authenticated principal + explicit authorization policy | deny/default tests and decision audit |
| CTL-0002 | context-scoped types, stores, locks and caches | cross-context property/interleaving tests |
| CTL-0003 | edition-defined digest/signature verification | official/adversarial vectors |
| CTL-0004 | transactional journal and compare-and-append | crash/race/recovery suite |
| CTL-0005 | hardened non-resolving bounded XML parser | malicious parser corpus |
| CTL-0006 | closed XML signature profile | wrapping/transform/algorithm negatives |
| CTL-0007 | scheme/host/port/path allowlist, resolution and redirect policy | SSRF/redirect tests |
| CTL-0008 | TLS identity and minimum protocol policy | handshake/failure matrix |
| CTL-0009 | non-exportable purpose-bound key handles and rotation | custody/permission/rotation tests |
| CTL-0010 | enforced byte/depth/item/time/concurrency/queue limits | boundary and exhaustion tests |
| CTL-0011 | data classification, structured safe logging and redaction | taint corpus + output scan |
| CTL-0012 | contextual idempotency and replay protection | mismatch/retry/race tests |
| CTL-0013 | pinned dependency/action, isolated build, SBOM and provenance | clean-build verification |
| CTL-0014 | authenticated source snapshots and immutable editions | digest/schema/drift checks |
| CTL-0015 | bounded schema/semantic response validation | malformed/truncated corpus |
| CTL-0016 | injectable clock with rollback/quality detection | deterministic clock faults |
| CTL-0017 | append-only protected audit/evidence with retention controls | tamper/export/restore test |
| CTL-0018 | closed diagnostics and fail-closed unknowns | registry + mutation tests |

## Control lifecycle

Every control has owner, implementation component, configuration, applicable
threats/requirements, verification cadence, evidence location and failure mode
in the machine registry. Critical controls run in required CI and release gates.
Compensating controls must cover the same asset/impact and expire. Framework
crosswalks to NIST SSDF, OWASP SAMM/ASVS and applicable privacy/security duties
are informative mappings, never unsupported certification claims.
