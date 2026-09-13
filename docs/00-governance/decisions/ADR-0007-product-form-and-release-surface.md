---
id: ADR-0007
title: Product form and release surface
status: accepted
authority: decision
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
supersedes: []
sources: [SRC-0001, SRC-0002]
requirements: [PROD-0001, PROD-0002, PROD-0003]
risks: [RISK-0001]
---

# ADR-0007: Product form and release surface

## Context

VeriFactu must be consumed by Facturacion while remaining independently usable
and auditable. Turning it into a mandatory hosted service would add availability,
hosting, controller/processor, tenancy and secret-custody responsibilities not
assigned to this repository.

## Options

1. Hosted service only: centralized operation, but compulsory network trust,
   customer-data processing and a new operational product.
2. Embedded library only: smallest surface, but poor inspection, automation and
   adapter conformance.
3. Library, CLI and adapter conformance kit: more contracts to maintain, but
   supports applications, operators and independent verification without a
   hidden service dependency.

## Decision

Adopt option 3. Publish a production library, companion CLI and executable
adapter conformance kit. The core is offline-capable and deterministic. AEAT,
certificate, durable-storage and Verification Engine interactions occur through
explicit host-supplied ports. This repository provides no mandatory Noeos-hosted
tax service.

## Consequences

All three surfaces require stable versioned contracts, packaged-consumer tests
and equivalent semantics. The host owns user authentication, commercial UI and
infrastructure operation. Future hosted deployment requires a successor ADR and
its own privacy, tenancy, availability and operational specification.

## Verification

Clean consumers install only published packages; CLI/API vectors agree; adapter
conformance fails with zero adapters or omitted mandatory capabilities; network
access is impossible without an injected port.
