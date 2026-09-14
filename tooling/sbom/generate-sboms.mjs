#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv from "ajv";
import Ajv2020 from "ajv/dist/2020.js";

import { assert, main, readJson, sha256, stableJson } from "../lib/policy.mjs";

function deterministicUuid(hex) {
  const value = `${hex.slice(0, 12)}4${hex.slice(13, 16)}8${hex.slice(17, 32)}`;
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20, 32)}`;
}

function hashFromNode(node) {
  if (node.sha256) return { alg: "SHA-256", content: node.sha256 };
  if (node.artifact?.sha256) return { alg: "SHA-256", content: node.artifact.sha256 };
  if (node.integrity?.startsWith("sha512-")) {
    return { alg: "SHA-512", content: Buffer.from(node.integrity.slice(7), "base64").toString("hex") };
  }
  return null;
}

function cyclonedxComponent(node) {
  const component = {
    type: node.kind === "data" ? "data" : node.scope === "root" ? "application" : "library",
    "bom-ref": node.ref,
    name: node.name,
    version: node.version,
    licenses:
      node.license === "UNLICENSED" || node.license === "NOASSERTION"
        ? [{ license: { name: node.license } }]
        : [{ expression: node.license }],
    properties: [
      { name: "noeos:component:kind", value: node.kind },
      { name: "noeos:component:scope", value: node.scope },
      { name: "noeos:component:source", value: node.source },
    ],
  };
  if (node.purl) component.purl = node.purl;
  const hash = hashFromNode(node);
  if (hash) component.hashes = [hash];
  return component;
}

function generateCycloneDx(graph) {
  const graphDigest = sha256(stableJson(graph));
  const root = graph.nodes.find(({ ref }) => ref === graph.root);
  return {
    $schema: "https://cyclonedx.org/schema/bom-1.7.schema.json",
    bomFormat: "CycloneDX",
    specVersion: "1.7",
    serialNumber: `urn:uuid:${deterministicUuid(graphDigest)}`,
    version: 1,
    metadata: {
      component: cyclonedxComponent(root),
      properties: [
        { name: "noeos:component-graph:sha256", value: graphDigest },
        { name: "noeos:component-graph:completeness", value: "complete-for-P2-admitted-scope" },
      ],
    },
    components: graph.nodes.filter(({ ref }) => ref !== graph.root).map(cyclonedxComponent),
    dependencies: graph.nodes.map((node) => ({
      ref: node.ref,
      dependsOn: graph.edges
        .filter(({ from }) => from === node.ref)
        .map(({ to }) => to)
        .sort(),
    })),
  };
}

function spdxLicenseExpression(license) {
  return license === "UNLICENSED" || license === "NOASSERTION" ? "LicenseRef-Noeos-No-License-Grant" : license;
}

function generateSpdx(graph) {
  const creation = "_:creationinfo";
  const organization = "urn:noeos:organization";
  const document = "urn:noeos:spdx-document:p2";
  const sbom = "urn:noeos:spdx-sbom:p2";
  const elements = [
    { type: "Organization", spdxId: organization, creationInfo: creation, name: "Noeos" },
    {
      type: "CreationInfo",
      "@id": creation,
      specVersion: "3.0.1",
      createdBy: [organization],
      created: "1970-01-01T00:00:00Z",
    },
    {
      type: "SpdxDocument",
      spdxId: document,
      creationInfo: creation,
      profileConformance: ["core", "software", "simpleLicensing"],
      rootElement: [sbom],
    },
    {
      type: "software_Sbom",
      spdxId: sbom,
      creationInfo: creation,
      profileConformance: ["core", "software", "simpleLicensing"],
      rootElement: [graph.root],
    },
  ];
  const licenseRefs = new Map();
  for (const license of [...new Set(graph.nodes.map(({ license }) => spdxLicenseExpression(license)))].sort()) {
    const ref = `urn:noeos:license:${sha256(license).slice(0, 32)}`;
    licenseRefs.set(license, ref);
    elements.push({
      type: "simplelicensing_LicenseExpression",
      spdxId: ref,
      creationInfo: creation,
      simplelicensing_licenseExpression: license,
    });
  }
  for (const node of graph.nodes) {
    elements.push({
      type: "software_Package",
      spdxId: node.ref,
      creationInfo: creation,
      name: node.name,
      software_packageVersion: node.version,
      software_primaryPurpose: node.scope === "root" ? "application" : "library",
    });
    elements.push({
      type: "Relationship",
      spdxId: `urn:noeos:relationship:license:${sha256(node.ref).slice(0, 32)}`,
      creationInfo: creation,
      from: node.ref,
      to: [licenseRefs.get(spdxLicenseExpression(node.license))],
      relationshipType: "hasDeclaredLicense",
    });
  }
  for (const edge of graph.edges) {
    elements.push({
      type: "Relationship",
      spdxId: `urn:noeos:relationship:dependency:${sha256(`${edge.from}\0${edge.to}`).slice(0, 32)}`,
      creationInfo: creation,
      from: edge.from,
      to: [edge.to],
      relationshipType: "dependsOn",
    });
  }
  return { "@context": "https://spdx.org/rdf/3.0.1/spdx-context.jsonld", "@graph": elements };
}

function validateSpdxSemantics(spdx, graph) {
  const ids = spdx["@graph"].map((element) => element.spdxId ?? element["@id"]).filter(Boolean);
  assert(new Set(ids).size === ids.length, "SPDX_DUPLICATE_ID", "SPDX graph contains duplicate identifiers");
  const idSet = new Set(ids);
  const relationships = spdx["@graph"].filter(({ type }) => type === "Relationship");
  for (const relationship of relationships) {
    assert(
      idSet.has(relationship.from),
      "SPDX_DANGLING_RELATIONSHIP",
      `SPDX relationship source is absent: ${relationship.from}`,
    );
    assert(
      relationship.to.every((target) => idSet.has(target)),
      "SPDX_DANGLING_RELATIONSHIP",
      `SPDX relationship target is absent: ${relationship.to.join(",")}`,
    );
  }
  const dependencyRelationships = relationships.filter(({ relationshipType }) => relationshipType === "dependsOn");
  assert(
    dependencyRelationships.length === graph.edges.length,
    "SPDX_EDGE_RECONCILIATION",
    "SPDX dependency edge count differs from component graph",
  );
  const packages = spdx["@graph"].filter(({ type }) => type === "software_Package");
  assert(
    packages.length === graph.nodes.length,
    "SPDX_NODE_RECONCILIATION",
    "SPDX package count differs from component graph",
  );
}

export async function generateSboms(root, directory = path.join(root, ".cache/supply-chain")) {
  const graph = await readJson(path.join(directory, "component-graph.json"));
  const cycloneDx = generateCycloneDx(graph);
  const spdx = generateSpdx(graph);
  const cycloneSchema = await readJson(path.join(root, ".cache/admission/cyclonedx-bom-1.7.schema.json"));
  const cycloneAjv = new Ajv({ allErrors: true, strict: false, validateFormats: false });
  for (const filename of [
    "cyclonedx-spdx.schema.json",
    "cyclonedx-jsf-0.82.schema.json",
    "cyclonedx-cryptography-defs.schema.json",
  ]) {
    cycloneAjv.addSchema(await readJson(path.join(root, ".cache/admission", filename)));
  }
  const validateCyclone = cycloneAjv.compile(cycloneSchema);
  assert(validateCyclone(cycloneDx), "CYCLONEDX_SCHEMA", "CycloneDX SBOM violates the pinned official 1.7 schema", {
    errors: validateCyclone.errors,
  });
  const spdxSchema = await readJson(path.join(root, ".cache/admission/spdx-3.0.1.schema.json"));
  const validateSpdx = new Ajv2020({ allErrors: true, strict: false, validateFormats: false }).compile(spdxSchema);
  assert(validateSpdx(spdx), "SPDX_SCHEMA", "SPDX SBOM violates the pinned official 3.0.1 schema", {
    errors: validateSpdx.errors,
  });
  validateSpdxSemantics(spdx, graph);
  await mkdir(directory, { recursive: true });
  const cycloneBytes = stableJson(cycloneDx);
  const spdxBytes = stableJson(spdx);
  await writeFile(path.join(directory, "bom.cdx.json"), cycloneBytes, { mode: 0o600 });
  await writeFile(path.join(directory, "bom.spdx.json"), spdxBytes, { mode: 0o600 });
  return {
    componentGraphSha256: sha256(stableJson(graph)),
    componentCount: graph.nodes.length,
    dependencyEdgeCount: graph.edges.length,
    cycloneDx: {
      specVersion: "1.7",
      sha256: sha256(cycloneBytes),
      officialSchema: "71152f97948eeeca2fd4a1434a9d29aab35d377be11828b504d029dfeeb1925a",
    },
    spdx: {
      specVersion: "3.0.1",
      sha256: sha256(spdxBytes),
      officialSchema: "582c64e809d5b3ef9bd0c4de13a32391b47b0284a3e8d199569fb96f649234b1",
      semanticChecks: "internal-plus-pinned-SHACL",
    },
  };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main("sbom-generation", () => generateSboms(root));
