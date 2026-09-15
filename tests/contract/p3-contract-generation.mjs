#!/usr/bin/env node
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateContracts, writeGeneratedContracts } from "../../internal/contract-generation/generate-contracts.mjs";
import { listCatalogues, openCatalogue } from "../../internal/contract-generation/catalogue-access.mjs";
import { PolicyFailure, assert, main, stableJson } from "../../tooling/lib/policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function hash(algorithm, bytes) {
  return createHash(algorithm).update(bytes).digest("hex");
}

async function expectCode(id, expectedCode, operation) {
  try {
    await operation();
  } catch (error) {
    assert(error instanceof PolicyFailure, "FIXTURE_WRONG_FAILURE", `${id} produced ${error}`);
    assert(
      error.code === expectedCode,
      "FIXTURE_WRONG_REASON",
      `${id} expected ${expectedCode}; observed ${error.code}`,
    );
    return id;
  }
  throw new PolicyFailure("FIXTURE_UNEXPECTED_PASS", `${id} unexpectedly passed`);
}

async function repositoryFixture(temporaryRoot, id) {
  const fixtureRoot = path.join(temporaryRoot, id);
  await mkdir(path.join(fixtureRoot, "config"), { recursive: true });
  await mkdir(path.join(fixtureRoot, "editions/source-snapshots"), { recursive: true });
  await mkdir(path.join(fixtureRoot, "internal/contract-generation"), { recursive: true });
  await cp(path.join(root, "config/regulatory"), path.join(fixtureRoot, "config/regulatory"), { recursive: true });
  await cp(path.join(root, "editions/source-snapshots"), path.join(fixtureRoot, "editions/source-snapshots"), {
    recursive: true,
  });
  await cp(
    path.join(root, "internal/contract-generation/catalogue-access.mjs"),
    path.join(fixtureRoot, "internal/contract-generation/catalogue-access.mjs"),
  );
  await cp(
    path.join(root, "internal/contract-generation/generate-contracts.mjs"),
    path.join(fixtureRoot, "internal/contract-generation/generate-contracts.mjs"),
  );
  await cp(
    path.join(root, "internal/contract-generation/xml-parser.mjs"),
    path.join(fixtureRoot, "internal/contract-generation/xml-parser.mjs"),
  );
  return fixtureRoot;
}

async function mutateSource(fixtureRoot, sourceId, transform, updateIdentity = true) {
  const [snapshotId] = await readdir(path.join(fixtureRoot, "editions/source-snapshots"));
  const manifestPath = path.join(fixtureRoot, "editions/source-snapshots", snapshotId, "source-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const source = manifest.sources.find(({ id }) => id === sourceId);
  assert(source, "FIXTURE_SOURCE_MISSING", sourceId);
  const sourcePath = path.join(fixtureRoot, "editions/source-snapshots", snapshotId, source.path);
  const changed = Buffer.from(transform((await readFile(sourcePath)).toString("utf8")));
  await writeFile(sourcePath, changed);
  if (updateIdentity) {
    source.bytes = changed.length;
    source.sha256 = hash("sha256", changed);
    source.sha512 = hash("sha512", changed);
    const manifestBytes = Buffer.from(stableJson(manifest));
    await writeFile(manifestPath, manifestBytes);
    const snapshotPath = path.join(fixtureRoot, "editions/source-snapshots", snapshotId, "snapshot.json");
    const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
    snapshot.sourceManifest.sha256 = hash("sha256", manifestBytes);
    snapshot.sourceClosureSha256 = hash(
      "sha256",
      Buffer.from(stableJson(manifest.sources.map(({ id, sha256, dependencies }) => ({ id, sha256, dependencies })))),
    );
    await writeFile(snapshotPath, stableJson(snapshot));
  }
}

async function run() {
  const expected = JSON.parse(
    await readFile(path.join(root, "fixtures/official/p3-contract-observations.json"), "utf8"),
  );
  const compatibility = JSON.parse(
    await readFile(path.join(root, "fixtures/compatibility/p3-contract-compatibility.json"), "utf8"),
  );
  const baseline = await generateContracts(root);
  for (const [field, value] of Object.entries(expected.expected)) {
    assert(
      baseline.evidence[field] === value,
      "OFFICIAL_OBSERVATION_DRIFT",
      `${field} expected ${value}; observed ${baseline.evidence[field]}`,
    );
  }
  const soap = JSON.parse(baseline.files.get("contracts/soap-bindings.json"));
  const catalogues = JSON.parse(baseline.files.get("contracts/catalogues.json"));
  const listedCatalogues = listCatalogues(catalogues);
  assert(
    listedCatalogues.length === expected.expected.catalogueCount,
    "CATALOGUE_ACCESS_COUNT",
    "catalogue listing differs",
  );
  const selectedCatalogue = openCatalogue(catalogues, listedCatalogues[0].targetNamespace, listedCatalogues[0].name);
  assert(
    Object.isFrozen(selectedCatalogue) && Object.isFrozen(selectedCatalogue.values),
    "CATALOGUE_ACCESS_MUTABLE",
    "catalogue view is mutable",
  );
  const observedSoap = {
    messages: soap.wsdl.messages.length,
    portTypes: soap.wsdl.portTypes.length,
    bindings: soap.wsdl.bindings.length,
    services: soap.wsdl.services.length,
    ports: soap.wsdl.services.reduce((count, service) => count + service.ports.length, 0),
  };
  assert(
    stableJson(observedSoap) === stableJson(compatibility.expectedSoap),
    "SOAP_COMPATIBILITY_DRIFT",
    "WSDL inventory differs",
  );
  const repeated = await generateContracts(root);
  for (const [relative, bytes] of baseline.files) {
    assert(
      bytes.equals(repeated.files.get(relative)),
      "GENERATOR_NONDETERMINISTIC",
      `${relative} differs between clean in-memory runs`,
    );
  }

  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "verifactu-contract-negative-"));
  const passed = ["official-observations", "catalogue-access", "soap-compatibility", "repeat-generation-byte-identity"];
  try {
    passed.push(await expectCode("immutable-edition", "IMMUTABLE_EDITION_EXISTS", () => writeGeneratedContracts(root)));
    passed.push(
      await expectCode("unknown-catalogue", "CATALOGUE_UNKNOWN", () =>
        openCatalogue(catalogues, "urn:noeos:absent", "Absent"),
      ),
    );
    let fixture = await repositoryFixture(temporaryRoot, "changed-input");
    await mutateSource(fixture, "AEAT-SUMINISTRO-LR-XSD", (text) => `${text}\n`, false);
    passed.push(await expectCode("changed-input", "GENERATOR_SOURCE_DRIFT", () => generateContracts(fixture)));

    fixture = await repositoryFixture(temporaryRoot, "source-manifest-drift");
    let [snapshotId] = await readdir(path.join(fixture, "editions/source-snapshots"));
    let manifestPath = path.join(fixture, "editions/source-snapshots", snapshotId, "source-manifest.json");
    const changedManifest = JSON.parse(await readFile(manifestPath, "utf8"));
    changedManifest.blockedSources[0].diagnostic += " changed";
    await writeFile(manifestPath, stableJson(changedManifest));
    passed.push(
      await expectCode("source-manifest-drift", "GENERATOR_SOURCE_MANIFEST_DRIFT", () => generateContracts(fixture)),
    );

    fixture = await repositoryFixture(temporaryRoot, "source-closure-drift");
    [snapshotId] = await readdir(path.join(fixture, "editions/source-snapshots"));
    const snapshotPath = path.join(fixture, "editions/source-snapshots", snapshotId, "snapshot.json");
    const changedSnapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
    changedSnapshot.sourceClosureSha256 = "0".repeat(64);
    await writeFile(snapshotPath, stableJson(changedSnapshot));
    passed.push(
      await expectCode("source-closure-drift", "GENERATOR_SOURCE_CLOSURE_DRIFT", () => generateContracts(fixture)),
    );

    fixture = await repositoryFixture(temporaryRoot, "unsupported-construct");
    await mutateSource(fixture, "AEAT-SUMINISTRO-LR-XSD", (text) => text.replace("</schema>", "<assertion/></schema>"));
    passed.push(
      await expectCode("unsupported-construct", "SCHEMA_CONSTRUCT_UNSUPPORTED", () => generateContracts(fixture)),
    );

    fixture = await repositoryFixture(temporaryRoot, "remote-import");
    await mutateSource(fixture, "AEAT-SUMINISTRO-LR-XSD", (text) =>
      text.replace('schemaLocation="SuministroInformacion.xsd"', 'schemaLocation="https://evil.invalid/schema.xsd"'),
    );
    passed.push(await expectCode("remote-import", "SCHEMA_REMOTE_IMPORT_FORBIDDEN", () => generateContracts(fixture)));

    fixture = await repositoryFixture(temporaryRoot, "path-traversal");
    await mutateSource(fixture, "AEAT-SUMINISTRO-LR-XSD", (text) =>
      text.replace('schemaLocation="SuministroInformacion.xsd"', 'schemaLocation="../../outside.xsd"'),
    );
    passed.push(await expectCode("path-traversal", "SCHEMA_IMPORT_PATH_FORBIDDEN", () => generateContracts(fixture)));

    fixture = await repositoryFixture(temporaryRoot, "missing-import");
    await mutateSource(fixture, "AEAT-SUMINISTRO-LR-XSD", (text) =>
      text.replace('schemaLocation="SuministroInformacion.xsd"', 'schemaLocation="Absent.xsd"'),
    );
    passed.push(await expectCode("missing-import", "SCHEMA_IMPORT_UNRESOLVED", () => generateContracts(fixture)));

    fixture = await repositoryFixture(temporaryRoot, "namespace-mismatch");
    await mutateSource(fixture, "AEAT-SUMINISTRO-LR-XSD", (text) =>
      text.replace(
        'namespace="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd"',
        'namespace="urn:noeos:wrong"',
      ),
    );
    passed.push(
      await expectCode("namespace-mismatch", "SCHEMA_IMPORT_NAMESPACE_MISMATCH", () => generateContracts(fixture)),
    );

    fixture = await repositoryFixture(temporaryRoot, "malformed-qname-value");
    await mutateSource(fixture, "AEAT-SUMINISTRO-LR-XSD", (text) =>
      text.replace('type="sf:CabeceraType"', 'type="sf:invalid:name"'),
    );
    passed.push(await expectCode("malformed-qname-value", "QNAME_LEXICAL_INVALID", () => generateContracts(fixture)));

    fixture = await repositoryFixture(temporaryRoot, "unexpected-doctype");
    await mutateSource(fixture, "AEAT-SUMINISTRO-LR-XSD", (text) => `<!DOCTYPE schema>${text}`);
    passed.push(await expectCode("unexpected-doctype", "XML_DOCTYPE_FORBIDDEN", () => generateContracts(fixture)));
    return {
      fixtureCount: passed.length,
      passed,
      sourceSnapshotId: expected.sourceSnapshotId,
      byteIdenticalGeneration: true,
      networkUsed: false,
    };
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

await main("p3-contract-generation", run);
