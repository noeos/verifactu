#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

import { assert, main, sha256, stableJson } from "../lib/policy.mjs";
import { generateContracts } from "../../internal/contract-generation/generate-contracts.mjs";

export function validateGeneratedDocument(actual, expected) {
  assert(
    stableJson(actual) === stableJson(expected),
    "STALE_OR_HAND_EDITED_GENERATED",
    "checked-in generated toolchain summary does not equal generator output",
  );
}

export async function expectedToolchainSummary(root) {
  const sourceBytes = await readFile(path.join(root, "config/toolchain/profiles.json"));
  const source = JSON.parse(sourceBytes);
  return {
    schemaVersion: 1,
    generator: "tooling/generation/check-generated.mjs",
    source: "config/toolchain/profiles.json",
    sourceSha256: sha256(sourceBytes),
    profiles: Object.entries(source.profiles).map(([id, profile]) => ({
      id,
      node: profile.node,
      npm: profile.npm,
      status: profile.status,
    })),
  };
}

export async function checkGenerated(root) {
  const expected = await expectedToolchainSummary(root);
  const actual = JSON.parse(await readFile(path.join(root, "config/generated/toolchain-summary.json"), "utf8"));
  validateGeneratedDocument(actual, expected);
  const regulatory = await generateContracts(root);
  const editionDirectory = path.join(root, "editions", regulatory.editionId);
  const expectedEditionFiles = [...regulatory.files.keys()].filter((relative) => !relative.startsWith("schemas/"));
  const actualEditionFiles = [];
  const walk = async (directory, base = directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(absolute, base);
      else if (entry.isFile()) actualEditionFiles.push(path.relative(base, absolute).split(path.sep).join("/"));
      else assert(false, "GENERATED_FILE_UNSAFE", `${absolute} is not a regular file`);
    }
  };
  await walk(editionDirectory);
  assert(
    stableJson(actualEditionFiles.sort()) === stableJson(expectedEditionFiles.sort()),
    "GENERATED_FILE_SET_MISMATCH",
    "candidate edition contains missing or unexpected generated files",
  );
  for (const [relative, expectedBytes] of regulatory.files) {
    const destination = relative.startsWith("schemas/")
      ? path.join(root, relative)
      : path.join(editionDirectory, relative);
    const actualBytes = await readFile(destination);
    assert(
      actualBytes.equals(expectedBytes),
      "STALE_OR_HAND_EDITED_GENERATED",
      `${relative} differs from generator output`,
    );
  }
  const schemaFiles = (await readdir(path.join(root, "schemas"))).sort();
  assert(
    stableJson(schemaFiles) ===
      stableJson([
        "README.md",
        "regulatory-catalogues-v1.schema.json",
        "regulatory-contract-bundle-v1.schema.json",
        "regulatory-edition-descriptor-v1.schema.json",
        "regulatory-field-constraints-v1.schema.json",
        "regulatory-schema-graph-v1.schema.json",
        "regulatory-soap-bindings-v1.schema.json",
      ]),
    "GENERATED_SCHEMA_FILE_SET_MISMATCH",
    "public schema directory contains an unadmitted file",
  );
  const validationPairs = [
    ["regulatory-contract-bundle-v1.schema.json", "contracts/runtime-contracts.json"],
    ["regulatory-edition-descriptor-v1.schema.json", "edition.json"],
    ["regulatory-schema-graph-v1.schema.json", "contracts/schema-graph.json"],
    ["regulatory-field-constraints-v1.schema.json", "contracts/field-constraints.json"],
    ["regulatory-catalogues-v1.schema.json", "contracts/catalogues.json"],
    ["regulatory-soap-bindings-v1.schema.json", "contracts/soap-bindings.json"],
  ];
  let strictSchemaNegativeCount = 0;
  let lifecycleSchemaCaseCount = 0;
  for (const [schemaName, documentPath] of validationPairs) {
    const schema = JSON.parse(await readFile(path.join(root, "schemas", schemaName), "utf8"));
    const document = JSON.parse(await readFile(path.join(editionDirectory, documentPath), "utf8"));
    const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: false });
    const validate = ajv.compile(schema);
    assert(validate(document), "GENERATED_CONTRACT_SCHEMA_INVALID", `${documentPath} violates ${schemaName}`, {
      errors: validate.errors,
    });
    const mutated = structuredClone(document);
    const nestedTargetFor = {
      "regulatory-contract-bundle-v1.schema.json": (value) => value.generator,
      "regulatory-edition-descriptor-v1.schema.json": (value) => value.sourceSnapshot,
      "regulatory-schema-graph-v1.schema.json": (value) => value.documents[0].document,
      "regulatory-field-constraints-v1.schema.json": (value) => value.schemas[0].elements[0],
      "regulatory-catalogues-v1.schema.json": (value) => value.catalogues[0],
      "regulatory-soap-bindings-v1.schema.json": (value) => value.wsdl.services[0].ports[0],
    };
    nestedTargetFor[schemaName](mutated).unexpected = true;
    assert(
      !validate(mutated),
      "GENERATED_CONTRACT_SCHEMA_PERMISSIVE",
      `${schemaName} accepted an unexpected nested property`,
    );
    strictSchemaNegativeCount += 1;
    if (schemaName === "regulatory-edition-descriptor-v1.schema.json") {
      const active = structuredClone(document);
      active.status = "active";
      active.creationAllowed = true;
      active.blockers = [];
      active.approval = {
        decisionId: "P3-SYNTHETIC-LIFECYCLE-APPROVAL",
        decidedAt: "2026-09-15T00:00:00Z",
        approverRole: "regulatory-owner",
        evidence: [{ path: "evidence/synthetic-approval.json", sha256: "0".repeat(64) }],
      };
      assert(validate(active), "EDITION_LIFECYCLE_SCHEMA_INVALID", "a complete active-edition shape was rejected", {
        errors: validate.errors,
      });
      lifecycleSchemaCaseCount += 1;
      const activeWithoutApproval = structuredClone(active);
      activeWithoutApproval.approval = null;
      assert(
        !validate(activeWithoutApproval),
        "EDITION_LIFECYCLE_SCHEMA_PERMISSIVE",
        "active edition omitted approval",
      );
      lifecycleSchemaCaseCount += 1;
      const candidateCreating = structuredClone(document);
      candidateCreating.creationAllowed = true;
      assert(!validate(candidateCreating), "EDITION_LIFECYCLE_SCHEMA_PERMISSIVE", "candidate enabled creation");
      lifecycleSchemaCaseCount += 1;
    }
  }
  return {
    generatedFileCount: 1 + regulatory.files.size,
    sourceSha256: expected.sourceSha256,
    regulatory: regulatory.evidence,
    byteIdenticalToGenerator: true,
    strictSchemaNegativeCount,
    lifecycleSchemaCaseCount,
  };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main("checked-in-generated-files", () => checkGenerated(root));
}
