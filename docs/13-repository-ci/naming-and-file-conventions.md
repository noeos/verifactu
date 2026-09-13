---
id: REPO-DOC-0004
title: Naming and file conventions
status: draft
authority: normative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0030]
---

# Naming and file conventions

Directories/files use lowercase kebab-case except standards-mandated names and
TypeScript source uses one named concern per file. Tests end `.test.ts`; contract,
integration and E2E scenarios carry their stable test ID in metadata rather than
encoding every dimension into filenames. Generated files include `.generated`
where the public filename is not externally fixed.

Types/classes are PascalCase, values/functions camelCase, constants SCREAMING_
SNAKE_CASE only for true immutable constants. Public names use fiscal vocabulary
from the glossary and do not abbreviate identities, editions or record kinds.
Boolean names state positive predicates; units appear in names/types.

Workflow filenames and top-level names are stable kebab-case contracts; job IDs
are stable machine identifiers and display names match the required-context
registry exactly. Scripts are verbs and only invoke canonical task IDs.

Case-collision, Unicode-confusable, reserved Windows name, trailing dot/space,
ambiguous index barrel and duplicate-normalized path checks run cross-platform.
Renames update references atomically and retain public compatibility where owed.
