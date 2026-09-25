---
id: ADR-0057
title: Local EU DSS provider for XAdES and PKI
status: accepted
authority: decision
owner: cryptography-owner
created: 2026-09-24
last-reviewed: 2026-09-24
dependencies: [ADR-0019, ADR-0020, ADR-0029, ADR-0034, ADR-0035, ADR-0036]
sources: [SRC-0046, SRC-0091]
historical-inputs: [REV-010, REV-011, REV-012, REV-013, REV-014, REV-062, REV-069]
---

# ADR-0057: Local EU DSS provider for XAdES and PKI

## Question and context

P4-D requires real signature creation and cryptographic verification and must
not ship a home-grown XMLDSig/XAdES/PKI implementation. The provider also must
remain offline and private to the package.

## Decision criteria

Exact AEAT XAdES EPES profile compatibility; cryptographic correctness;
interoperability; explicit PKI/revocation policy; key isolation; hostile XML
resistance; local/offline operation; bounded/cancellable execution; deterministic
build, supported-platform feasibility and complete third-party licence
compliance.

## Options considered

- Write signature and PKI algorithms in project code: rejected as unsafe and
  duplicative.
- Call the EU DSS public demonstration service: rejected because it adds an
  uncontrolled external service and cannot be a product runtime dependency.
- Use EU Digital Signature Services locally behind a narrow private adapter:
  selected, subject to every admission and qualification gate below.

## Decision

Use the European Commission's locally executed DSS 6.5 library as the P4-D
provider candidate for XAdES creation and verification. Pin the exact Maven
artifact graph, checksums, source/build identity, JDK, Maven, and adapter
interfaces before provider implementation. Disable DSS remote demos, network
fetching and mutable default trust sources. Only caller-supplied bounded
certificates, trust anchors, validation time, algorithms, signer identity and
revocation evidence may influence a request. Keep the bridge, shaded artifact,
Java classes and internal reports out of the public package surface.

DSS capability is not itself proof of the AEAT profile, signature validity,
certificate trust, authorization, AEAT acceptance or Noeos evidence. The
adapter independently enforces the exact selected profile, references,
transforms, algorithms, signed properties and returned bytes. If DSS 6.5 cannot
meet the profile or offline/security requirements, P4-D is blocked for an
explicit successor decision; it may not silently substitute a mock, remote
service or weaker profile.

DSS is identified by the European Commission as LGPL 2.1 software. Before
distribution, the repository must retain the exact licence and notices and
review the complete runtime/transitive/shaded dependency graph, source and
modification obligations, packaging/linking model, SBOM and consumer artefacts.
This is an engineering licence review, not a claim of external legal advice or
legal approval; required competent legal review remains an external gate.

## Consequences and residual risks

The provider adds Java/Maven/JDK admission, a private process or bridge,
resource/cancellation supervision, vulnerability and licence maintenance, and
cross-language coverage/tooling obligations. No JDK, Maven version, Action,
artefact checksum or public conformance claim is assumed by this ADR; the
P4-readiness manifest must admit each exact item before P4-D.

## Verification

P4-D must prove signing and verification against the official AEAT vector and
independent vectors; negative cryptographic, wrapping/parser, chain/time/usage,
revocation, algorithm, cancellation/resource and network-denial behavior; key
non-exportability at the declared provider level; reproducible offline build;
complete JavaScript and any project-authored Java coverage/mutation mapping;
closed shade contents, NOTICE/licence closure and clean packed consumer with no
internal provider exports.

## Migration and reversal

All provider APIs remain private and are versioned internally. A DSS upgrade or
replacement requires a new exact admission dossier, complete affected evidence
rerun, independent interoperability and licence review. If the candidate is
not admissible, stop at P4-D and supersede this ADR before selecting an
alternative.
