---
id: BUILD-DOC-0013
title: CycloneDX 1.7 SBOM
status: draft
authority: normative
owner: supply-chain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0060]
decisions: [ADR-0036]
historical-inputs: [REV-068, REV-070]
---

# CycloneDX 1.7 SBOM

Emit canonical CycloneDX 1.7 JSON per distributed subject. Metadata identifies
component/package digest, commit/build, tool and timestamp policy. Components
include bom-ref, type, name/version/purl where valid, hashes, licence evidence,
scope and approved properties; dependency edges close over every referenced ref.

External services/providers are represented only when part of the subject's
runtime architecture and never confused with packaged libraries. Development,
optional/platform, tool and provider scopes remain distinguishable through the
canonical graph and documented properties.

Validate exact official schema plus semantic rules for unique refs, closed edges,
subject/digest and required fields. Regeneration is deterministic except declared
timestamp/serial handling, whose normalized form is reproducible. Tampered,
orphan, omitted transitive and wrong-subject fixtures fail.
