---
id: REPO-DOC-0018
title: CI caches, artifacts and retention
status: approved
authority: normative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0026, ADR-0032, ADR-0035]
historical-inputs: [REV-067, REV-079]
---

# CI caches, artifacts and retention

Caches are disposable performance hints keyed by trust domain, OS/architecture,
tool/profile and complete immutable input digest. Restored content is validated
before execution; PR-writable cache prefixes cannot feed main/release. Release
construction uses no mutable cache, though authenticated prepared inputs may be
fetched by digest.

Artifacts have a schema: producer workflow/job/run/attempt, subject SHA/tree,
media type, size/digest, sensitivity, consumer, retention and completeness.
Downloads verify provenance/digest and reject symlink/path/type/size abuse before
extraction. Untrusted artifacts are never executable or privilege-bearing.

Logs/artifacts/caches MUST exclude secrets, keys, certificates with private
material, tokens and real fiscal/personal data; scanning precedes upload. CI
retention is suitable only for diagnostics. Evidence underpinning release/legal
claims is copied to Lot 4 controlled immutable storage with locator and digest.

Missing/expired artifacts invalidate dependent closure. Cleanup is auditable and
legal hold overrides ordinary deletion without changing artifact bytes.
