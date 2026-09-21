---
id: ROADMAP-DOC-0022
title: P3 source, contract and oracle evidence
status: active
authority: normative
owner: project-owner
created: 2026-09-21
last-reviewed: 2026-09-21
dependencies: [ROADMAP-DOC-0004, REG-DOC-0012, REG-DOC-0005, CRYPTO-DOC-0001, QA-DOC-0005]
decisions: [ADR-0006, ADR-0009, ADR-0018, ADR-0027]
historical-inputs: [REV-001, REV-004, REV-005, REV-006, REV-008, REV-019]
---

# P3 source, contract and oracle evidence

This record binds the current P3 implementation to the exact immutable source
snapshot, candidate contract output and independent challenge path. It is an
implementation/evidence record, not a legal opinion, AEAT acceptance or product
release authorization.

## Exact identities

| Subject | Identity |
| --- | --- |
| Observation plan | `config/regulatory/source-plan.json` |
| Source snapshot | `rrsif-2026-09-21-observed` |
| Candidate edition | `rrsif-2026-09-21-observed-candidate` |
| Importer | `RRSIF-SOURCE-IMPORTER-0001` (`tooling/regulatory/import-snapshot.mjs`) |
| Generator | `RRSIF-CONTRACT-GENERATOR-0001` (`tooling/regulatory/generate-contracts.mjs`) |
| Independent oracle | Python 3.13 stdlib `internal/independent-oracles/oracle.py` |
| Runtime policy | network denied; runtime refresh forbidden; `creationAllowed=false` |

## Requirement-to-contract/oracle map

| Requirement | Contract/output | Oracle or negative evidence | Status |
| --- | --- | --- | --- |
| REG-0010/0011 | `manifest.json`, generated contract provenance | Python dual-digest and source-plan checks | implemented-unverified |
| REG-0012 | immutable snapshot and lifecycle manifest | drift task and in-memory changed-input invalidation | implemented-unverified |
| REG-0016/0018 | lifecycle `creationAllowed=false`, blocker list | lifecycle and blocked-payload assertions | blocked pending authority |
| REG-0070 | importer bounds and path validation | bounded source task and traversal/oversize fixtures | verified for implemented path |
| REG-0071 | source dependencies and parser | five hostile XML fixtures | verified for implemented path |
| REG-0072 | generated output/source digests | clean regeneration/no-diff task | verified for implemented path |
| SEC-0070 | no network during parser/generator | task declarations and offline oracle | verified for implemented path |

## Source and licence disposition

Twelve BOE/AEAT entry-point HTML bytes are retained with SHA-256/SHA-512,
authority, URL, media type, observation time, dependency edges and
`AEAT-REUSE-TERMS`/`BOE-REUSE-TERMS`. The six linked technical payloads are
retained as blocked source-plan edges because normal certificate validation
fails; no alternative host, browser cache, stale copy or TLS bypass is used.
Those exact edges must be re-observed and admitted into a successor snapshot
before approval or activation.

## Evidence commands

```text
node tooling/tasks/run-task.mjs --task gate:p3
python3 internal/contract-generation/offline_parser.py
python3 internal/independent-oracles/oracle.py
```

Reports are subject-bound by the task runner. A source, generator, parser,
toolchain or licence change invalidates this record and requires a successor
snapshot, fresh generation and fresh oracle results.
