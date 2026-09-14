#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

import { assert, main, readJson, sha256, stableJson, validateJsonFile } from "../lib/policy.mjs";

function nameFromLockPath(lockPath) {
  const suffix = lockPath.slice(lockPath.lastIndexOf("node_modules/") + "node_modules/".length);
  const parts = suffix.split("/");
  return parts[0].startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
}

function npmPurl(name, version) {
  return `pkg:npm/${name.startsWith("@") ? `%40${name.slice(1)}` : name}@${version}`;
}

function refFor(kind, identity) {
  return `urn:noeos:component:${kind}:${sha256(identity).slice(0, 32)}`;
}

function licenseFrom(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length === 1 && value[0]?.type === "Apache 2.0") return "Apache-2.0";
  return "NOASSERTION";
}

async function installedManifest(root, lockPath) {
  try {
    return await readJson(path.join(root, lockPath, "package.json"));
  } catch {
    return null;
  }
}

function resolveDependency(lock, aliases, sourcePath, dependencyName) {
  let current = sourcePath;
  while (true) {
    const candidate = path.posix.join(current, "node_modules", dependencyName);
    if (lock.packages[candidate]) return aliases.get(candidate) ?? candidate;
    if (!current) break;
    const parent = path.posix.dirname(current);
    current = parent === "." ? "" : parent;
  }
  return null;
}

export async function generateComponentGraph(
  root,
  output = path.join(root, ".cache/supply-chain/component-graph.json"),
) {
  const dependencyPolicy = await validateJsonFile(
    root,
    "config/admission/dependencies.json",
    "config/admission/dependencies.schema.json",
  );
  const actions = await validateJsonFile(root, "config/admission/actions.json", "config/admission/actions.schema.json");
  const external = await validateJsonFile(
    root,
    "config/admission/external-inputs.json",
    "config/admission/external-inputs.schema.json",
  );
  const toolchain = await validateJsonFile(
    root,
    "config/toolchain/profiles.json",
    "config/toolchain/profiles.schema.json",
  );
  const packages = await validateJsonFile(root, "config/packages/content.json", "config/packages/content.schema.json");
  const lockBytes = await readFile(path.join(root, "package-lock.json"));
  assert(
    sha256(lockBytes) === dependencyPolicy.lockfileSha256,
    "LOCKFILE_ADMISSION_DRIFT",
    "component graph input lock is not admitted",
  );
  const lock = JSON.parse(lockBytes);
  const aliases = new Map(
    Object.entries(lock.packages)
      .filter(([, metadata]) => metadata.link)
      .map(([lockPath, metadata]) => [lockPath, metadata.resolved]),
  );
  const keyToRef = new Map();
  const nodes = [];
  for (const [lockPath, metadata] of Object.entries(lock.packages)) {
    if (metadata.link) continue;
    const name = metadata.name ?? (lockPath.startsWith("node_modules/") ? nameFromLockPath(lockPath) : null);
    assert(name && metadata.version, "COMPONENT_IDENTITY_MISSING", `lock entry ${lockPath || "<root>"} lacks identity`);
    const installed = lockPath.startsWith("node_modules/") ? await installedManifest(root, lockPath) : null;
    const kind = lockPath === "" || lockPath.startsWith("packages/") ? "workspace" : "npm";
    const scope = lockPath === "" ? "root" : kind === "workspace" || !metadata.dev ? "runtime" : "development";
    const ref = refFor(kind, `${lockPath}\0${name}\0${metadata.version}`);
    keyToRef.set(lockPath, ref);
    const node = {
      ref,
      kind,
      name,
      version: metadata.version,
      scope,
      license:
        kind === "workspace"
          ? "UNLICENSED"
          : licenseFrom(metadata.license ?? installed?.license ?? installed?.licenses),
      source: lockPath || "package-lock.json#root",
      purl: npmPurl(name, metadata.version),
    };
    if (metadata.integrity) node.integrity = metadata.integrity;
    const artifactContract = packages.packages.find((candidate) => candidate.name === name);
    if (artifactContract) {
      const bytes = await readFile(path.join(root, ".cache/packages", artifactContract.tarball));
      node.artifact = { filename: artifactContract.tarball, sha256: sha256(bytes) };
    }
    nodes.push(node);
  }
  const edges = [];
  for (const [lockPath, metadata] of Object.entries(lock.packages)) {
    if (metadata.link) continue;
    const dependencies = {
      ...(metadata.dependencies ?? {}),
      ...(metadata.devDependencies ?? {}),
      ...(metadata.optionalDependencies ?? {}),
    };
    for (const dependency of Object.keys(dependencies).sort()) {
      const targetPath = resolveDependency(lock, aliases, lockPath, dependency);
      assert(
        targetPath && keyToRef.has(targetPath),
        "COMPONENT_EDGE_UNRESOLVED",
        `${lockPath || "<root>"} -> ${dependency} cannot be reconciled`,
      );
      edges.push({ from: keyToRef.get(lockPath), to: keyToRef.get(targetPath), relationship: "dependsOn" });
    }
  }
  for (const action of actions.actions) {
    nodes.push({
      ref: refFor("action", `${action.repository}@${action.sha}`),
      kind: "action",
      name: action.repository,
      version: action.sha,
      scope: "build",
      license: action.license,
      source: `config/admission/actions.json#${action.release}`,
      purl: `pkg:github/${action.repository}@${action.sha}`,
    });
  }
  for (const [profile, metadata] of Object.entries(toolchain.profiles)) {
    nodes.push({
      ref: refFor("tool", `node:${profile}:${metadata.node}`),
      kind: "tool",
      name: `node/${profile}`,
      version: metadata.node,
      scope: "build",
      license: "MIT",
      source: "config/toolchain/profiles.json",
    });
  }
  nodes.push({
    ref: refFor("tool", `typescript:${toolchain.typescript.version}`),
    kind: "tool",
    name: "typescript",
    version: toolchain.typescript.version,
    scope: "build",
    license: "Apache-2.0",
    source: "config/toolchain/profiles.json",
    purl: npmPurl("typescript", toolchain.typescript.version),
  });
  nodes.push({
    ref: refFor("tool", `python:${toolchain.pythonReference.version}`),
    kind: "tool",
    name: "python-reference",
    version: toolchain.pythonReference.version,
    scope: "build",
    license: "Python-2.0",
    source: "config/toolchain/profiles.json",
  });
  for (const input of external.inputs.filter(({ id }) => id !== "verification-engine-1.0.1")) {
    nodes.push({
      ref: refFor("data", input.id),
      kind: "data",
      name: input.id,
      version: input.id.match(/\d+(?:\.\d+)+/)?.[0] ?? "1",
      scope: "external-data",
      license: input.license,
      source: input.url,
      sha256: input.sha256,
    });
  }
  nodes.sort((left, right) => left.ref.localeCompare(right.ref, "en"));
  edges.sort((left, right) => `${left.from}\0${left.to}`.localeCompare(`${right.from}\0${right.to}`, "en"));
  assert(
    new Set(nodes.map(({ ref }) => ref)).size === nodes.length,
    "DUPLICATE_COMPONENT",
    "component refs must be unique",
  );
  const refs = new Set(nodes.map(({ ref }) => ref));
  assert(
    edges.every(({ from, to }) => refs.has(from) && refs.has(to)),
    "COMPONENT_EDGE_DANGLING",
    "component graph has a dangling edge",
  );
  const graph = {
    schemaVersion: 1,
    graphId: "COMPONENT-GRAPH-0001",
    sourceLockSha256: sha256(lockBytes),
    root: keyToRef.get(""),
    nodes,
    edges,
    omissions: [
      { class: "regulatory-editions", reason: "No regulatory edition is admitted before P3." },
      { class: "facturacion", reason: "Facturacion is not built and no integration artifact exists." },
    ],
  };
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, stableJson(graph), { mode: 0o600 });
  const schema = await readJson(path.join(root, "evidence/schemas/component-graph.schema.json"));
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  assert(validate(graph), "COMPONENT_GRAPH_SCHEMA", "component graph violates its schema", { errors: validate.errors });
  return {
    graphId: graph.graphId,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    graphSha256: sha256(stableJson(graph)),
    output: path.relative(root, output),
  };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main("component-graph", () => generateComponentGraph(root));
