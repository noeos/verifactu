---
id: GOV-011
title: Documentation quality gates
status: approved
authority: normative
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-12
historical-inputs: [REV-063, REV-074]
---

# Documentation quality gates

## Required deterministic checks

The documentation gate runs locally and in CI through the same pinned command
and must validate:

- parseable schema-conformant metadata and allowed lifecycle transitions;
- unique identifiers, valid references and canonical ownership;
- internal links, anchors and case-sensitive paths;
- required area contents and approval dependencies;
- source records, review dates and historical dispositions;
- traceability completeness and absence of orphan mandatory objects;
- generated-output freshness and clean regeneration;
- Mermaid or adopted diagram syntax;
- spelling/style rules limited to deterministic, reviewed dictionaries;
- prohibited secrets, personal/customer data and workstation paths;
- absence of ambiguous placeholders in approved normative material.

Line wrapping, formatting and linting run from repository-pinned configuration.
Network access is forbidden during validation unless a separately named job is
explicitly testing external drift; approval never depends on an unbounded live
link checker.

## Negative gate contract

Each gate has committed fixtures proving that it fails for its named defect,
including duplicate IDs, dead links, invalid status transitions, missing
historical dispositions, stale generated files, unknown references, expired
exceptions and malformed metadata. A gate that has only a passing fixture is
not trusted as enforcement.

The harness verifies expected failure class and diagnostic, not merely a
non-zero exit code. Mutating or deleting the checker cannot make its own
required job pass without an independent bootstrap/change-control path.

## CI semantics

Jobs fail closed on missing event data, empty commit ranges, skipped work,
timeouts, partial reports or unexpected neutral conclusions. Required checks
have unique stable names, originate from approved workflows and run for the
final PR head SHA. Aggregate jobs depend on every constituent result using
explicit success semantics.

## Approval report

An area approval report records exact commit SHA, checker/tool versions,
configuration and generated manifests, completed requirements, unresolved
findings and owner decision. It must be reproducible from the repository; an
unchecked prose assertion cannot replace it.
