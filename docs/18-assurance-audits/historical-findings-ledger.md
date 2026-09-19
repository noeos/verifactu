---
id: ASSURANCE-DOC-0004
title: Historical findings ledger
status: approved
authority: normative
owner: assurance-owner
created: 2026-09-12
last-reviewed: 2026-09-13
decisions: [ADR-0005, ADR-0053]
historical-inputs: [REV-001, REV-084]
---

# Historical findings ledger

Every deleted-codebase finding is `adopted` into current planning. None is
`verified-prevented`: that state requires current packaged regression evidence.

| Finding | Primary current owner/evidence obligation |
|---|---|
| `REV-001` | Domain/regulatory completeness and unknown-field negatives. |
| `REV-002` | Full record applicability/validation catalogue. |
| `REV-003` | Exact fiscal identities and multi-taxpayer separation. |
| `REV-004` | Complete pinned official type/constraint source map. |
| `REV-005` | Semantic rules beyond generated XSD structure. |
| `REV-006` | Source import closure, versions and deterministic regeneration. |
| `REV-007` | Exact deterministic XML serialization/encoding. |
| `REV-008` | Complete offline XSD graph and real validation. |
| `REV-009` | Hardened XML parser/resource limits/XXE negatives. |
| `REV-010` | Real XMLDSig/XAdES cryptographic verification. |
| `REV-011` | Exact AEAT XAdES profile/transforms/policy. |
| `REV-012` | Certificate chain/time/revocation/purpose policy. |
| `REV-013` | Opaque key/provider authorization and failure behavior. |
| `REV-014` | Signature wrapping/reference/downgrade adversarial vectors. |
| `REV-015` | Exact Engine evidence bytes and claim separation. |
| `REV-016` | Engine profile identity/version and malformed evidence. |
| `REV-017` | Installed Engine compatibility and lifecycle ownership. |
| `REV-018` | Correct record/evidence identity and chronology. |
| `REV-019` | Independent framed/canonical evidence oracle. |
| `REV-020` | Chain verification covers every link/artifact. |
| `REV-021` | No global valid result from partial claim success. |
| `REV-022` | Explicit mode tenure/transition/event history. |
| `REV-023` | Edition/mode changes preserve chronology and legality. |
| `REV-024` | Immutable states/results and unknown/indeterminate semantics. |
| `REV-025` | Exact artifact custody and digest relationships. |
| `REV-026` | Public operations expose complete types/results. |
| `REV-027` | Runtime validation and defensive immutable bytes. |
| `REV-028` | Future-host invoice+record+head+outbox joint UoW, proved now by the synthetic host; no real Facturacion integration claim. |
| `REV-029` | No durable side effect before atomic commit. |
| `REV-030` | Unknown commit/crash recovery without duplication. |
| `REV-031` | Publication only after committed fiscal result. |
| `REV-032` | Store schema/version/migration and constraints. |
| `REV-033` | CAS expected-head conflicts and monotonic sequence. |
| `REV-034` | Lease fencing rejects stale workers. |
| `REV-035` | Outbox claim/dedup/order/retry concurrency. |
| `REV-036` | Idempotency identity, scope and retention. |
| `REV-037` | Complete AEAT operations/endpoints/environments. |
| `REV-038` | Strict TLS/mTLS/certificate/endpoint allowlist. |
| `REV-039` | Exact SOAP/WSDL action/namespaces/envelope bytes. |
| `REV-040` | Complete batch/header/record ordering and limits. |
| `REV-041` | Full response/error/correlation interpretation. |
| `REV-042` | Bounded hostile/truncated/oversize protocol inputs. |
| `REV-043` | One-shot transport with no hidden retry. |
| `REV-044` | Indeterminate delivery/reconciliation before resend. |
| `REV-045` | Exact mode-aware QR payload/URL/encoding. |
| `REV-046` | Decodable rendered QR dimensions/error correction. |
| `REV-047` | Complete CLI grammar/options/command behavior. |
| `REV-048` | All public exports/schemas/API reports. |
| `REV-049` | Strict lossless JSON/decimal/Unicode parsing. |
| `REV-050` | Stream/backpressure/cancellation and error algebra. |
| `REV-051` | Atomic filesystem output and containment. |
| `REV-052` | No secret/fiscal data in stdout/stderr/diagnostics. |
| `REV-053` | Correct exit mapping for every result/failure. |
| `REV-054` | Real subprocess E2E and lifecycle completion. |
| `REV-055` | CLI/library equivalence from installed packages. |
| `REV-056` | Honest all-production-module coverage denominator. |
| `REV-057` | Real production mutation and critical thresholds. |
| `REV-058` | Budgets map to enforcing measured workloads. |
| `REV-059` | Semantic fuzzing fails on crash/hang/zero work. |
| `REV-060` | Real resource/process crash, stress and recovery. |
| `REV-061` | Required adapter capabilities; empty never passes. |
| `REV-062` | Independent oracles and installed-process E2E. |
| `REV-063` | Requirement→executed evidence exact-subject closure. |
| `REV-064` | Behavioral security controls, not text grep. |
| `REV-065` | Safe extracted tarball closed allowlist inspection. |
| `REV-066` | Clean consumers with workspace inaccessible. |
| `REV-067` | Isolated reproducible builds for all packages. |
| `REV-068` | Valid reconciled CycloneDX/SPDX SBOMs. |
| `REV-069` | Complete transitive/tool/Action/data licences/notices. |
| `REV-070` | Manifest/lock/install/tarball inventory reconciliation. |
| `REV-071` | Exact executed tool/npm path/version/digest. |
| `REV-072` | Enforced tree/module/export/import/cost boundaries. |
| `REV-073` | SSH signatures plus trailer-aware DCO/coauthors/bots/range. |
| `REV-074` | Public/status claims reconcile with implementation/evidence. |
| `REV-075` | Effective full-SHA Action enforcement and admission. |
| `REV-076` | Paginated complete GitHub audit and producer binding. |
| `REV-077` | Usable zero-approval/no-CODEOWNERS governance. |
| `REV-078` | No routine tag/environment/admin release bypass. |
| `REV-079` | Canonical local/CI/release evidence and closure. |
| `REV-080` | Scorecard results as scoped signal, never proof. |
| `REV-081` | Inaccessible/unknown organization state remains explicit. |
| `REV-082` | Real three-package OIDC release and public verification. |
| `REV-083` | Legal hold/archive/key/backup/restore conformance. |
| `REV-084` | Public edition/assets/types without casts/private paths. |

Each future record adds reproduction, requirements/decision/test/job, exact
evidence, residual risk and reopen trigger. Group status cannot close a row.
