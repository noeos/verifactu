---
id: CONTRACT-DOC-0006
title: Schemas and codecs
status: draft
authority: normative
owner: api-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0041, SRC-0042]
---

# Schemas and codecs

Canonical contract records generate JSON Schema Draft 2020-12, TypeScript
declarations, codecs and documentation tables. Each schema has an absolute
versioned `$id`, declared vocabulary/dialect and closed unevaluated-property
policy. `format` behavior is explicit; annotations are not mistaken for
assertions.

Decoding has stages: byte/UTF-8/framing limits; JSON syntax and duplicate keys;
structural schema; lexical normalization where permitted; domain construction;
cross-field/edition rules. Diagnostics retain stage and JSON Pointer without
echoing secrets or full fiscal payloads.

Encoding accepts only validated branded domain/contract values, produces one
canonical form and never applies defaults that change fiscal meaning. Decoder
acceptance and encoder output are tested for symmetry; migrations are explicit
functions from one schema version to another with loss reports. Generated files
carry input/tool digests and CI rejects hand edits or stale output.
