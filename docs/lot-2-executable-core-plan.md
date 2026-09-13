---
id: PLAN-L2
title: Lot 2 executable core documentation plan
status: draft
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [PLAN-L1, ARCH-INDEX, CONTRACT-INDEX, CRYPTO-INDEX, PERSIST-INDEX, AEAT-INDEX]
decisions: [ADR-0001, ADR-0002, ADR-0007, ADR-0009, ADR-0011, ADR-0012, ADR-0013, ADR-0014, ADR-0015, ADR-0016, ADR-0017, ADR-0018, ADR-0019, ADR-0020, ADR-0021, ADR-0022, ADR-0023, ADR-0024, ADR-0025]
sources: [SRC-0010, SRC-0011, SRC-0014, SRC-0017, SRC-0019, SRC-0020, SRC-0021, SRC-0022, SRC-0023, SRC-0024, SRC-0025, SRC-0029, SRC-0039, SRC-0040, SRC-0041, SRC-0042, SRC-0043, SRC-0044, SRC-0045, SRC-0046, SRC-0047, SRC-0048, SRC-0049, SRC-0050, SRC-0051]
historical-inputs: [REV-007, REV-055, REV-061, REV-062, REV-072, REV-083, REV-084]
---

# Lot 2 executable core documentation plan

## Purpose and approval boundary

This plan controls the complete elaboration of architecture, public contracts,
official formats and cryptography, persistence and consistency, and AEAT
integration. Together those areas define the executable semantic spine of the
product:

```text
validated fiscal intent
  -> confirmed sequence head
  -> official record fields
  -> official fingerprint and chain
  -> exact XML bytes
  -> XAdES when required
  -> internal Noeos evidence
  -> atomic host commit and outbox
  -> exact SOAP request bytes over authenticated transport
  -> correlated AEAT result
  -> durable state, reconciliation, verification and export
```

This is not an MVP plan. Every normal, negative, boundary, concurrent, crash,
recovery, inspection and evolution path required by the complete product is in
scope. Dividing the work into areas only controls dependencies and review size;
it does not authorize partial semantics, temporary insecure substitutes or a
release that omits a required mode.

The project owner approved the substantive content of Lot 1 on 2026-09-12.
That approval fixes the design input for this plan, while the formal status of
Lot 1 remains `draft` until the exact-commit documentation and protected CI
gates in `GOV-003` and `GOV-012` exist. Lot 2 may be planned against those
approved design choices but cannot claim implementation or release evidence.

## Scope and governing constraints

Lot 2 comprises:

1. `05-architecture`: decomposition, dependency direction, trust, ownership,
   runtime views and enforceable invariants;
2. `06-contracts`: the complete library, CLI, schema, port, adapter and package
   contracts visible to Facturacion and other hosts;
3. `07-formats-cryptography`: official fields and bytes, XML/XSD, RRSIF
   fingerprinting and chaining, XAdES, certificates, QR and separate Noeos
   evidence;
4. `08-persistence-consistency`: atomic host integration, durable identities,
   stores, heads, outbox, concurrency, recovery, retention and restoration;
5. `09-aeat-integration`: edition-pinned WSDL/SOAP/mTLS behavior, batching,
   results, wait instructions, retries, indeterminate delivery, consultation
   and controlled portal evidence.

All specifications inherit these non-negotiable constraints:

- official law and the pinned AEAT edition outrank standards, libraries,
  repositories and forum experience;
- official fiscal integrity, XML signature validity, certificate trust, Noeos
  evidence and AEAT acceptance are distinct claims with distinct verifiers;
- no API type, brand, callback result, successful HTTP status or green CI job
  is trusted beyond the evidence it actually establishes;
- no hidden clock, randomness, locale, process-global state, filesystem,
  network, certificate lookup, endpoint discovery or mutable `latest` edition;
- every effect is owned by an explicit capability with limits, cancellation,
  cleanup, idempotency and diagnostic semantics;
- untrusted input is bounded before materialization and remains bounded through
  parsing, validation, signature processing, transport and diagnostics;
- the host cannot publish an invoice while its legally coupled record, exact
  artifact identities and outbox intent remain non-durable;
- network ambiguity is represented as durable knowledge, never converted into
  success, rejection or a blind retry;
- only the public, versioned Verification Engine package surface may be used;
  its evidence never substitutes the official RRSIF hash or XAdES;
- public DTOs are immutable, runtime validated and losslessly serializable;
  monetary, identifier and timestamp fidelity never depends on unsafe JSON
  numbers or implementation locale;
- the complete source/package topology and import rules are documented before
  source files are created and later enforced by architecture tests and CI.

## Research and authority method

### Source order

Each normative statement records the highest applicable authority:

1. BOE legislation and Order HAC/1177/2024;
2. immutable artifacts of the selected AEAT regulatory edition: designs, XSD,
   WSDL, validation/error catalogue, hash, signature, QR and service documents;
3. applicable formal standards such as XML, XML Schema, XML Signature, XAdES,
   SOAP, WSDL, JSON and HTTP;
4. official platform and dependency documentation;
5. professional patterns and public implementations as informative challenge
   material only;
6. forums and issue trackers solely for hypotheses and adversarial cases.

AEAT's technical index explicitly publishes separate artifacts for record
designs, WSDL, schemas, validations, submission, hash, signature and QR.^1 The
plan therefore prohibits treating any one of those artifacts as the complete
protocol. The observed developer FAQ also states that production services
cover submission, QR comparison and consultation, and warns that supporting
different legal regimes can constitute a family of different SIF products.^2

### Reproducible research record

Every behavior-affecting source must record URI, retrieval timestamp, redirect
chain, media type, byte length, SHA-256/SHA-512, publication/version indicators,
dependency closure, licence, supersession and affected requirements. Remote
content is quarantined and inspected before promotion. Generated contracts
record generator package, executable digest, configuration, toolchain and
output digest; regeneration must be byte-identical.

### What external code can and cannot prove

| Evidence | Useful lesson | Prohibited inference |
| --- | --- | --- |
| `inoguerols/verifactu` reports one AEAT preproduction acceptance and exposes XML, QR, XAdES and transport paths.^3 | Preserve exact live-exercise evidence and test certificate/transport usability. | One accepted record does not prove all fields, states, modes, retries, consultation or recovery. |
| `eloi24/verifactu-sdk` separates clients, schemas, signing, storage and wire behavior and advertises XSD-shaped runtime types.^4 | Compare modular boundaries, SOAP framing and wait handling. | Alpha status, generated types or a counted rule catalogue do not establish completeness. |
| OCA issues expose company-context leakage and certificate/endpoint failures.^5 | Add cross-context, proxy, TLS, HTML-error and authorization negatives. | An ERP workaround does not define the legal or wire contract. |
| `xml-crypto` documents reference-selection precautions against signature wrapping.^6 | Require a selected-reference API and duplicate-ID/wrapping tests. | Core XMLDSig verification alone does not validate XAdES policy, certificate path or regulatory meaning. |
| EU DSS supports XAdES and validation data such as chains, OCSP, CRL and trusted lists.^7 | Evaluate a locally controlled DSS provider as the reference XAdES implementation/oracle. | The public demonstration service is not a production dependency or conformance authority. |
| AWS describes transactional outbox as a response to dual-write failure and notes duplicate delivery/idempotency needs.^8 | Require atomic state plus outbox and consumer idempotency. | The pattern does not create exactly-once delivery or select a database for hosts. |

Public code is inspected at pinned commits when its design affects an ADR. No
copied code, example, schema or test vector enters the project before licence,
provenance, maintenance, security and independent-result review.

## Cross-area proof model

### Identities that must never collapse

The specifications must define and relate, without conflation:

- taxpayer, representative, installation, system, product and regulatory
  edition identity;
- invoice, billing record, event record, sequence and confirmed predecessor;
- semantic input revision, prepared operation and commit attempt;
- official field projection, fingerprint preimage, fingerprint and chain head;
- unsigned XML, signed XML, SOAP envelope and transmitted request bytes;
- Verification Engine input/evidence and its profile/version;
- outbox item, lease/fencing token, network attempt and response observation;
- AEAT batch, line correlation, result, CSV or other receipt where applicable;
- checkpoint, export manifest, backup and restoration verification.

Every transformation declares input identity, output identity, deterministic
parameters, edition, digest, ownership and lifetime. Reconstructing bytes later
is not equivalent to retaining the exact bytes actually signed or sent.

### State machines

One canonical machine-readable model must cover at least:

- prepared operation: created, validated, head-confirmed, materialized,
  committed, abandoned;
- official artifact: unsigned, validated, signing-requested, signed,
  signature-verified, retained;
- outbox/submission: pending, leased, submitting, indeterminate, retry-wait,
  reconciliation-required, accepted, accepted-with-errors, rejected,
  permanently-failed;
- mode tenure and edition activation;
- certificate/key/provider availability and authorization;
- export, backup, restoration and verification.

Every transition names atomic preconditions, compare-and-set token, durable
writes, allowed retries, clock source, emitted event, diagnostic, compensating
action and crash points. Prose and diagrams are generated views where
practical, not competing definitions.

### Oracle separation

The test design created later must use independent evidence for:

| Claim | Required independent evidence |
| --- | --- |
| Official field validity | Pinned AEAT XSD plus separately encoded business rules and official examples/errors. |
| Fingerprint and chaining | Official vectors and a mechanically independent reference implementation. |
| XML equivalence | Standards-conforming parse/serialize comparison where applicable and byte fixtures where exact bytes matter. |
| XAdES signature | Cryptographic reference validation, signed-reference identity, profile validation and certificate-path/revocation policy. |
| SOAP binding | Pinned WSDL/XSD contract, captured exact request and local strict protocol peer. |
| AEAT interoperability | Controlled, non-deterministic portal exercise retained separately from deterministic CI. |
| Durability | Fault injection at every named crash point plus restart and invariant inspection. |
| Verification Engine evidence | Clean-consumer tests against the exact published package tarball and profile vectors. |

No production implementation may serve as its own sole oracle.

## Area 05 — Architecture

### Questions it must close

- Which stakeholders and concerns require architectural views, and which model
  kind answers each concern?
- What is the exact workspace/package/module tree and public release surface?
- Which layer owns fiscal policy, orchestration, official bytes, durable state,
  transport, cryptographic providers and generic evidence?
- Which dependencies and imports are forbidden, including cross-repository
  internals and cycles?
- Where do data, control and trust cross boundaries through every dynamic flow?
- How are clocks, identifiers, cancellation, memory, concurrency, cleanup,
  configuration, editions and observability injected and isolated?
- Which deployment profiles are supported without turning this repository into
  a hosted service?
- How will CI prove architectural conformance rather than merely document it?

ISO/IEC/IEEE 42010:2022 distinguishes architecture from its description and
requires concerns, viewpoints and model kinds to be explicit.^9 C4 is adopted
as a concise communication notation for context, container, component, dynamic
and deployment views, not as a completeness or conformance claim.^10

### Required documents

| Document | Mandatory content |
| --- | --- |
| `architecture-description-and-viewpoints.md` | System of interest, stakeholders, concerns, viewpoints, model kinds, correspondence rules and known limitations. |
| `principles-and-quality-attributes.md` | Ranked safety, legality, determinism, security, fidelity, recoverability, performance and operability attributes with conflict rules. |
| `system-context.md` | Facturacion, maintainers/operators, Verification Engine, signature provider, durable host, AEAT, time/trust services and adversaries. |
| `package-and-container-view.md` | Complete planned workspace, publishable packages, internal packages, executable boundaries, artifact ownership and versioning unit. |
| `component-view.md` | Components, responsibilities, owned data, incoming/outgoing contracts and prohibited knowledge. |
| `dependency-rules.md` | Allowed import graph, type/runtime boundaries, cycle policy, public-only cross-repository access and automated enforcement. |
| `trust-boundaries-and-data-flows.md` | DFDs for every sensitive flow, classifications, validation points, controls and persistence/network crossings. |
| `dynamic-flows.md` | Success, rejection, cancellation, timeout, crash, replay, reconciliation, inspection and restoration sequences. |
| `data-ownership-and-lifecycle.md` | Canonical owner, mutable/immutable status, identity, retention, disposal, reconstruction and evidence for every data class. |
| `determinism-and-io.md` | Pure/effectful boundary, all nondeterministic inputs, replay envelope, byte stability and prohibited ambient I/O. |
| `configuration-and-isolation.md` | Immutable validated configuration, taxpayer/installation/edition isolation, cache scoping and no process-global mutation. |
| `concurrency-cancellation-and-resources.md` | Structured concurrency, ownership, backpressure, deadlines, cancellation propagation, resource ceilings and cleanup guarantees. |
| `runtime-deployment-profiles.md` | Embedded Node library, CLI and provider processes; supported topology, privilege and failure boundary for each. |
| `observability-boundaries.md` | Events versus logs/metrics/traces, redaction, correlation, observer failure and truthful durable-result semantics. |
| `evolution-and-compatibility.md` | Regulatory edition coexistence, package/API/schema evolution, migrations, deprecation and rollback constraints. |
| `architecture-conformance.md` | Machine-checkable imports, exports, side effects, cycles, package budgets, forbidden APIs and drift-report evidence. |

### Recommended structural decision

Use a TypeScript npm workspace with a functional regulatory core and explicit
imperative adapters. Publish the stable library, CLI and adapter/conformance
surface promised by `ADR-0007`; internal generation, test and provider
workspaces remain private unless a documented consumer need justifies a public
contract. Match Verification Engine's supported Node/toolchain matrix and
ESM/CJS interoperability only after clean-consumer proof against its published
artifacts. No package imports another repository's source tree.

The final package split is decided in `ADR-0015`, after drawing its complete
dependency graph. A premature package-per-folder design and one giant package
are both rejected: the former creates versioning/compatibility surface without
independent consumers; the latter cannot enforce effect and trust boundaries.

### Completion gate

All stakeholder concerns map to views; every component, effect and data class
has one owner; all end-to-end and failure flows cross named boundaries; the
complete planned source tree has an allowed dependency graph; and each
architectural invariant has a future executable conformance check and negative
fixture.

## Area 06 — Public contracts

### Questions it must close

- What is the smallest complete stable surface that still exposes every
  required product capability?
- How are untrusted values decoded, normalized, validated and converted to
  fiscal domain values without precision or Unicode loss?
- Which operations are pure queries, preparations, atomic commands, durable
  observations or external effects?
- Which host capabilities participate in one unit of work and how is stale
  prepared work rejected?
- What are the exact success, partial, indeterminate, invalid, cancelled and
  provider-failure results?
- How do CLI, JSON/NDJSON, TypeScript types and JSON Schema express the same
  contract without duplicated truth?
- Which resources are borrowed, transferred, consumed or returned, and who
  closes them?
- How do edition, package, schema and diagnostic versions evolve?

JSON Schema Draft 2020-12 is selected for machine interchange schemas, with an
explicit vocabulary and strict unevaluated-property policy.^11 RFC 8259 hazards
such as duplicate member names, Unicode interoperability and number precision
must be handled before domain conversion, not delegated to TypeScript types.^12

### Required documents

| Document | Mandatory content |
| --- | --- |
| `public-api.md` | Complete entry points, capability discovery, operation phases, pre/postconditions, immutability and normative examples. |
| `operation-lifecycle-and-command-model.md` | Prepare/confirm/commit/send/observe/verify commands, tokens, stale-state rejection and replay. |
| `configuration-and-capabilities.md` | Closed configuration schemas, provider capabilities, mode/edition selection, validation and secret references. |
| `cli.md` | Complete grammar, stdin/files, stdout/stderr, prompts prohibition, dry-run semantics, signals, exit codes and shell-safe diagnostics. |
| `json-and-ndjson.md` | UTF-8, duplicate keys, numeric/string policy, framing, incremental limits, backpressure, cancellation and per-line results. |
| `schemas-and-codecs.md` | Canonical schema source, JSON Schema vocabulary, codec symmetry, unknown fields, defaults, migrations and generated types. |
| `ports-and-adapters.md` | Capability contracts, trust assumptions, exact inputs/outputs, failure taxonomy, determinism and side-effect ownership. |
| `host-transaction-contract.md` | Unit-of-work lifecycle, atomic participants, ordering, commit/rollback ownership, after-commit actions and failure semantics. |
| `results-errors-and-diagnostics.md` | Discriminated results, causal chains, stable codes, retry meaning, redaction, localization boundary and serialization. |
| `events-and-observability.md` | Durable domain events versus observer notifications, ordering, delivery, privacy and observer-failure isolation. |
| `limits-cancellation-and-ownership.md` | Per-operation budgets, AbortSignal/deadlines, streams/buffers, handles, cleanup, double-close and cancellation races. |
| `exports-and-package-surface.md` | Export map, ESM/CJS/types, browser/non-Node exclusions, side effects, tree-shaking claims and deep-import rejection. |
| `editions-sources-and-catalog-access.md` | Offline discovery and exact retrieval of installed edition manifests, schemas, catalogues, source evidence and licences. |
| `versioning-and-compatibility.md` | Semver policy across runtime, wire/schema, CLI, diagnostics, adapters, editions and Verification Engine. |
| `adapter-conformance-contract.md` | Mandatory adapter suite, capabilities, invariants, fault injection, durability levels, evidence and truthful pass criteria. |

Node stream APIs support abort signals and explicit disposal/ownership patterns;
those mechanisms inform the contract but do not replace product-level cleanup
semantics.^13 Package `exports` are treated as an enforceable boundary, with
clean installed-tarball tests for every declared module system.^14

### Completion gate

Every capability is reachable through an executable contract; every public
value has runtime and serialization semantics; every effect/failure/resource
has an owner; API, CLI and schemas share canonical definitions; no command
claims work it does not perform; and the adapter suite cannot pass without a
real adapter exercising all mandatory invariants.

## Area 07 — Formats and cryptography

### Questions it must close

- Which exact AEAT fields and catalogues belong to each record/event/version,
  and how are generated structural contracts reconciled with prose rules?
- What exact character, escaping, namespace, QName, ordering, whitespace,
  decimal and timestamp rules produce official bytes?
- At which bounded stage is real XSD validation performed and with which pinned
  dependency closure?
- What exact preimage produces each official fingerprint and predecessor link?
- Which bytes are signed, retained, transmitted and later verified?
- What XAdES form, references, transforms, algorithms, qualifying properties,
  certificate rules and validation time satisfy each mode/event?
- How are keys kept behind non-exportable handles and how are trust,
  authorization, expiry and revocation outcomes represented?
- What exact QR payload and rendering constraints apply by mode and invoice?
- How is generic Verification Engine evidence bound without contaminating or
  replacing official artifacts?

XML Signature 1.1 explicitly does not establish how a key maps to a person or
what signed data means.^15 Signature verification therefore separates reference
integrity, XAdES profile, certificate path, authorization and regulatory
semantics. Canonical XML is an actual standards algorithm, never a hand-written
whitespace transform.^16 ETSI EN 319 132-1 V1.3.1 is the current engineering
reference for XAdES building blocks and baseline signatures, subordinate to
the exact AEAT signature profile.^17

### Required documents

| Document | Mandatory content |
| --- | --- |
| `official-field-and-contract-generation.md` | Pinned XSD/WSDL/catalog inputs, generated structural model, manual semantic overlay, drift and reproducibility. |
| `official-serialization.md` | Exact encoding, field projection/order, lexical spaces, decimal/date/time forms, omission/nil rules and byte identity. |
| `byte-artifact-lifecycle.md` | Identity and custody of preimages, unsigned/signed XML, envelopes and transmitted/retained bytes; no silent reconstruction. |
| `xml-model-and-serializer.md` | Namespace/QName/attribute/text model, escaping, invalid characters, tabs/newlines, deterministic serializer and round trips. |
| `xsd-validation.md` | Real pinned-schema validation, offline resolver, pre-parse limits, DTD/entity/network prohibition, diagnostics and independent oracle. |
| `rrsif-fingerprint.md` | Edition-specific selected fields, concatenation, encoding, algorithm, casing, vectors and negative mutations. |
| `official-chaining.md` | Predecessor identity/hash, genesis, sequence partition, event relations, chronology and fork/gap verification. |
| `canonicalization.md` | Permitted standards algorithms, inputs/node sets, comments/namespaces, implementation boundary and interoperability vectors. |
| `xades-profile.md` | Required XAdES form/properties/references/transforms/algorithms by artifact and edition. |
| `signature-creation-and-verification.md` | Provider protocol, selected references, anti-wrapping, returned-byte verification, validation reports and failure taxonomy. |
| `certificates-and-revocation.md` | Credential handles, chain building, validation instant, EKU/key usage, taxpayer/representative authorization, OCSP/CRL policy and evidence. |
| `qr-content.md` | Exact URL/query construction, mode labels, percent encoding, dates, negative/credit amounts and edition/environment behavior. |
| `qr-rendering-and-verification.md` | Symbol version/error correction/quiet zone/size, SVG/PNG safety, scan-quality corpus, payload round trip and accessibility output. |
| `noeos-evidence-profile.md` | Namespaced tax-domain projection into generic evidence, privacy-safe identities, algorithms, schema and version. |
| `verification-engine-adaptation.md` | Exact public package/API mapping, evidence verification, failure isolation, compatibility and tarball conformance. |
| `conformance-vectors-and-independent-oracles.md` | Positive, negative, boundary and mutation vectors with provenance and oracle independence per claim. |
| `cryptographic-agility.md` | Edition-bound suites, algorithm identifiers, migration, historical verification, downgrade prevention and deprecation. |

### Recommended provider decision

Do not implement XML canonicalization, XMLDSig/XAdES or PKI validation from
scratch. Run a time-boxed, security-reviewed admission spike comparing a
locally controlled EU DSS provider/reference path with a hardened native or
WASM XML/XSD path. Production selection requires exact AEAT-profile
interoperability, offline pinned resolution, process/worker isolation, bounded
resources, maintained versions, compatible licence, reproducible packaging and
independent negative tests. No remote public signing/validation service is a
runtime dependency.

The application sends a digest-bound signing request through a key handle and
must parse and cryptographically verify the exact returned signed bytes before
commit. Caller booleans such as `certificateValid: true` and unverified signer
metadata have no authority.

### Completion gate

Every official byte has an edition and reproducible derivation; real XSD and
semantic validation are separate and mandatory; hash, chain, signature, trust,
authorization, QR and Noeos evidence claims have independent vectors; hostile
XML and provider outputs fail closed before commit; and the exact artifact
retained is the one verified/signed/sent as the operation requires.

## Area 08 — Persistence and consistency

### Questions it must close

- What minimum durability semantics must every host adapter provide without
  selecting one database for all consumers?
- Which invoice, fiscal record, artifact, evidence, head and outbox writes form
  one atomic outcome?
- How are confirmed heads protected by compare-and-set and how are genesis,
  forks, gaps, stale prepares and concurrent writers rejected?
- What identity makes commands, records, attempts and remote observations
  idempotent, and where are conflicts surfaced?
- How do leases and fencing prevent a paused/expired worker from committing
  stale work?
- How is every attempt durably advanced before network I/O and every uncertain
  result reconciled before resend?
- How do checkpoints detect rollback or truncation without trusting the same
  mutable store they attest?
- How are migrations, retention, export, purge restrictions, backups and
  restoration proven for historical editions?

Transactional outbox addresses the state/message dual-write boundary but
normally delivers at least once and therefore requires idempotent handling and
preserved order.^8 Database features such as serializable isolation or
`SKIP LOCKED` may support an adapter, but their documented anomalies and exact
semantics must be proved rather than abstracted away.^18

### Required documents

| Document | Mandatory content |
| --- | --- |
| `storage-semantics-and-data-model.md` | Logical entities, keys, constraints, relationships, indexes, ownership, durability levels and prohibited representations. |
| `host-transaction-boundary.md` | Invoice/record/artifact/evidence/outbox atomic set, host UoW protocol, commit point and impossible split-brain outcomes. |
| `record-and-artifact-store.md` | Append/immutability semantics, exact byte storage, digest checks, reads, enumeration, corruption and conflict behavior. |
| `event-and-evidence-store.md` | Event ordering, Verification Engine evidence, signature reports, AEAT observations, tamper detection and privacy. |
| `outbox-store.md` | Pending work, payload identity, readiness, ordering, leasing, attempts, receipts, dead-letter prohibition/handling and queries. |
| `atomic-commit.md` | Transactional protocol, write order, rollback, after-commit scheduling, adapter capability levels and crash proof. |
| `heads-cas-and-forks.md` | Head token, genesis, compare-and-set, chronology, competing writers, fork/gap detection and repair constraints. |
| `idempotency-and-identity.md` | Command/record/artifact/attempt keys, same-key/same-value replay, same-key/different-value conflict and retention. |
| `leases-and-fencing.md` | Lease clock, owner, expiry, renewal, fencing token, stale completion rejection and pause/partition cases. |
| `state-machine-and-journal.md` | Canonical transitions, journal facts, monotonic attempt number, wait/retry/reconcile state and observer independence. |
| `checkpoints-and-rollback-detection.md` | Signed/external anchors, freshness, store identity, snapshot digest, truncation/replay detection and recovery. |
| `schema-versioning-and-migrations.md` | Forward/backward compatibility, transactional migration, resume/rollback, edition history and mixed-version prevention. |
| `retention-archival-and-purge.md` | Legal holds, data classes, access, archive, allowed deletion, tombstones and proof of completeness. |
| `backup-restore-and-disaster-recovery.md` | Consistent snapshot, keys/providers, RPO/RTO assumptions, alternate-site restore, reconciliation and verification ceremony. |
| `crash-and-recovery-matrix.md` | Every instruction boundary around durable/network effects, expected facts after restart, next safe action and invariant oracle. |
| `adapter-durability-requirements.md` | Executable conformance levels, isolation/durability claims, concurrency/fault harness, evidence and unsupported capability behavior. |

### Recommended consistency decision

Require the host to atomically commit its invoice publication state with the
VeriFactu record, exact artifacts/evidence, confirmed sequence head and outbox
intent through one explicit unit of work. A co-located transactional adapter is
the preferred profile. A host that cannot provide it must implement a separately
approved journal/coordination protocol proving equivalent invariants; an
eventual best-effort callback is not compliant.

Submission is modeled as at-least-once execution with exactly-once durable
classification per attempt, not exactly-once networking. Expired `submitting`
work becomes `reconciliation-required`; it cannot be resent until evidence
establishes the prior outcome or the edition-specific protocol authorizes the
next action.

### Completion gate

All durable entities and constraints are defined; every coupled write has one
atomic protocol; every concurrent and replay case has a deterministic result;
every crash point has restart evidence; no stale lease can commit; uncertain
delivery cannot blind-retry; and export plus restoration prove completeness,
fidelity, accessibility and historical verification.

## Area 09 — AEAT integration

### Questions it must close

- Which services, operations, namespaces, bindings, endpoints and environments
  belong to each immutable edition?
- What exact SOAP 1.1 message, headers, action, media type and body bytes are
  valid for each operation?
- Which authenticated party and certificate may act for which taxpayer and
  system, and how is that checked without exposing key material?
- How are ordered batches built, bounded and correlated one-to-one with all
  individual results?
- Which HTTP, TLS, SOAP Fault, malformed/oversized body and AEAT business states
  exist, and what durable knowledge does each create?
- How are `TiempoEsperaEnvio`, deadlines, retry eligibility and clock inputs
  persisted and enforced?
- How are lost responses and indeterminate delivery resolved using official
  consultation/reconciliation behavior?
- Which claims can deterministic local CI establish and which require a
  controlled portal exercise?

WSDL 1.1 and SOAP 1.1 define binding/message structure, but the pinned AEAT WSDL
and service documents select the actual contract.^19 HTTP semantics warn that a
client must not automatically retry a non-idempotent request unless it knows
the semantics are idempotent or knows the original request was not applied.^20
This is why transport errors and remote business outcomes remain separate.

### Required documents

| Document | Mandatory content |
| --- | --- |
| `services-environments-and-endpoints.md` | Edition manifest of services/operations/ports/endpoints, production/test isolation, immutable allowlist and drift. |
| `wsdl-xsd-and-binding-profile.md` | Closed import graph, selected binding, generated model, manual constraints, namespaces/actions and reproducibility. |
| `soap-binding-and-wire-message.md` | Exact envelope/header/body, media types, SOAPAction, UTF-8, byte limits and captured fixtures. |
| `https-mtls-and-transport.md` | TLS policy, hostname/chain validation, mTLS handles, proxies/DNS/redirects, timeouts, AbortSignal, ownership and bounded responses. |
| `certificate-representation-and-authorization.md` | Taxpayer/representative/system relation, provider identity, permitted credentials and distinct TLS versus XML-signature use. |
| `headers-and-system-identity.md` | Legal/system header fields, acting identity, edition, installation and cross-context mismatch rejection. |
| `batches-order-and-limits.md` | Eligibility, grouping, maximums, ordering, one immutable payload identity and partial-construction failure. |
| `response-model.md` | Envelope/global/line outcomes, CSV/receipts, warnings, accepted-with-errors, rejected and unknown content. |
| `record-correlation.md` | Expected identities/count/order, duplicates/missing/foreign lines, ambiguity and fail-closed classification. |
| `faults-and-transport-errors.md` | HTTP/TLS/SOAP/malformed/HTML/truncated/oversized/timeouts taxonomy and durable observation. |
| `submission-timing-and-wait-instructions.md` | Initial and returned wait, authoritative clock, persistence, accumulation behavior, restart and clock-change handling. |
| `retry-policy.md` | Edition/error-specific eligibility, attempt budget, backoff/jitter inputs, wait precedence, exhaustion and no hidden loop. |
| `indeterminate-delivery-and-reconciliation.md` | Lost response, durable state, consultation keys, reconciliation outcomes, operator action and safe resend criteria. |
| `consultation-and-required-submission.md` | Complete consultation and authority-requested submission flows, pagination, historical criteria, signatures and evidence. |
| `local-protocol-harness.md` | Strict local peer, TLS fixtures, request validation, scripted faults, malformed/slow/oversized responses and deterministic captures. |
| `aeat-portal-validation.md` | Authorized test identities/data, certificate custody, scenario matrix, evidence, rate limits, cleanup and non-CI status. |
| `protocol-drift-and-compatibility.md` | Source monitoring, endpoint/certificate/schema drift, impact, new-edition activation and coexistence. |
| `operational-observability-and-runbooks.md` | Privacy-safe metrics/events, stuck states, certificate expiry, reconciliation, outage, escalation and operator limits. |

### Recommended transport decision

Generate structural service contracts from the pinned WSDL/XSD, then bind them
to a narrow transport port that performs exactly one network observation per
call. Retry, batching, wait and reconciliation remain in durable orchestration,
not hidden inside the HTTP adapter. Endpoints come only from an installed
edition/environment allowlist; the ordinary public API cannot inject arbitrary
URLs. Redirects are disabled unless an explicit edition rule proves otherwise.

The local protocol harness is the deterministic CI authority for wire shape and
failure behavior. AEAT portal tests are separately scheduled/manual external
observations because remote availability, certificates, server changes and
rate limits make them non-reproducible; even community reports show internal
sandbox failures against apparently valid signed examples.^21

### Completion gate

Every service operation is bound to pinned official artifacts; every request
and response has exact bounded parsing/correlation semantics; identity and
endpoint selection fail closed; wait/retry/indeterminate states are durable;
consultation closes every supported reconciliation path; the local harness
covers all transport classes; and portal evidence is scoped without becoming
the sole release oracle.

## Required decisions for Lot 2

The following ADRs must be researched and accepted before dependent documents
can become `approved`:

| Proposed ADR | Recommended decision | Principal trade-off or rejected alternative |
| --- | --- | --- |
| `ADR-0015` | Modular TypeScript npm workspace with functional core, explicit adapters, complete predeclared package tree and public surfaces limited to real consumers. | One package weakens boundaries; excessive public packages multiply compatibility obligations. |
| `ADR-0016` | Architecture description based on explicit 42010-style concerns/viewpoints, C4/text diagrams and machine-checkable correspondence/import rules. | Diagrams alone drift and cannot prove architecture. |
| `ADR-0017` | Runtime-validated immutable contracts with staged commands, explicit capabilities and serializable discriminated results. | TypeScript-only DTOs and broad callbacks recreate trust, ownership and round-trip failures. |
| `ADR-0018` | Generate structural contracts reproducibly from pinned official XSD/WSDL; maintain semantic/regulatory rules separately with source links. | Pure generation misses prose rules; pure hand coding drifts from official structure. |
| `ADR-0019` | Admit a standards-conforming, offline, resource-bounded XML/XSD backend only after security, licence, maintenance, reproducibility and oracle evaluation. | Fake validation or an unmaintained parser is unacceptable; naming a library before evidence is premature. |
| `ADR-0020` | Use a hardened provider/reference implementation such as locally controlled EU DSS for XAdES/PKI, with non-exportable key handles and verification of returned bytes. | Hand-built XAdES and caller-supplied validity booleans cannot support the trust claim. |
| `ADR-0021` | Separate official RRSIF integrity, XAdES, certificate authorization and generic Verification Engine evidence as independently versioned claims. | A single “verified” boolean hides material failure and authority boundaries. |
| `ADR-0022` | Require atomic host invoice/record/head/artifact/evidence/outbox commit, preferably one co-located transaction, with proven alternate protocol only by explicit adapter level. | Best-effort callbacks permit legally inconsistent host state. |
| `ADR-0023` | Use CAS heads, durable monotonic attempts, leases with fencing and reconciliation-before-resend; claim at-least-once execution, never exactly-once networking. | Lease-only queues and blind retries permit forks, duplicates and false results. |
| `ADR-0024` | Bind AEAT operations to edition-pinned WSDL/SOAP and immutable endpoints; transport observes once while orchestration owns retry/wait/reconciliation. | Hidden transport retry and arbitrary URL injection are unsafe and unverifiable. |
| `ADR-0025` | Treat exact unsigned, signed, enveloped, sent and retained bytes as separate digest-addressed artifacts with explicit custody. | Regeneration after commit cannot prove what was signed or transmitted. |

Approval of this plan approves the questions, document inventory, recommended
direction and decision work. It does not silently accept an XML library,
database, DSS release, QR library, certificate authority or adapter that has
not passed the admission evidence specified above.

## Historical-finding closure matrix

Each finding receives an individual machine-readable disposition later. This
planning matrix prevents any relevant failure from losing an owner:

| Findings | Mandatory Lot 2 destination |
| --- | --- |
| `REV-007`, `REV-018` | `official-chaining`, `heads-cas-and-forks`, prepared-command lifecycle and stale-head crash/concurrency tests. |
| `REV-008`–`REV-011` | Generated official contracts, real bounded XSD validation, XML data model, serializer and canonicalization with independent hostile fixtures. |
| `REV-012`–`REV-016` | XAdES/PKI provider, selected references, authorization, returned-byte verification and artifact custody. |
| `REV-017` | Architecture/configuration isolation plus taxpayer/installation/edition mismatch tests at every port/store/cache. |
| `REV-019`–`REV-021` | Exact artifact identity, official chain verifier and separate Verification Engine evidence verification. |
| `REV-022`–`REV-027` | Complete events/modes/exports/API validation, observer isolation, resource ownership and honest results. |
| `REV-028`–`REV-036` | Atomic host transaction, CAS, external checkpoints, durable attempts, fencing, compatible state machine and idempotency. |
| `REV-037`–`REV-044` | Pinned WSDL/SOAP, immutable endpoints, exact response correlation, wait persistence, uncertain delivery, cancellation and TLS provider harness. |
| `REV-045`–`REV-046` | Edition-specific QR payload/rendering including dates, negative amounts, modes and scan corpus. |
| `REV-047`–`REV-055` | Complete CLI grammar/execution, JSON/NDJSON fidelity, real streaming, atomic filesystem semantics, writers, help/version/exit contracts. |
| `REV-061` | Adapter conformance levels that require real adapters and exercise all invariants/faults. |
| `REV-062` | Independent oracle matrix; production implementation and repeated assumptions cannot validate themselves. |
| `REV-072` | Complete package/module tree, exports, dependency direction and conformance checks before implementation. |
| `REV-083` | Retention, archive, complete export, backup/restore and historical verification ceremony. |
| `REV-084` | Installed edition/source/catalog access through public library and CLI contracts, verified from packed artifacts. |

Findings `REV-001`–`REV-006`, `REV-056`–`REV-060`, `REV-063`–`REV-071` and
`REV-073`–`REV-082` remain cross-cutting inputs owned primarily by Lots 1 and
later quality/repository/release lots. Lot 2 still maps any concrete design
effect they impose; area ownership is not permission to ignore them.

## Cross-area deliverables

In addition to the 82 substantive documents, Lot 2 must produce or precisely
specify these canonical artifacts for later implementation:

- architecture concern/viewpoint/correspondence registry;
- complete future workspace/package/file ownership tree and allowed import
  graph;
- public operation, result, diagnostic, event and adapter registries;
- official source dependency and generated-contract manifests;
- artifact/identity/transformation/custody registry;
- state-machine and transition registry;
- storage entity/constraint and host-transaction registry;
- AEAT service/operation/endpoint/error/retry/correlation registries;
- limit and ownership matrix across public, XML, cryptographic, storage and
  network boundaries;
- independent-oracle and conformance-vector manifest;
- crash/restart, concurrency, cancellation and protocol fault matrices;
- individual dispositions for every assigned `REV-*` finding;
- trace matrices from `SRC/REG/FUN/NFR/SEC/PERF` through ADR, contract,
  planned implementation owner, `TEST-*` and `EVD-*`.

Their schemas, canonical sources and generators are planned here. Executable
generation and CI enforcement are delivered in the quality/repository lots;
until then no generated-view or passing-gate claim may be made.

## Execution order

1. Freeze the Lot 2 research snapshot and verify Lot 1 inputs and open
   regulatory ambiguities.
2. Draft `ADR-0015`–`ADR-0017`; close architecture viewpoints, full source tree,
   dependency graph, effect boundaries and public operation model.
3. Import the selected AEAT edition's full XSD/WSDL/artifact graph and design
   reproducible generation under `ADR-0018`.
4. Run XML/XSD and XAdES/PKI admission spikes; record `ADR-0019`–`ADR-0021`
   using hostile fixtures and independent tools, not demonstrations.
5. Close official fields, bytes, fingerprint, chain, signature, certificate,
   QR and Verification Engine mappings.
6. Close host unit-of-work, stores, CAS, idempotency, state journal, leases,
   checkpoints, migrations and recovery under `ADR-0022`, `ADR-0023` and
   `ADR-0025`.
7. Close WSDL/SOAP/mTLS, timing, retry, results, consultation and reconciliation
   under `ADR-0024`.
8. Reconcile every public contract with all formats, durable transitions and
   AEAT results; eliminate impossible or unowned states.
9. Complete historical dispositions, threat/control links, performance/resource
   budgets and independent-oracle/crash/fault matrices.
10. Run contradiction review across Lot 1, the Noeos ecosystem documents,
    Verification Engine's exact public release and all 84 previous findings.
11. Execute documentation gates on one exact commit and create the Lot 2 area
    approval reports only when the protected path exists.

Parallel drafting is allowed only after shared identities, artifact lifecycle,
state vocabulary and package boundaries are fixed. Formats, persistence and
AEAT integration cannot independently invent those concepts.

## Lot exit criteria

Lot 2 is approvable only when:

- all 82 planned documents contain substantive, mutually consistent normative
  content and no material placeholder;
- `ADR-0015`–`ADR-0025` are accepted with evidence and no hidden dependency
  selection remains;
- the complete package/file tree, public surfaces and import graph are fixed;
- every official artifact and transformation is edition-pinned and
  digest-addressed;
- all success, negative, boundary, concurrency, crash, cancellation, recovery,
  portal and evolution flows have exact states, owners and evidence;
- official hash, XML/XSD, XAdES, certificate trust/authorization, QR, SOAP/AEAT
  and Verification Engine evidence are never collapsed into one claim;
- every public input, result, diagnostic, event, resource and effect has exact
  runtime, serialization, limit and compatibility behavior;
- atomic host integration, CAS, fencing, idempotency, uncertain delivery,
  reconciliation, retention and restoration have no unspecified state;
- each assigned historical finding has an individual disposition and negative
  regression obligation;
- all sources are current/pinned, links and identifiers validate, generated
  views are reproducible and contradiction review is clean;
- documentation gates pass locally and in CI for the exact candidate commit,
  and the owner records approval through the governed single-maintainer PR
  path.

No document may use “complete”, “verified”, “AEAT compatible”, “secure” or
“compliant” beyond the exact scope of retained evidence. Finishing this plan or
its prose is not proof that code, adapters, portal exercises, release packages
or operational controls exist.

## Current elaboration state

As of 2026-09-12, the project owner has reviewed and approved the intended
normative content of all 82 planned substantive documents: 16 architecture, 15
public-contract, 17 format/cryptography, 16 persistence and 18 AEAT-integration
specifications. The owner has also approved the eleven design directions
recorded in `ADR-0015` through `ADR-0025`, and each area index reflects its
complete inventory and exit gate. This approval establishes the authoritative
design input for Lot 3; it does not fabricate implementation evidence.

This completes the **normative planning content**, not the implementation or
formal area approval. Dependency admission spikes, imported digest-pinned AEAT
source bytes, generated machine registries, independent executable oracles,
negative fixtures, adapter/crash/protocol harnesses, source/package code and
the protected local/CI approval path do not yet exist. Accordingly documents
remain `draft`, ADRs remain `proposed`, and the five indexes remain `draft`
until their exact-commit evidence satisfies `GOV-003`, `GOV-011` and `GOV-012`.

## Sources

1. AEAT, “[Technical information for billing systems and VERI*FACTU](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/informacion-tecnica.html),” consulted 2026-09-12.
2. AEAT, “[Developer FAQ](https://sede.agenciatributaria.gob.es/static_files/AEAT_Desarrolladores/EEDD/IVA/VERI-FACTU/FAQs-Desarrolladores.pdf),” observed edition updated 2025-12-04, consulted 2026-09-12.
3. I. Noguérols, “[verifactu](https://github.com/inoguerols/verifactu),” public implementation, inspected 2026-09-12; claims are informative only.
4. Eloi24, “[verifactu-sdk](https://github.com/eloi24/verifactu-sdk),” alpha public implementation, inspected 2026-09-12.
5. OCA, “[Cross-company VeriFactu context issue 4468](https://github.com/OCA/l10n-spain/issues/4468)” and “[network/certificate issue 4497](https://github.com/OCA/l10n-spain/issues/4497),” used only for failure discovery, consulted 2026-09-12.
6. node-saml, “[xml-crypto](https://github.com/node-saml/xml-crypto),” security guidance on verified references, consulted 2026-09-12.
7. European Commission, “[Digital Signature Service — DSS](https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467109107/Digital+Signature+Service+-+DSS),” and [`esig/dss`](https://github.com/esig/dss), consulted 2026-09-12.
8. AWS, “[Transactional outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html),” consulted 2026-09-12.
9. ISO, “[ISO/IEC/IEEE 42010:2022](https://www.iso.org/standard/74393.html),” architecture description, edition 2.
10. C4 model, “[Diagrams](https://c4model.com/diagrams),” consulted 2026-09-12.
11. JSON Schema, “[Draft 2020-12](https://json-schema.org/draft/2020-12),” published 2022-06-16.
12. IETF, “[RFC 8259 — The JavaScript Object Notation Data Interchange Format](https://www.rfc-editor.org/rfc/rfc8259),” December 2017.
13. Node.js, “[Stream API](https://nodejs.org/api/stream.html)” and “[File system API](https://nodejs.org/api/fs.html),” consulted 2026-09-12 against supported-runtime planning.
14. Node.js, “[Modules: Packages](https://nodejs.org/api/packages.html),” consulted 2026-09-12.
15. W3C, “[XML Signature Syntax and Processing Version 1.1](https://www.w3.org/TR/xmldsig-core/),” Recommendation, 2013-04-11.
16. W3C, “[Canonical XML Version 1.1](https://www.w3.org/TR/xml-c14n11/),” Recommendation, 2008-05-02.
17. ETSI, “[EN 319 132-1 V1.3.1](https://www.etsi.org/deliver/etsi_en/319100_319199/31913201/01.03.01_60/en_31913201v010301p.pdf),” XAdES building blocks and baseline signatures, 2024-07.
18. PostgreSQL, “[Transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)” and “[SELECT locking clause](https://www.postgresql.org/docs/current/sql-select.html),” illustrative adapter semantics only, consulted 2026-09-12.
19. W3C, “[SOAP 1.1](https://www.w3.org/TR/SOAP/)” and “[WSDL 1.1](https://www.w3.org/TR/wsdl.html).”
20. IETF, “[RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110),” especially method idempotency and retry considerations.
21. Stack Overflow, “[AEAT sandbox error 1207](https://stackoverflow.com/questions/79817230/verifactu-aeat-sandbox-always-returns-error-1207-error-interno-en-el-servidor),” used only as a nondeterministic-service test hypothesis, consulted 2026-09-12.
