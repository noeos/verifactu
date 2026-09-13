---
id: BUILD-DOC-0005
title: Install scripts, native and optional code
status: draft
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0034]
historical-inputs: [REV-069, REV-070, REV-071]
---

# Install scripts, native and optional code

Lifecycle scripts and optional dependencies are disabled by default. Any required
exception names package/version/script, purpose, source, commands, files/network/
environment touched, platforms, sandbox, expected outputs/digests and replacement.
The exception does not enable scripts repository-wide.

Native addons/prebuilt binaries require source correspondence, official signature/
checksum, architecture/libc/OS matrix, extraction limits, sandbox execution,
licence and reproducible/source-build story. Download-at-install and opaque
fallback compilation block admission.

CI proves the baseline succeeds without optional code or fails with an explicit
capability diagnostic. Sandboxed exception jobs use no secrets/write/OIDC and
record filesystem/network delta. Unexpected executable bit, child process,
network destination or platform artifact fails.
