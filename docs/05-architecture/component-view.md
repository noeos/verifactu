---
id: ARCH-DOC-0005
title: Component view
status: approved
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ARCH-DOC-0004]
---

# Component view

| Component | Owns | May depend on | Must not know |
|---|---|---|---|
| Intake codecs | syntax/presence diagnostics | canonical schemas | stores, XML, AEAT |
| Fiscal domain | values/invariants/mode/sequence | edition policy interfaces | I/O/provider implementations |
| Record planner | deterministic operation plan | domain, explicit clock/ID inputs | current store/network |
| Artifact pipeline | official projection and typed artifacts | selected edition/provider ports | host invoice internals |
| Commit coordinator | UoW/CAS atomic command | persistence ports | database implementation |
| Submission orchestrator | batch/attempt/wait/reconcile decisions | committed state, transport port | raw key material |
| Verification coordinator | separate claim evaluation | official verifiers, Engine port | a global truth boolean |
| Edition registry | immutable installed manifests | digest reader | network refresh |
| CLI | parsing/stream mapping/process exit | public library only | private modules |
| Adapter kit | conformance execution/evidence | public ports | production shortcuts |

Translation occurs once at boundaries. Adapters cannot add fiscal states,
silently normalize values or catch an error into success. Core decisions return
commands/results; only coordinators invoke capabilities.
