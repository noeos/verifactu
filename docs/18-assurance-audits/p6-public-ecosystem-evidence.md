---
id: ASSURANCE-DOC-0021
title: P6 public ecosystem evidence
status: approved
authority: normative
owner: integration-owner
created: 2026-09-17
last-reviewed: 2026-09-17
decisions: [ADR-0035, ADR-0038, ADR-0039]
historical-inputs: [REV-047, REV-050, REV-055, REV-061, REV-062, REV-065, REV-066, REV-070, REV-072, REV-084]
---

# P6 public ecosystem evidence

P6 must qualify the three candidate tarballs from clean installed roots. The
library and adapter-kit will be consumed through ESM and CJS export maps plus
declarations; the CLI will be consumed through its installed executable.
Consumers must be created outside the repository and receive only the four
digest-checked tarballs (Verification Engine plus the three candidate packages);
workspace and sibling source resolution must be denied. A private deep import
is a required negative case. No P6 consumer or tarball evidence exists yet.

The target public library surface is `createVerifactu` plus immutable
configuration, capability, records, verification, submissions, events, editions,
schemas and evidence views. The future JSON and NDJSON decoders must reject
invalid UTF-8, BOM, duplicate members, unframed input and bounded-overflow
input. CLI unavailable/provider cells must return stable diagnostic output and
non-zero exit codes.

The adapter-kit evidence must run real factory instances, require a declared
available capability for every selected level, exercise lifecycle/limits/cleanup
and fault scenario identities, record cleanup/post-state, and label semantic
authority as `host-not-adapter`. Empty, missing and
destructive-without-double-opt-in cases must fail or remain unsupported.

The future Verification Engine matrix is pinned to public
`@noeos/verification-engine` 1.0.1 and profile `dev.noeos.jcs@1.0.0`, subject to
fresh admission at implementation time. The future Facturacion boundary must be
qualified by a maintained synthetic host that commits invoice/record/head/outbox
state atomically, claims with fencing, verifies Engine evidence, backs up/restores
and reopens persisted history. Facturacion itself is not built and no synthetic
host evidence exists yet.

Provider cells are individual: the offline XSD and certificate contracts must be
exercised with bounded fixtures; no signing, durable production storage or live
AEAT provider may be claimed without its real adapter and authorized evidence.
