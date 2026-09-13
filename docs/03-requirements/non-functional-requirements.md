---
id: REQ-DOC-0004
title: Non-functional requirements
status: draft
authority: normative
owner: requirements-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0031]
decisions: [ADR-0010, ADR-0012, ADR-0013]
historical-inputs: [REV-056, REV-072, REV-074]
---

# Non-functional requirements

ISO/IEC 25010:2023 is used as a coverage lens. These are product-specific
obligations, not a claim of ISO certification.

| ID | Quality characteristic | Requirement |
| --- | --- | --- |
| `NFR-0001` | Functional suitability | Every applicable legal/product capability MUST be complete, correct and appropriate to its stated task. |
| `NFR-0002` | Traceability | Every release claim MUST trace bidirectionally through source, requirement, design, code, test and exact evidence. |
| `NFR-0003` | Performance efficiency | CPU, time, memory, I/O and concurrency MUST remain within workload-qualified budgets without weakening correctness. |
| `NFR-0004` | Compatibility | Supported product/edition/runtime/engine/adapter tuples MUST interoperate and incompatible tuples MUST fail before mutation. |
| `NFR-0005` | Coexistence | Multiple taxpayers, modes and editions MUST coexist without shared-state interference or unbounded resource monopoly. |
| `NFR-0006` | Interaction capability | API/CLI diagnostics and operator contracts MUST be unambiguous, actionable, stable and accessible to machine consumers. |
| `NFR-0007` | Reliability | Defined faults, cancellation, restart and dependency outage MUST preserve fiscal invariants and recoverability. |
| `NFR-0008` | Availability boundary | The component MUST state owned readiness and dependency state without inventing a hosted-service uptime guarantee. |
| `NFR-0009` | Security | Confidentiality, integrity, authenticity, accountability and availability controls MUST derive from the threat model. |
| `NFR-0010` | Privacy | Personal data MUST be minimized, purpose-bound, protected by default and absent from telemetry/logs unless explicitly safe/necessary. |
| `NFR-0011` | Maintainability | Modules MUST have cohesive responsibility, directed dependencies, public/internal boundaries and enforceable complexity/change ownership. |
| `NFR-0012` | Modifiability | Regulatory editions and adapters MUST change without rewriting preserved historical semantics or unrelated core behavior. |
| `NFR-0013` | Testability | Every normative branch/control/budget MUST expose a deterministic oracle and at least one negative proof. |
| `NFR-0014` | Modularity | Cycles, deep imports, shared mutable globals and fiscal leakage into Verification Engine MUST be mechanically prevented. |
| `NFR-0015` | Flexibility | New approved editions/providers/stores MAY be added only through explicit versioned extension points and conformance. |
| `NFR-0016` | Adaptability | Platform differences MUST be isolated and validated without changing fiscal results. |
| `NFR-0017` | Safety | When correctness/authority is insufficient, the system MUST stop before producing false compliant state and preserve recovery evidence. |
| `NFR-0018` | Auditability | Decisions, configurations, transitions and evidence MUST be attributable and tamper-evident within defined trust assumptions. |
| `NFR-0019` | Reproducibility | Sources, generated contracts, builds, packages, vectors and reports MUST reproduce from exact pinned inputs. |
| `NFR-0020` | Portability | Exact supported runtime/OS/architecture/filesystem matrices MUST be published and tested using packed artifacts. |

## Quality conflict rule

Legal correctness, integrity, privacy and recoverability cannot be traded for
speed or convenience. Where qualities conflict, an ADR records constraints,
measurements, alternatives and residual risk; no implicit compromise is allowed.
