---
id: DOM-DOC-0011
title: Domain diagnostics
status: draft
authority: normative
owner: domain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [REQ-DOC-0009, DOM-DOC-0010, SEC-DOC-0012]
historical-inputs: [REV-029, REV-030, REV-033, REV-075]
---

# Domain diagnostics

## Diagnostic contract

Every expected failure returns a closed `DIAG-*` catalogue entry with code,
severity, category, safe title, semantic path, requirement/rule/source IDs,
edition, mode applicability, safe parameters, remediation class and retryability.
Human text is presentation; automation branches only on code and typed fields.

Categories are input, applicability, catalogue, arithmetic, chronology, state,
integrity, persistence, transport, authority-response, security, privacy,
capacity, configuration, unsupported and internal-corruption. Severities are
info, warning, error and fatal with centrally defined meaning.

## Stability and ordering

Codes are never recycled. Semantic meaning changes require a new code; wording
may change without changing behavior. Results sort by stage, semantic path,
rule priority and code. Duplicate findings from the same rule/path collapse;
causally distinct findings remain.

## Safety

Safe parameters use allowlisted scalar types and bounded lengths. Raw XML,
invoice descriptions, names, tax identifiers, certificates, tokens, signatures,
responses and stack traces are prohibited. Sensitive values are represented by
redacted type, keyed correlation token or artifact digest according to policy.
Unexpected exceptions cross the boundary as one safe correlation diagnostic and
retain protected internal evidence.

## Catalogue governance

The generated registry detects unknown, duplicate and unused codes and verifies
links to requirements/tests. Each entry has an owner and compatibility status.
Public APIs declare which diagnostic version they emit. Snapshot tests cover
machine shape and redaction, never brittle full prose.
