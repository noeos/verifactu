---
id: BUILD-DOC-0009
title: Build reproducibility
status: draft
authority: normative
owner: build-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0061]
decisions: [ADR-0035]
historical-inputs: [REV-067]
---

# Build reproducibility

Two clean builds in different absolute directories and runner instances use the
same authenticated inputs and produce byte-identical tarballs and identical
normalized output trees. File order, timestamps/epoch, ownership/modes, line
endings, locale, source paths, archive metadata and generated ordering are fixed.

Raw and normalized digests are reported; normalization may remove only declared
non-distributed metadata and cannot conceal package byte differences. Platform-
specific subjects are compared within profile and cross-platform semantic trees
where byte identity is not promised.

On mismatch retain both manifests/trees and a classified diff down to first
byte/path/producer. Repacking the same dirty output is not an independent build.
Release later adds a separate hosted verifier. A perturbation suite varies path,
timezone, locale, file order and runner to prove sensitivity is eliminated.
