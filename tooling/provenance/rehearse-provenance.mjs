#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, main, readJson, sha256, stableJson, validateJsonFile } from "../lib/policy.mjs";

function validateStatement(statement, policy) {
  assert(statement._type === policy.statementType, "PROVENANCE_STATEMENT_TYPE", "wrong in-toto Statement type");
  assert(statement.predicateType === policy.predicateType, "PROVENANCE_PREDICATE_TYPE", "wrong SLSA predicate type");
  assert(
    statement.subject.length === 3 && statement.subject.every(({ digest }) => /^[0-9a-f]{64}$/.test(digest.sha256)),
    "PROVENANCE_SUBJECT",
    "rehearsal must bind exactly three tarballs by SHA-256",
  );
  assert(
    statement.predicate.buildDefinition.buildType === policy.buildType,
    "PROVENANCE_BUILD_TYPE",
    "wrong rehearsal build type",
  );
  assert(
    Object.keys(statement.predicate.buildDefinition.externalParameters).length > 0,
    "PROVENANCE_PARAMETERS",
    "external parameters are required",
  );
  assert(
    statement.predicate.buildDefinition.resolvedDependencies.length >= 4,
    "PROVENANCE_MATERIALS",
    "resolved dependencies are incomplete",
  );
  assert(
    statement.predicate.runDetails.builder.id === policy.builderId,
    "PROVENANCE_BUILDER",
    "wrong rehearsal builder identity",
  );
  assert(
    statement.predicate.noeos_rehearsal === true &&
      statement.predicate.noeos_signed === false &&
      statement.predicate.noeos_publishable === false &&
      statement.predicate.noeos_claimedSlsaLevel === "none",
    "PROVENANCE_OVERCLAIM",
    "P2 rehearsal must remain explicitly unsigned, non-publishable and level-less",
  );
  assert(
    statement.dsseEnvelope === undefined && statement.signature === undefined,
    "PROVENANCE_FAKE_SIGNATURE",
    "P2 rehearsal must not contain a signature or DSSE envelope",
  );
}

export async function rehearseProvenance(
  root,
  output = path.join(root, ".cache/supply-chain/provenance.rehearsal.intoto.json"),
) {
  const policy = await validateJsonFile(
    root,
    "config/provenance/rehearsal.json",
    "config/provenance/rehearsal.schema.json",
  );
  const packagePolicy = await validateJsonFile(
    root,
    "config/packages/content.json",
    "config/packages/content.schema.json",
  );
  const graph = await readJson(path.join(root, ".cache/supply-chain/component-graph.json"));
  const materials = [
    { uri: "git+https://github.com/noeos/verifactu", digest: { gitCommit: process.env.GITHUB_SHA ?? "uncommitted" } },
    { uri: "file:package-lock.json", digest: { sha256: sha256(await readFile(path.join(root, "package-lock.json"))) } },
    { uri: "file:.cache/supply-chain/component-graph.json", digest: { sha256: sha256(stableJson(graph)) } },
    {
      uri: "file:config/tasks/tasks.json",
      digest: { sha256: sha256(await readFile(path.join(root, "config/tasks/tasks.json"))) },
    },
  ];
  const subject = [];
  for (const contract of packagePolicy.packages) {
    subject.push({
      name: contract.tarball,
      digest: { sha256: sha256(await readFile(path.join(root, ".cache/packages", contract.tarball))) },
    });
  }
  subject.sort((left, right) => left.name.localeCompare(right.name, "en"));
  const statement = {
    _type: policy.statementType,
    subject,
    predicateType: policy.predicateType,
    predicate: {
      buildDefinition: {
        buildType: policy.buildType,
        externalParameters: {
          repository: "https://github.com/noeos/verifactu",
          task: "provenance:rehearsal",
          publication: false,
        },
        internalParameters: { networkAfterPreparation: "denied", secrets: "denied", sourceDateEpoch: "0" },
        resolvedDependencies: materials,
      },
      runDetails: {
        builder: { id: policy.builderId, version: { taskGraph: "1" } },
        metadata: {
          invocationId: process.env.GITHUB_RUN_ID
            ? `github:${process.env.GITHUB_RUN_ID}:${process.env.GITHUB_RUN_ATTEMPT ?? "1"}`
            : "local:untrusted-rehearsal",
        },
        byproducts: [
          {
            name: "bom.cdx.json",
            digest: { sha256: sha256(await readFile(path.join(root, ".cache/supply-chain/bom.cdx.json"))) },
          },
          {
            name: "bom.spdx.json",
            digest: { sha256: sha256(await readFile(path.join(root, ".cache/supply-chain/bom.spdx.json"))) },
          },
        ],
      },
      noeos_rehearsal: true,
      noeos_signed: policy.signed,
      noeos_publishable: policy.publishable,
      noeos_claimedSlsaLevel: policy.claimedSlsaLevel,
    },
  };
  validateStatement(statement, policy);
  await mkdir(path.dirname(output), { recursive: true });
  const bytes = stableJson(statement);
  await writeFile(output, bytes, { mode: 0o600 });
  const reread = await readJson(output);
  validateStatement(reread, policy);
  return {
    policyId: policy.policyId,
    subjectCount: subject.length,
    materialCount: materials.length,
    byproductCount: 2,
    signed: false,
    publishable: false,
    claimedSlsaLevel: "none",
    sha256: sha256(bytes),
  };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main("provenance-rehearsal", () => rehearseProvenance(root));
