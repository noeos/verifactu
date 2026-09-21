---
id: ROADMAP-DOC-0023
title: P3-B pre-P4 assurance evidence
status: active
authority: normative
owner: assurance-owner
created: 2026-09-21
last-reviewed: 2026-09-21
dependencies: [ROADMAP-DOC-0022, ROADMAP-DOC-0016, ASSURANCE-DOC-0004]
decisions: [ADR-0005, ADR-0051, ADR-0053]
historical-inputs: [REV-001, REV-084]
---

# P3-B pre-P4 assurance evidence

This is the human read-back of the machine baseline and campaign. It does not
authorize P4 until a signed+DCO protected closure PR and final-main audit bind
all evidence to the exact protected subject.

## Declared baseline before interpretation

`config/quality/p3b-baseline.json` declares every population, denominator,
percentage threshold, critical control and P4 first-commit policy. Missing,
partial or unknown metrics produce `blocked`. The current exact populations are
538 documentation files (535 Markdown), 84 historical findings, 17 required CI
contexts, 27 official/standards source artifacts, eight AEAT XML contract
documents, 562 structural declarations, 447 field constraints, 652
enumerations, 29 SOAP declarations and seven semantic rules.

## Campaign and results

The canonical command is:

```text
node tooling/tasks/run-task.mjs --task gate:p3b
```

It traverses P1–P3 task closure and additionally proves: complete-corpus and
REV disposition; source dual digests and transitive custody; deterministic
offline generation; independent Python recount and six seeded mutants; five
material parser negatives; 1,024 canonicalization properties; 512 hostile XML
mutations; 12 custody faults; 12 privacy probes; three deterministic recovery/
performance repetitions; lock, licence and full-SHA Action admission; dual SBOM
reconciliation; provenance, two-build reproducibility; and the five-cell
Ubuntu/Windows/macOS Node compatibility declaration. Protected CI supplies the
actual supported-cell execution and blocks closure if any required context is
absent.

## Scope boundary and residual state

The candidate remains `creationAllowed=false`. P3-B generates contracts and
assurance infrastructure but implements no invoice, hash, signature, QR,
validation, persistence, transport or release behavior. The exact REV split is
machine checked in `config/quality/p3b-rev-disposition.json`; later-phase rows
remain open rather than being converted into false passes. Coverage, mutation,
property, fuzz, fault/recovery, performance and compatibility denominators for
the first P4 commit are canonical in the baseline and become mandatory as soon
as P4 production code exists.
