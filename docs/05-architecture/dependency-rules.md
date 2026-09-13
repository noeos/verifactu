---
id: ARCH-DOC-0006
title: Dependency rules
status: draft
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0015, ADR-0016]
---

# Dependency rules

Allowed direction is `contracts -> domain -> application -> ports` only where
the target abstraction is lower-level and stable; adapters depend inward on
ports and never the reverse. CLI depends solely on the installed public library.
Adapter-kit imports public types/ports and test fixtures, never private source.

Forbidden in production core:

- `node:fs`, `node:net`, `node:http*`, `node:tls`, process environment, global
  clock/randomness, child processes and mutable global registries;
- imports from `internal/`, tests, generated build output or Verification
  Engine source paths;
- cycles at file, module, workspace or runtime-provider level;
- undocumented dynamic import, optional dependency or deep package import;
- duplicate domain types at CLI/provider boundaries.

Architecture CI resolves TypeScript paths as the compiler does, inspects
package export maps and runtime bundles, and runs negative fixture packages.
Allowlist exceptions name exact edge, justification, expiry and owner.
