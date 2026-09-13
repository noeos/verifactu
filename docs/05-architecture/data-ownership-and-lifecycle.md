---
id: ARCH-DOC-0009
title: Data ownership and lifecycle
status: draft
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0011, ADR-0025, SEC-DOC-0011]
---

# Data ownership and lifecycle

| Data | Canonical owner | Mutability | Disposal/reconstruction |
|---|---|---|---|
| Commercial invoice | host | host-governed before publication | not reconstructed by VeriFactu |
| Fiscal facts/record | VeriFactu record store | immutable after commit | corrected by new fact, never overwrite |
| Edition assets | edition package | immutable | exact version retained/reinstalled by digest |
| Official byte artifacts | artifact store | immutable | regeneration is comparison only |
| Chain head | sequence store | CAS mutable pointer + history | rebuilt only with verified full sequence |
| Attempts/responses | journal/outbox | append/monotonic state | never erased to enable retry |
| Keys | credential provider | provider-governed | never persisted/exported by core |
| Evidence/checkpoints | evidence store/external anchor | immutable | replacement links predecessor |
| Logs/metrics | operator | bounded/redacted | never compliance evidence by default |

Every object records context, edition, provenance, creation source, digest where
applicable, classification, retention rule and authorized readers. Copies are
derived artifacts with their own custody; caches cannot become canonical.
