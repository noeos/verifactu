---
id: REG-DOC-0004
title: Official source register
status: draft
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
decisions: [ADR-0006, ADR-0009]
requirements: [REG-0010, REG-0011]
historical-inputs: [REV-004, REV-005, REV-006, REV-008, REV-012, REV-037, REV-039]
---

# Official source register

## Legal sources

| ID | Authority and current identity | Role | Volatility/review |
| --- | --- | --- | --- |
| `SRC-0010` | [Law 58/2003, General Tax Law](https://www.boe.es/eli/es/l/2003/12/17/58/con) | Arts. 29.2.j, 201 bis and applicable tax procedure/retention. | Monitor BOE amendments; preserve original publications. |
| `SRC-0011` | [Royal Decree 1007/2023 / RRSIF consolidated](https://www.boe.es/buscar/act.php?id=BOE-A-2023-24840) | Primary RRSIF regulatory behavior and current dates. | Monthly plus BOE alert; consolidated view is informative. |
| `SRC-0012` | [Royal Decree 254/2025](https://www.boe.es/eli/es/rd/2025/04/01/254) | Amendment to RD 1007/2023. | Immutable enactment. |
| `SRC-0013` | [Royal Decree-law 15/2025](https://www.boe.es/eli/es/rdl/2025/12/02/15) | Current 2027 adaptation dates. | Confirm validation/status and later amendments. |
| `SRC-0014` | [Order HAC/1177/2024](https://www.boe.es/buscar/act.php?id=BOE-A-2024-22138) | Detailed technical/functional/content obligations and annex. | Monthly plus amendments. |
| `SRC-0015` | [Royal Decree 1619/2012](https://www.boe.es/eli/es/rd/2012/11/30/1619/con) | Invoicing obligation/content and QR/URL relationship. | Monitor amendments and B2B e-invoice boundary. |
| `SRC-0027` | [Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj) | Personal-data principles, roles, rights, design/default and security. | Monitor EU amendments/guidance. |
| `SRC-0028` | [Organic Law 3/2018](https://www.boe.es/eli/es/lo/2018/12/05/3/con) | Spanish data-protection complement. | Monthly BOE monitoring. |
| `SRC-0077` | [Regulation (EU) 2024/2847 — Cyber Resilience Act](https://eur-lex.europa.eu/eli/reg/2024/2847/oj) | Product-specific applicability, manufacturer/open-source/commercial context, support and vulnerability/reporting obligations and phased dates. | Monitor EUR-Lex/implementing acts and obtain legal assessment before distribution; reporting provisions apply from 2026-09-11 and most provisions from 2027-12-11. |

## AEAT technical corpus

| ID | Official entry point | Required pinned artifacts |
| --- | --- | --- |
| `SRC-0016` | [SIF/VERI*FACTU portal and FAQ](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu.html) | FAQ version/update date, question hierarchy and referenced files. Last observed update: 2026-07-21. |
| `SRC-0017` | [Technical information index](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/informacion-tecnica.html) | Complete discovered artifact inventory and relationships. |
| `SRC-0018` | [Record designs](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/informacion-tecnica/disenos-registro.html) | Field designs, catalogues and applicable versions. |
| `SRC-0019` | AEAT WSDL section reached through `SRC-0017` | Every WSDL and imported dependency as bytes; service/port/operation/endpoints. |
| `SRC-0020` | AEAT Schemas section reached through `SRC-0017` | Every XSD/import/include as bytes and closed dependency graph. |
| `SRC-0021` | [Validation and error document](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/informacion-tecnica/documento-validaciones-errores.html) | Business validations, error/warning catalogue, dates and formats. |
| `SRC-0022` | Voluntary-remission/service specifications through `SRC-0017` | Protocol versions, batch/correlation/results/wait behavior and environments. |
| `SRC-0023` | [Hash specification](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/informacion-tecnica/algoritmo-calculo-codificacion-huella-hash.html) | Algorithm document, examples and exact selected fields/order/encoding. |
| `SRC-0024` | [Electronic-signature specification](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/informacion-tecnica/especificaciones-tecnicas-firma-electronica-registros-evento.html) | XAdES profile, algorithms, transforms, certificate and example archive. |
| `SRC-0025` | [QR/collation specification](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/informacion-tecnica/caracteristicas-qr-especificaciones-servicio-cotejo-factura.html) | Payload/URL, modality, encoding, symbol/rendering and service behavior. |
| `SRC-0026` | [Responsible-declaration examples](https://sede.agenciatributaria.gob.es/static_files/Sede/Tema/IVA/Verifactu/EjemplosDeclaracionResponsable%28V0.5.1%29.pdf) | Examples plus governing mandatory content; examples never override the order. |

## Engineering sources

| ID | Source/version | Adopted use |
| --- | --- | --- |
| `SRC-0029` | Noeos Verification Engine public contract 1.0.1 | Exact domain-neutral evidence/integrity boundary; local repository content is input, published artifact is release dependency. |
| `SRC-0030` | [ISO/IEC/IEEE 29148:2018](https://www.iso.org/standard/72089.html) | Requirements process/completeness guidance; no certification claim. |
| `SRC-0031` | [ISO/IEC 25010:2023](https://www.iso.org/standard/78176.html) | Nine-characteristic product-quality coverage. |
| `SRC-0032` | [NIST SP 800-218 SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final) | Secure-development lifecycle mapping. |
| `SRC-0033` | [OWASP SAMM 2](https://owaspsamm.org/model/) | Governance/design/implementation/verification/operations practice coverage. |
| `SRC-0034` | [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/releases/tag/v5.0.0) | Versioned applicable security requirement mapping. |
| `SRC-0035` | [OWASP XML Security](https://cheatsheetseries.owasp.org/cheatsheets/XML_Security_Cheat_Sheet.html) | XML/XXE/schema/signature threat inputs. |
| `SRC-0036` | [Node.js stream/backpressure guidance](https://nodejs.org/learn/modules/backpressuring-in-streams) | Bounded streaming design and tests. |
| `SRC-0037` | [Google SRE SLO guidance](https://sre.google/sre-book/service-level-objectives/) | SLI/distribution/error/saturation methodology, scoped to owned behavior. |
| `SRC-0038` | [HdrHistogram](https://github.com/HdrHistogram/HdrHistogram) | Coordinated-omission-aware latency evidence. |
| `SRC-0039` | [ISO/IEC/IEEE 42010:2022](https://www.iso.org/standard/74393.html) | Architecture-description concerns, viewpoints, model kinds and correspondence discipline; no certification claim. |
| `SRC-0040` | [C4 model](https://c4model.com/diagrams) | Context/container/component/dynamic/deployment communication notation; never a conformance oracle. |
| `SRC-0041` | [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12) | Public interchange-schema dialect, vocabulary and strict validation design. |
| `SRC-0042` | [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) | JSON interoperability constraints for duplicate names, Unicode and numbers. |
| `SRC-0043` | [W3C XML Signature 1.1](https://www.w3.org/TR/xmldsig-core/) | XMLDSig syntax/processing and limits of the signature trust claim. |
| `SRC-0044` | [W3C Canonical XML 1.1](https://www.w3.org/TR/xml-c14n11/) | Standards-conforming XML canonicalization semantics. |
| `SRC-0045` | [ETSI EN 319 132-1 V1.3.1](https://www.etsi.org/deliver/etsi_en/319100_319199/31913201/01.03.01_60/en_31913201v010301p.pdf) | XAdES building blocks/baseline reference, subordinate to the pinned AEAT profile. |
| `SRC-0046` | [European Commission DSS](https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467109107/Digital+Signature+Service+-+DSS) | Candidate/reference XAdES and certificate-validation capability; public demo is forbidden as a production dependency. |
| `SRC-0047` | [W3C SOAP 1.1](https://www.w3.org/TR/SOAP/) and [WSDL 1.1](https://www.w3.org/TR/wsdl.html) | Generic message and binding semantics, subordinate to pinned AEAT WSDL/XSD. |
| `SRC-0048` | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) | HTTP representation, TLS authority, method idempotency and retry semantics. |
| `SRC-0049` | [AWS transactional outbox guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html) | Informative dual-write, ordering and duplicate/idempotency failure model. |
| `SRC-0050` | [Node.js packages](https://nodejs.org/api/packages.html), [streams](https://nodejs.org/api/stream.html), [filesystem](https://nodejs.org/api/fs.html) and [crypto](https://nodejs.org/api/crypto.html) | Supported-runtime package, resource ownership, cancellation and provider behavior, pinned later to the toolchain matrix. |
| `SRC-0051` | [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html) and [locking clauses](https://www.postgresql.org/docs/current/sql-select.html) | Illustrative adapter semantics and anomaly inputs; does not impose PostgreSQL on hosts. |
| `SRC-0052` | [GitHub security hardening for Actions](https://docs.github.com/en/code-security/tutorials/secure-your-organization/protect-against-threats) | Least-privilege workflow permissions, full-commit Action pinning and compromise-impact controls. |
| `SRC-0053` | [GitHub ruleset rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) | Branch/tag target, pull-request, signature, history and required-workflow/check behavior; effective state must be read back through the API. |
| `SRC-0054` | [GitHub commit signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification) | Verified-signature semantics and the distinction between author signatures and GitHub-created merge/squash signatures. |
| `SRC-0055` | [Developer Certificate of Origin 1.1](https://developercertificate.org/) and [DCO GitHub App](https://github.com/apps/dco) | Rights-attestation text and candidate PR commit/trailer enforcement; DCO remains separate from cryptographic identity. |
| `SRC-0056` | [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) | OIDC publisher constraints, eligible runners/toolchains and npm provenance behavior; actual publication authorization belongs to release planning. |
| `SRC-0057` | [SLSA specification 1.2](https://slsa.dev/spec/v1.2/) and [Build track](https://slsa.dev/spec/v1.2/build-track-basics) | Provenance model and honest Build L2/L3 claim boundary. |
| `SRC-0058` | [GitHub artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations) | Subject-digest attestations, OIDC/permission boundary and downstream verification. |
| `SRC-0059` | [SPDX 3.0.1 serializations](https://spdx.github.io/spdx-spec/v3.0.1/serializations/) | SPDX JSON-LD structural and semantic conformance requirements. |
| `SRC-0060` | [CycloneDX JSON schema 1.7](https://cyclonedx.org/docs/1.7/json/) and [SBOM lifecycle resources](https://cyclonedx.org/guides/sbom/lifecycle_phases/) | CycloneDX 1.7 component/dependency/service modelling and lifecycle usage. |
| `SRC-0061` | [Reproducible Builds documentation](https://reproducible-builds.org/docs/) | Build-path, time, ordering and environment normalization threat catalogue and reproducibility methods. |
| `SRC-0062` | [OpenSSF Scorecard](https://github.com/ossf/scorecard) | Versioned repository-risk signal and machine output; never standalone proof that controls are closed. |
| `SRC-0063` | [Node.js release schedule](https://nodejs.org/en/about/previous-releases) and official [24.x](https://nodejs.org/download/release/latest-v24.x/), [22.x](https://nodejs.org/download/release/latest-v22.x/) and [Current](https://nodejs.org/dist/latest/) indexes | Volatile runtime-support/toolchain evidence; exact binaries require authenticated checksums and admission. |
| `SRC-0064` | [TypeScript 5.9 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html) | Candidate compiler-baseline semantics, subordinate to locked package and compatibility evidence. |
| `SRC-0065` | [StrykerJS](https://github.com/stryker-mutator/stryker-js) | Candidate real code-mutation engine and upstream behavior; adoption requires dependency/tool admission and executable negative fixtures. |
| `SRC-0066` | [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) | Public version precedence and compatibility baseline; regulatory editions remain a separate dimension. |
| `SRC-0067` | [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) | Human-readable change categories and unreleased/released history; informative, not a compatibility oracle. |
| `SRC-0068` | [npm provenance statements](https://docs.npmjs.com/generating-provenance-statements) | npm provenance generation/eligibility and consumer-visible attestation behavior. |
| `SRC-0069` | [npm dist-tags](https://docs.npmjs.com/adding-dist-tags-to-packages), [deprecation](https://docs.npmjs.com/deprecating-and-undeprecating-packages-or-package-versions) and [unpublish policy](https://docs.npmjs.com/policies/unpublish) | Registry channel, warning and exceptional removal semantics; versions remain immutable. |
| `SRC-0070` | [npm organization-scoped packages](https://docs.npmjs.com/creating-and-publishing-an-organization-scoped-package) | Public scoped-package ownership/access preflight and namespace behavior. |
| `SRC-0071` | [GitHub releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) and [immutable releases](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/immutable-releases) | Release/tag/assets identity and platform immutability control where available and verified. |
| `SRC-0072` | [GitHub Actions environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments) | Deployment branch/tag policy, secrets, reviewers and environment protection semantics. |
| `SRC-0073` | [GitHub private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository) and [repository security advisories](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/about-repository-security-advisories) | Confidential intake, coordinated remediation/advisory and CVE-capable publication workflow. |
| `SRC-0074` | [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final) | Current incident-response lifecycle integrated with cybersecurity risk management. |
| `SRC-0075` | [CVSS v4.0 specification](https://www.first.org/cvss/v4.0/specification-document) | Reproducible technical severity vector; business/regulatory urgency remains separate. |
| `SRC-0076` | [OpenSSF OSV schema](https://ossf.github.io/osv-schema/) | Machine-readable affected/fixed package-version and advisory identity model. |
| `SRC-0078` | [NIST SP 800-30 Rev. 1](https://csrc.nist.gov/pubs/sp/800/30/r1/final) | Structured likelihood/impact/risk assessment and uncertainty. |
| `SRC-0079` | [NIST SP 800-161 Rev. 1](https://csrc.nist.gov/pubs/sp/800/161/r1/final) | Cybersecurity supply-chain risk and lifecycle/response inputs. |
| `SRC-0080` | [RFC 9116 — security.txt](https://www.rfc-editor.org/rfc/rfc9116) | Standard public vulnerability-contact discovery; repository SECURITY policy remains authoritative. |
| `SRC-0081` | [OpenSSF OSPS Baseline](https://baseline.openssf.org/) | Versioned open-source project security-control mapping and maturity gaps; no blanket certification claim. |
| `SRC-0082` | [CISA Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) | Exploitation-aware prioritization signal when applicable; not a substitute for reachability/impact analysis. |
| `SRC-0083` | [OpenSSF Best Practices Badge](https://www.bestpractices.dev/en) | External project-practice self-assessment and badge evidence; unanswered or unmet criteria remain visible. |

## Record requirements

The machine register adds publisher, exact title, jurisdiction, authority role,
publication/effective/observed dates, version indicators, final resolved URI,
HTTP metadata, media type, byte length, SHA-256/SHA-512, licence/redistribution,
signature if supplied, dependencies, supersession and affected IDs. A source is
not `pinned` until bytes and dependency closure are reproducibly verified.
