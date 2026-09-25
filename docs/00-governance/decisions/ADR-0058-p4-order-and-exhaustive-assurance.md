---
id: ADR-0058
title: Strict P4 wave order and exhaustive assurance
status: accepted
authority: decision
owner: quality-owner
created: 2026-09-24
last-reviewed: 2026-09-24
dependencies: [ADR-0021, ADR-0026, ADR-0027, ADR-0028, ADR-0033, ADR-0051, ADR-0052]
historical-inputs: [REV-010, REV-011, REV-012, REV-015, REV-021, REV-045, REV-046, REV-056, REV-057, REV-062, REV-063, REV-074, REV-079, REV-084]
---

# ADR-0058: Strict P4 wave order and exhaustive assurance

## Question and context

P4 was previously merged out of its documented dependency order, and later
quality reports did not always cover the complete current production
population. Re-starting requires enforceable sequencing and a baseline that
cannot be changed retrospectively to turn a failure green.

## Decision criteria

Dependency correctness, complete public behavior, source-to-test traceability,
full production denominators, reproducibility, independent challenge and
protected exact-subject evidence take precedence over parallelism or calendar
speed.

## Decision

P4 waves integrate serially and only in this order: **P4-A → P4-B → P4-C →
P4-D → P4-E → P4-F → P4-G**. The next wave cannot start implementation or merge
until the immediately preceding wave has a protected closure and its final-head
evidence is read back. No parallel child-wave PRs and no merge of a later wave
against a stale base. P4-G is a cumulative closure campaign, not the first
measurement of earlier waves.

Before P4-A implementation, a protected P4-readiness change must freeze the
machine-readable production/test population, critical branch and mutation
catalogues, seeded faults, property/fuzz campaigns, supported matrix, provider
toolchain/licence admission, performance/resource budgets, canonical tasks and
report schemas. Every handwritten production module—including private
providers and authored bridge code—is in the denominator. Only generated
declarations/type-only surfaces and fixtures may be excluded, each by exact
path and approved rationale. Any new or renamed production path requires a
separate baseline amendment before that implementation is written.

The minimum thresholds are per public package: ≥98% statements/lines, ≥98%
functions and ≥95% branches; 100% of registered critical branches/conditions;
100% killed critical non-equivalent mutants; ≥95% killed for all other
non-equivalent production mutants; zero unreviewed survivors in security or
regulatory code. Zero-work, discovery gaps, `NoCoverage`, compile/test errors,
timeouts, skips, hidden retries and stale subjects block. An exclusion, waiver
or threshold change cannot make a current run pass retroactively.

Each wave includes unit, contract, property with shrinking, seeded mutations,
independent official and non-official vectors, fuzzing, parser/signature/wrapping
and resource attacks, clean installed-package consumers, toolchain/OS matrix
and all applicable performance evidence. P4-G reruns the complete cumulative
population after any change that invalidates it and retains first failures and
all raw exact-subject evidence.

## Consequences and residual risks

This ordering is slower than parallel branch work but prevents dependency
inversion and ambiguous rollback. Assurance infrastructure and full declared
campaigns have material maintenance cost; an unavailable tool or incomplete
population blocks the phase rather than authorizing reduced scope.

## Verification

The P4-readiness gate rejects out-of-order phase identity, stale parent/base,
missing path/test/catalogue entries, empty denominators, introduced undeclared
modules, altered thresholds, seeded-control faults and reports not bound to the
exact commit, tree, lock, toolchain and protected GitHub run. Phase closure
records prove the sequence and every threshold on each final protected SHA.

## Migration and reversal

An external source or architecture change reopens only mapped phases initially,
then re-evaluates downstream invalidation. Changing wave order or any quality
threshold requires a successor ADR and new approval before implementation; no
in-progress result is silently rebaselined.
