---
id: QA-DOC-0016
title: Test selection and impact analysis
status: draft
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0026, ADR-0030, ADR-0033]
historical-inputs: [REV-058, REV-063, REV-079]
---

# Test selection and impact analysis

Selection derives from the canonical graph of changed paths, public exports,
requirements, generated inputs, editions, toolchain, dependencies and workflows.
Rules can add work but a label, path filter or commit message cannot suppress a
semantically required gate.

Changes to fiscal/crypto/state/atomicity/protocol/security/public contracts,
test infrastructure, graph/checker or uncertain ownership trigger the complete
relevant suite. Toolchain/lock/build changes trigger every package consumer and
supply-chain gate. Documentation-only selection still runs governance, links,
secrets and task/check closure.

The report records base/head, merge base, changed/impacted nodes, selected and
omitted tasks with proof. Unknown path, shallow/incomplete history, parse error
or empty impact graph fails closed to the full suite. Meta-tests mutate the graph
and filenames to prove critical work cannot be skipped.
