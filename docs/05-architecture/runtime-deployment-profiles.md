---
id: ARCH-DOC-0013
title: Runtime and deployment profiles
status: approved
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0007, ADR-0015]
---

# Runtime and deployment profiles

Supported profiles are:

- embedded library in a host Node process, with host-provided UoW and providers;
- CLI process using explicit configured adapters and streaming stdin/files;
- isolated local XML/XAdES provider process or worker controlled by the host;
- test-only local AEAT protocol peer;
- optional hardware/OS credential provider behind the same key-handle port.

No mandatory Noeos cloud service, shared database or remote signing service is
introduced. Each profile documents supported Node/OS/architecture matrix,
process privileges, filesystem/network access, trust store, proxy/DNS behavior,
credential custody, durable store, shutdown deadline, health/capability checks
and evidence collection.

Unsupported browser/edge/serverless/runtime profiles fail at installation or
capability discovery, not midway through fiscal commit. Containerization is an
adapter deployment choice and never weakens key, persistence or time semantics.
