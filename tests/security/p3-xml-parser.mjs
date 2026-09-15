#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseXml } from "../../internal/contract-generation/xml-parser.mjs";
import { PolicyFailure, assert, main } from "../../tooling/lib/policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

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

async function run() {
  const manifest = JSON.parse(await readFile(path.join(root, "fixtures/adversarial/p3-xml-cases.json"), "utf8"));
  const passed = [];
  for (const fixture of manifest.cases) {
    const bytes = await readFile(path.join(root, "fixtures/adversarial", fixture.path));
    passed.push(await expectCode(fixture.id, fixture.expectedCode, () => parseXml(bytes)));
  }
  const boundary = JSON.parse(await readFile(path.join(root, "fixtures/boundary/p3-xml-limits.json"), "utf8"));
  const boundaryCases = {
    "bytes-over-limit": () => parseXml(Buffer.from("<root/>"), { limits: { maximumBytes: 6 } }),
    "depth-over-limit": () =>
      parseXml(Buffer.from("<a><b><c/></b></a>"), {
        limits: { maximumDepth: 2 },
      }),
    "nodes-over-limit": () => parseXml(Buffer.from("<a><b/><c/></a>"), { limits: { maximumNodes: 2 } }),
    "attributes-over-limit": () =>
      parseXml(Buffer.from('<a x="1" y="2"/>'), {
        limits: { maximumAttributesPerElement: 1 },
      }),
    "text-over-limit": () => parseXml(Buffer.from("<a>1234</a>"), { limits: { maximumTextBytes: 3 } }),
  };
  for (const fixture of boundary.cases) {
    passed.push(await expectCode(fixture.id, fixture.expectedCode, boundaryCases[fixture.id]));
  }
  const synthetic = await readFile(path.join(root, "fixtures/synthetic/p3-namespace-qname.xml"));
  const parsed = parseXml(synthetic);
  assert(
    parsed.root.namespace === "http://www.w3.org/2001/XMLSchema",
    "FIXTURE_NAMESPACE_LOST",
    "root namespace differs",
  );
  assert(parsed.nodeCount === 5, "FIXTURE_NODE_COUNT", `expected five nodes; observed ${parsed.nodeCount}`);
  passed.push("namespace-qname-positive");
  return { fixtureCount: passed.length, passed, networkUsed: false };
}

await main("p3-hostile-xml-parser", run);
