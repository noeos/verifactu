---
id: P4B-EVIDENCE
title: P4-B effect-free plans and exact byte artifacts evidence
status: active
authority: informative
owner: quality-owner
created: 2026-09-22
last-reviewed: 2026-09-22
dependencies: [P4-QUALITY-PLAN-0001, P4A-EVIDENCE]
---

# P4-B effect-free plans and exact byte artifacts evidence

P4-B adds the pure planning and artifact layer above the P4-A fiscal model.
Operation plans are closed data descriptions: every identifier, clock value,
edition policy, observed chain head, artifact and intended effect is explicit.
The layer performs no filesystem, network, clock, random or environment access.

The current authoritative edition remains a creation-disabled candidate.
`planRecord` checks that policy before constructing a plan, so these generic,
pure capabilities do not activate the candidate or create an official record.

## Decisions

| Decision                                          | Enforced consequence                                                                                                                           |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Plans contain descriptions only                   | Unknown keys, unknown effect kinds, executable values, mismatched record/artifact references and stale head descriptions are rejected.         |
| Preparation returns a binding token               | SHA-256 binds command and idempotency identity, input/configuration digests, context, edition, head and expiry without granting commit rights. |
| Projection order comes from an edition descriptor | Object insertion order, locale and caller ordering cannot select the official sequence.                                                        |
| Presence is a tagged value                        | Absent, empty, exact zero and `xsi:nil` remain distinguishable until an explicit serialization policy maps them.                               |
| Fingerprint preimages have one serializer         | Labels, `=`, `&`, lexical rules, field order and UTF-8 bytes are descriptor-bound; no BOM or platform newline is introduced.                   |
| Digest computation is an explicit pure dependency | Only descriptor-authorized SHA-256 fingerprints are accepted; verification always recomputes and never trusts the supplied value.              |
| Artifact bytes are immutable octets               | Bytes are copied in, exposed only through copy-out, measured, dual-digested, parent-linked and preserved unchanged by lifecycle transitions.   |
| Changed bytes create a different artifact         | State transitions preserve bytes, SHA-256, SHA-512, parents and custody metadata; they cannot silently regenerate a representation.            |

## Official and independent vectors

The checked-in vector set is transcribed from the admitted AEAT publication
`Veri-Factu_especificaciones_huella_hash_registros.pdf` in the authoritative
2026-09-21 source snapshot. It covers:

- Alta genesis: an empty predecessor field is serialized as `Huella=`.
- Alta linked: the prior uppercase fingerprint is included in official order.
- Anulación linked: the cancellation-specific labels and five-field order are
  used.

For each vector, the TypeScript implementation reproduces the exact UTF-8
preimage and uppercase SHA-256 value. The independent Python oracle rebuilds
the preimage from source values with its own field tables and lexical rules,
then hashes it with `hashlib`; it imports no package production code. All nine
independent checks pass.

## Executable evidence

`p4b:assurance` extends the protected P4-A gate and the canonical package build.
`gate:p4b` is the cumulative required quality task.

- Eleven mapped test files exercise the compiled P4-A and P4-B JavaScript.
- Coverage is 100% statements, 98.93% branches, 100% functions and 100% lines,
  above every predeclared threshold.
- `P4-PROP-008` and `P4-PROP-009` each execute 4,096 cases with zero discards:
  8,192 P4-B property executions.
- `P4-MUT-017` through `P4-MUT-022` are all killed. Cumulatively,
  `P4-MUT-001` through `P4-MUT-022` have a 100% critical kill rate with no
  survivors, compile errors, test errors or timeouts.
- The AST-generated whole-production campaign creates 737 mutants across all
  24 compiled P4-A/P4-B production files and all six declared operator classes.
  It kills 705 (95.66%), exceeding the 95% threshold. Its 32 non-critical
  survivors remain listed in the machine-readable report; there are zero
  timeouts, compile errors, test errors or no-coverage mutants.
- The official vector suite and independent oracle agree on all three vectors.
- The first performance measurement creates 1,000 representative effect-free
  plans below the predeclared 5,000 ms smoke ceiling.
- Seeded order swap, separator change, encoding drift and artifact byte-loss
  faults are represented by the critical mutations and are all detected.

Canonical task reports bind these measurements to the tested commit and tree.
Developer reports from a dirty tree are diagnostic only; protected CI produces
the admissible evidence.

## Claim boundary

| Claim                                                        | Evidence                                                         | Not claimed                                                         |
| ------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| Explicit equal inputs produce byte-identical immutable plans | Property campaign, canonical plan bytes and frozen nested values | Commit authorization or atomic persistence                          |
| Official fingerprint examples are reproduced exactly         | Pinned AEAT vectors plus independent Python oracle               | Candidate activation or all future editions                         |
| Supplied fingerprints are not trusted                        | Recompute tests and `P4-MUT-021`                                 | Strength or availability of a caller-provided digest implementation |
| Artifact transitions preserve exact custody data             | Dual-digest, byte-copy and transition tests plus `P4-MUT-022`    | Durable storage, submission or acknowledgement effects              |

P4-C and later slices must extend this cumulative gate and may not weaken the
predeclared thresholds.
