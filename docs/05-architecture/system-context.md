---
id: ARCH-DOC-0003
title: System context
status: approved
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-13
dependencies: [ADR-0002, PROD-DOC-0007]
---

# System context

| External party/system | Gives VeriFactu | Receives | Boundary rule |
|---|---|---|---|
| Future Facturacion / current synthetic or other host | fiscal facts, context, UoW, providers | records, diagnostics, states, evidence | host owns invoice/users/UI; cannot bypass contracts; no real Facturacion implementation is currently claimed |
| Operator | authorized configuration/action | redacted reports/runbooks | never direct key bytes or mutable endpoints |
| Verification Engine | public evidence API | domain-neutral projection | tax-neutral; exact pinned public package only |
| XML/XAdES provider | validation/signing reports and bytes | bounded digest-bound request | untrusted until independently checked |
| Durable adapter | atomic/CAS/journal operations | immutable objects and transitions | capability-level conformance required |
| AEAT | remote observations/results | exact authenticated SOAP requests | external authority and nondeterministic service |
| Clock/ID source | explicit time/unique values | scoped requests | no ambient system calls in core |
| Auditor | bounded evidence request | manifest and exact artifacts | authorization, minimization and audit trail |

Noeos does not operate a mandatory hosted intermediary. DNS, proxy, OS trust
store, certificate hardware and database are part of a deployment profile and
must be declared; they are not silently inside “the network” or “the host.”
