---
id: ADR-0012
title: Threat-driven security and privacy baseline
status: proposed
authority: decision
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
supersedes: []
requirements: [SEC-0001, SEC-0002, PRIV-0001]
risks: [RISK-0006]
---

# ADR-0012: Threat-driven security and privacy baseline

## Context

Word-search controls and green scanners did not demonstrate boundaries. Generic
frameworks also omit product-specific fiscal integrity and recovery threats.

## Decision

Maintain versioned data/control-flow threat models. Use STRIDE and privacy-harm
prompts for discovery; map applicable NIST SSDF 1.1, OWASP SAMM 2 and ASVS 5.0.0
controls; add fiscal, cryptographic, supply-chain and partial-failure threats.
Every critical control requires a negative or adversarial proof.

No blanket framework compliance is claimed. Risk acceptance is explicit,
expiring and cannot waive law or falsify evidence. Privacy by design, telemetry
off by default, minimal data and host/controller responsibility are mandatory.

## Consequences and verification

Threat models evolve with architecture and releases. Mapping gaps are visible.
SAST and dependency scans supplement, but never replace, boundary/property,
fuzz, mutation, fault-injection and manual cryptographic review.
