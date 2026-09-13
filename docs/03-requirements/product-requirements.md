---
id: REQ-DOC-0001
title: Product requirements
status: draft
authority: normative
owner: requirements-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0001, ADR-0002, ADR-0007, ADR-0008, ADR-0009]
historical-inputs: [REV-001, REV-063, REV-074, REV-084]
---

# Product requirements

All requirements are mandatory for the final product when their applicability
predicate holds. Priority orders risk and implementation, never permanent scope.

| ID | Atomic requirement | Acceptance essence |
| --- | --- | --- |
| `PROD-0001` | VeriFactu MUST expose complete supported RRSIF behavior without requiring a host to duplicate fiscal rules. | Host conformance scenarios use public surfaces only. |
| `PROD-0002` | Deterministic operations MUST return identical results for identical edition, input and provider evidence. | Cross-process/platform vectors compare canonical results/bytes. |
| `PROD-0003` | Every durable fiscal transition MUST be identified, attributable, ordered and recoverable. | Fault injection at every commit boundary preserves invariants. |
| `PROD-0004` | Every public guarantee MUST name exact version, edition, mode, platform and evidence scope. | Claim schema rejects floating/unbounded assertions. |
| `PROD-0010` | The product MUST implement all `CAP-0001`–`CAP-0016` capabilities. | Generated capability map has no missing mandatory dimension. |
| `PROD-0011` | The library, CLI and adapter kit MUST expose semantically equivalent supported operations and diagnostics. | Packed clean-consumer cross-surface vectors agree. |
| `PROD-0012` | Stable release MUST include complete security, privacy, performance, recovery, supply-chain and declaration evidence. | Release dossier gate verifies exact published bytes. |
| `PROD-0020` | The component MUST enforce the approved boundary with the host, providers, AEAT and Verification Engine. | Architecture and adversarial adapter tests reject private/backdoor paths. |
| `PROD-0021` | Unsupported or indeterminate legal/deployment scope MUST fail explicitly before compliance-significant mutation. | Negative cases leave no record/head/outbox mutation. |
| `PROD-0022` | No core operation MUST require an undisclosed network or telemetry service. | Network-denied tests and static boundary check pass. |
| `PROD-0030` | Product status MUST distinguish specified, implemented, verified, AEAT-tested, published and observed states. | Claims cannot transition without corresponding evidence. |
| `PROD-0031` | The product MUST NOT describe producer declaration or test-environment acceptance as AEAT certification. | Docs/package/CLI claim lint and release review reject terms. |
| `PROD-0032` | A known finding or expired exception that contradicts a claim MUST invalidate that claim. | Release calculation fails with injected contradictory state. |
| `PROD-0040` | Product, API, edition, evidence-profile and adapter versions MUST be independently identifiable. | Compatibility matrix uses exact versions and rejects incompatible tuple. |
| `PROD-0041` | Supported historical editions MUST remain verifiable after generation support sunsets. | Archived vectors verify on current supported verifier. |
| `PROD-0042` | Every breaking upgrade MUST provide compatibility, migration, rollback limits and retained-history verification. | Migration suite covers forward, interruption and allowed rollback. |
| `PROD-0043` | End of support MUST provide complete export and verification continuity for legally retained material. | Isolated restoration/export drill succeeds without retired service. |

## Completeness tests

The generator rejects an outcome without capability/use-case links, a capability
without failure/recovery acceptance, a final requirement labelled optional, or
a product requirement satisfied solely by documentation. All results link to
implementation and evidence separately.
