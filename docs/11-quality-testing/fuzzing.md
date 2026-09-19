---
id: QA-DOC-0008
title: Semantic fuzzing
status: approved
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0027, ADR-0028]
historical-inputs: [REV-059, REV-064]
---

# Semantic fuzzing

Targets cover public JSON, CLI, XML/XSD, XMLDSig/XAdES, QR, SOAP, persisted
envelopes, adapters and evidence profiles. Each target declares parser stage,
semantic dictionary/corpus, invariants, maximum input/time/memory/depth, expected
rejection classes and forbidden side effects.

Bounded PR campaigns use deterministic corpus plus recorded seeds and minimum
executions/novel paths. Scheduled/release campaigns expand duration and corpus.
Unexpected exception, assertion, hang, leak, resource breach, nondeterministic
result or zero work fails; catching arbitrary errors and continuing is forbidden.

Crashers are minimized, sensitivity-reviewed and stored with tool/version/seed/
dictionary/target/build identity. If bytes might contain secrets or personal
data, retention stops pending sanitization. Every confirmed product defect gains
a normal regression and corpus entry. Corpus growth is deduplicated by semantic
coverage, not raw file count.
