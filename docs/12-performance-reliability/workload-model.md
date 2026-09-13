---
id: PERF-DOC-0001
title: Workload model
status: approved
authority: normative
owner: performance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [PROD-DOC-0004, DOM-DOC-0002, SEC-DOC-0009]
historical-inputs: [REV-024, REV-026, REV-027, REV-031]
---

# Workload model

Performance evidence is meaningful only for a named workload. Each workload
record fixes operation mix, semantic validity, mode/edition, input byte and field
distribution, tax/detail cardinality, signature mode, chain topology, batch
shape, storage/key/network adapter, concurrency/arrival pattern, duration,
failure injection and expected outputs.

## Workload families

| ID | Family | Required variants |
|---|---|---|
| WL-0001 | decode + semantic validation | minimum, representative, legal maximum, invalid, hostile |
| WL-0002 | alta/anulación construction + chain append | first/steady chain, contention, correction/cancellation |
| WL-0003 | event generation/append | normal burst, recovery burst, invalid trigger |
| WL-0004 | deterministic XML/fingerprint/signature | unsigned/signed, min/representative/max artifact |
| WL-0005 | durable journal/storage | cold/warm, sync policy, contention, crash recovery |
| WL-0006 | submission/response | local controlled endpoint, latency/errors/timeout/large response |
| WL-0007 | export/chain verification | small, long chain, corrupted, incremental/resumed |
| WL-0008 | complete end-to-end operation | supported mode × edition × adapter profile |
| WL-0009 | sustained mixed operation | realistic distribution, burst and backlog drain |
| WL-0010 | hostile bounded input | parser, nested lists, cardinality, slow consumer |

## Dataset construction

Datasets are synthetic, deterministic from recorded seed and free of production
data. Representative distributions are based on documented product assumptions
or anonymized aggregate measurement supplied later; assumptions are visibly
tagged. Maximum means the supported official/configured boundary, not available
RAM. Outputs are validated outside timed regions and sampled within long runs to
detect fast-but-wrong implementations.

## Arrival and dependency models

Closed-loop throughput, open-loop arrivals and burst tests are distinct. Open
loop is used for latency under offered load so clients do not hide saturation.
Adapters use controlled distributions for latency and failure; real-authority
tests establish compatibility only and never define reproducible benchmarks.
