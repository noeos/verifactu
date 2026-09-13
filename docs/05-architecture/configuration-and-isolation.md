---
id: ARCH-DOC-0011
title: Configuration and isolation
status: approved
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0014, SEC-DOC-0010]
historical-inputs: [REV-017, REV-023, REV-038]
---

# Configuration and isolation

Configuration is a closed, versioned, runtime-validated immutable object scoped
to taxpayer, installation, product release, mode tenure and regulatory edition.
Defaults exist only when normatively invariant and harmless; mode, production
environment, endpoint, taxpayer and credential authorization have no implicit
default.

Secret fields contain provider handles, never secret bytes. Environment
variables and files are CLI adapter inputs decoded once; library core never
reads them. Endpoint profiles are edition-owned allowlisted values, not URLs
accepted from ordinary callers.

Caches key every behavior dimension and cannot cross context/edition/provider
boundaries. Operations capture a configuration digest and reject mid-operation
replacement. Tests interleave tenants, installations, modes, editions and
credentials and assert no shared state, diagnostic leakage or head collision.
