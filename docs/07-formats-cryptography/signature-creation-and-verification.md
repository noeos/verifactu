---
id: CRYPTO-DOC-0010
title: Signature creation and verification
status: draft
authority: normative
owner: cryptography-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0020, ADR-0025]
historical-inputs: [REV-012, REV-013, REV-015, REV-016]
---

# Signature creation and verification

Creation request contains unsigned artifact ID/digest, edition/profile,
expected signed target, algorithm suite, key/certificate handle, authorization
context, explicit signing instant and deadline. It contains no raw private key.
The provider returns exact signed bytes, certificate material needed for
validation and a diagnostic report; every field is untrusted.

VeriFactu bounds/parses returned bytes, confirms the intended fiscal document
and no unauthorized mutation, selects the expected unique references, verifies
all digests and signature, validates XAdES properties and certificate/
authorization, then creates separate claims. Only the exact successfully
verified signed artifact can be committed.

Verification reports include subject artifact, profile/edition, provider and
independent verifier identity, validation instant/policy, per-reference result,
crypto result, XAdES result, certificate/path/revocation/authorization results
and diagnostics. Timeout/cancel/crash/malformed/swapped/replayed provider output
and post-signature mutation are mandatory negative cases.
