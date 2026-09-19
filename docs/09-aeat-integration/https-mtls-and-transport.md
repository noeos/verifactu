---
id: AEAT-DOC-0004
title: HTTPS mTLS and transport
status: approved
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0024]
sources: [SRC-0048, SRC-0050]
historical-inputs: [REV-043, REV-044]
---

# HTTPS mTLS and transport

The port receives immutable endpoint identity, request artifact, TLS credential
handle, deadlines/limits and AbortSignal, and performs at most one network
observation. It returns exact status/headers/response artifact and timing/TLS
metadata or a phase-specific indeterminate failure. It never retries,
rebuilds the body, changes endpoint or classifies AEAT business semantics.

TLS requires hostname verification, trusted chain, allowed protocol/cipher/key
policy and the context-authorized client credential. Verification cannot be
disabled. Redirects are denied; proxy and DNS behavior are explicit deployment
configuration with SSRF/rebinding controls. Connection, TLS handshake, request
write, first-byte, body-idle and total deadlines are distinct.

Response header/count/body and decompressed bytes are bounded; unexpected HTML
is retained/classified safely. Socket/agent/stream ownership and cancellation
races are specified, including whether request bytes may have reached the peer.
The local TLS harness tests wrong CA/name/client cert, expiry, drop at each phase,
slowloris, truncation, oversize, proxy failure and zero leaked resources.
