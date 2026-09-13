---
id: PERF-DOC-0004
title: Official benchmark environment
status: draft
authority: normative
owner: performance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [PERF-DOC-0003, GOV-009]
historical-inputs: [REV-041, REV-042, REV-060, REV-061]
---

# Official benchmark environment

Before numeric budgets are adopted, infrastructure as code must define a
dedicated, repeatable Linux environment with pinned architecture/CPU class and
allocation, memory/swap, storage class/filesystem, kernel/container image,
Node.js/toolchain, crypto library, locale/timezone, power/governor controls and
network-emulator profile. Immutable image and configuration digests identify it.

## Qualification

At run start the harness captures hardware/virtualization, CPU topology/frequency,
memory/swap pressure, kernel, filesystem/mount, runtime/GC, package lock/build,
environment variables allowlist and background-load probe. It calibrates timer,
CPU, memory and storage noise using versioned probes. A run is invalid when
configuration differs, thermal/steal/background noise exceeds adopted bounds,
required counters are unavailable or the tree/artifact is not attributable.

## Isolation and secrets

Benchmarks use synthetic data, test keys and controlled local dependencies.
Unintended network is denied. Shared public CI may run smoke/regression signals
but cannot claim official numbers unless its isolation and variance satisfy this
contract. Production endpoints and credentials are prohibited.

## Portability profiles

Additional reference environments may detect architecture/runtime differences,
but only the named official profile enforces a given numeric budget. Results are
never generalized to unmeasured hardware. Environment revisions require a bridge
study running baseline artifacts on old and new profiles; they do not splice
incomparable time series.

Until the environment manifest and first baseline are implemented, this document
defines the contract and every numeric latency/throughput target remains
`calibration-required`, not passed or waived.
