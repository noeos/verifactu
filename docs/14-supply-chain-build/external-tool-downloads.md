---
id: BUILD-DOC-0006
title: External tool downloads
status: draft
authority: normative
owner: supply-chain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0029, ADR-0034]
historical-inputs: [REV-069, REV-071]
---

# External tool downloads

Tools such as scanners, schema validators, Java/Python references and provider
binaries are declared per platform with upstream project/release asset, immutable
version, SHA-256/SHA-512 and signature/key/transparency evidence where supplied,
licence, dependency/runtime and expected executable identity.

Acquisition downloads to isolated temp, limits size/time/redirects, verifies
before extraction, rejects absolute/parent/symlink/device entries and installs
content-addressed read-only. Execution resolves only that path and records digest/
version. `curl | shell`, floating “latest” and silent PATH fallback are forbidden.

Prepared offline inputs may mirror verified bytes while retaining original and
mirror identities. Rotation/revocation and upstream disappearance have recovery
plans. Wrong platform, signature, digest, archive shape or executable output fails.
