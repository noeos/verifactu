---
id: P4F-EVIDENCE
title: P4-F claim separation and Verification Engine adapter evidence
status: active
authority: informative
owner: quality-owner
created: 2026-09-23
last-reviewed: 2026-09-23
dependencies: [P4-QUALITY-PLAN-0001, P4C-EVIDENCE]
---

# P4-F claim separation and Verification Engine adapter evidence

P4-F keeps official-format, cryptographic, AEAT and Noeos evidence outcomes as
separate statuses (`valid`, `invalid`, `indeterminate`, `unavailable`). The
aggregate rule is explicit: invalid dominates, then indeterminate, then
unavailable; aggregate valid is possible only when every component is valid.
Malformed, accessor-backed and proxy claim containers fail closed.

The Noeos adapter targets the exact admitted public package
`@noeos/verification-engine` 1.0.1 and routes it through
`ports/verification-engine.ts`. It pins the package SRI, public built-in
profile identities, installed vector-set version and per-file SHA-256 values.
The custom profile is `es.noeos.verifactu.record@1.0.0` with a pinned digest of
the checked-in `profile-v1.json` fixture. Its closed projection includes opaque
context, sequence, record and edition identities; operation; the ordered
official-artifact digest list; predecessor-evidence digest; and explicit
SHA-256 identifier. It rejects fiscal plaintext and unknown properties.

Projection validation and normalization are deterministic and bounded. Changed
or reordered artifact digests change the Engine content digest. Engine hash
failures and exceptions are unavailable, while verifier invalid and
indeterminate outcomes remain distinct; aborted verification or thrown
exceptions are unavailable. This profile is additive tamper-evident evidence,
not an official fingerprint, XAdES or certificate claim, and not AEAT status.

## Executable evidence

- `tests/unit/p4-claims.test.mjs` exercises distinct claims, precedence and
  malformed runtime objects.
- `tests/contract/p4-engine-adapter.test.mjs` checks exact package/vector pins,
  profile fixture digest, deterministic and digest-bound evidence, invalid
  inputs, hostile objects, engine failures and aborts, and 4,096 bounded fuzz
  cases.
- `tests/integration/p4-engine-tarball.test.mjs` runs against the clean packed
  public package and its installed engine dependency; both packed tests pass.
- `P4-PROP-012` executes 4,096 status combinations with zero discards.
- `tooling/assurance/p4f-mutation.mjs` kills `P4-MUT-032` through
  `P4-MUT-035`: 4/4 killed, with zero compile errors, test errors, timeouts or
  survivors.
- The cumulative 20-file coverage population reports 99.39% statements/lines,
  96.26% branches and 100% functions for P4-A/B coverage; P4-C coverage is
  99.15%, 96.14% and 100%, respectively.
- The cumulative 31-module whole-production campaign killed 1,101/1,119
  mutants (98.39%) across all six declared operators. Its 18 surviving mutants
  are in the XML provider/worker population; the separate critical XML and
  engine mutation sets remain fully killed. There were zero timeouts, compile
  errors or test errors, and the campaign exceeds the declared 95% threshold.
- The offline clean-consumer tarball installation and all five import/deep
  import/packed-engine assertions pass.

Local reports were generated from a dirty development tree and are diagnostic
only. The draft vertical PR's protected final-head required checks remain the
admissible evidence; it is not mergeable until those checks pass.
