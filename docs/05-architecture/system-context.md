---
id: ARCH-DOC-0003
title: System context
status: approved
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-25
dependencies: [ADR-0002, PROD-DOC-0007]
decisions: [ADR-0020, ADR-0021, ADR-0055, ADR-0057, ADR-0058]
---

# System context

| External party/system | Gives VeriFactu | Receives | Boundary rule |
|---|---|---|---|
| Future Facturacion / current synthetic or other host | fiscal facts, context, UoW, providers | records, diagnostics, states, evidence | host owns invoice/users/UI; cannot bypass contracts; no real Facturacion implementation is currently claimed |
| Operator | authorized configuration/action | redacted reports/runbooks | never direct key bytes or mutable endpoints |
| Verification Engine | public evidence API | domain-neutral projection | tax-neutral; exact pinned public package only |
| XML/XAdES provider | validation/signing reports and bytes | bounded digest-bound request | untrusted until independently checked |
| Future commercial Facturacion certificate-evidence service | caller-supplied CRL/OCSP bytes and provenance | bounded, explicitly requested certificate/revocation evidence | owns discovery, network retrieval, refresh and cache; VeriFactu performs offline evidence validation only |
| Durable adapter | atomic/CAS/journal operations | immutable objects and transitions | capability-level conformance required |
| AEAT | remote observations/results | exact authenticated SOAP requests | external authority and nondeterministic service |
| Clock/ID source | explicit time/unique values | scoped requests | no ambient system calls in core |
| Auditor | bounded evidence request | manifest and exact artifacts | authorization, minimization and audit trail |

Noeos does not operate a mandatory hosted intermediary. DNS, proxy, OS trust
store, certificate hardware and database are part of a deployment profile and
must be declared; they are not silently inside “the network” or “the host.”
The library has no ambient CRL/OCSP network lookup. A future commercial
Facturacion host may retrieve/cache revocation material and pass the original
bounded evidence to the library; the host's status assertion is not trusted.
