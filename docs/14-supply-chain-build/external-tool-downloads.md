---
id: BUILD-DOC-0006
title: External tool downloads
status: approved
authority: normative
owner: supply-chain-owner
created: 2026-09-12
last-reviewed: 2026-09-14
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

HTTP GET acquisition retries only transport errors and the admitted transient
status set `408/425/429/500/502/503/504`, at most three attempts with fixed
bounded backoff. Every other response fails immediately; exhaustion fails closed.
Each attempt retains the same immutable URI, media type, timeout and byte cap,
and no retry can relax the final SHA-256 comparison. Rejected response bodies are
cancelled. Evidence records attempt count and the final HTTPS origin/path while
discarding ephemeral redirect query data.

Prepared offline inputs may mirror verified bytes while retaining original and
mirror identities. Rotation/revocation and upstream disappearance have recovery
plans. Wrong platform, signature, digest, archive shape or executable output fails.
