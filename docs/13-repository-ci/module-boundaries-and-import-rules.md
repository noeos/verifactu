---
id: REPO-DOC-0003
title: Module boundaries and import rules
status: approved
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ARCH-DOC-0006]
decisions: [ADR-0015, ADR-0016, ADR-0030]
historical-inputs: [REV-066, REV-072, REV-084]
---

# Module boundaries and import rules

Production dependency direction follows contracts/domain/application/ports and
adapter implementations inward; CLI imports only `@noeos/verifactu` public
exports and adapter-kit only declared public ports/types. Verification Engine is
an external package/profile boundary, never source or path alias.

Core production MUST NOT import ambient filesystem/network/TLS/process/env/
clock/random/child-process APIs, `internal`, tests, build output or private deep
subpaths. No file/workspace/runtime cycle, undocumented dynamic import, optional
runtime edge or duplicated fiscal type is allowed.

Type-only edges are still architectural edges. The checker resolves package
exports, TypeScript configuration and emitted ESM/CJS, catches aliases and
bundled code, and verifies public entrypoints against the contract registry.
Browser shims or tree shaking cannot hide forbidden runtime capabilities.

Every permitted exception is an exact edge with `EXC-*`, compensating control
and expiry. Negative fixture packages exercise cycles, deep imports, path aliases,
test leakage and undeclared dependencies.
