---
id: ADR-0027
title: Independent oracles and genuine adversarial testing
status: proposed
authority: decision
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0018, ADR-0021, ADR-0026]
sources: [SRC-0023, SRC-0024, SRC-0034, SRC-0065]
historical-inputs: [REV-056, REV-057, REV-059, REV-062, REV-064]
---

# ADR-0027: Independent oracles and genuine adversarial testing

## Context and options

Tests built expected values with the same faulty production helpers and called
printed counts “mutation” or “fuzzing”. Alternatives are example-only testing,
duplicated production logic, or independent official/reference/adversarial
oracles. Only the last can falsify shared assumptions.

## Decision

Critical fiscal, format, signature, state, atomicity and protocol claims require
at least one oracle independent in implementation or authority. Preferred order
is exact official vector, independently implemented reference, verified
standards tool, metamorphic/property relation, then reviewed literal expected
bytes. Oracle disagreements block the claim and retain both observations.

Property suites record generators, domains, labels, seeds and shrink paths.
Fuzzers execute semantic targets with watchdogs and minimum work. Mutation runs
alter real production code, distinguish killed/survived/no-coverage/error/
timeout/equivalent and identify the exact killing test. Syntax rejection,
grepped words and a non-zero tool exit are not proof of the intended control.

## Consequences, verification and reversal

Provider diversity and oracle maintenance add cost and may expose ambiguous
official behavior; ambiguity is recorded rather than averaged away. Meta-tests
deliberately corrupt vectors, disable assertions, insert critical mutants and
empty target discovery. Reverse only if equivalent falsification power and
proven independence are retained.
