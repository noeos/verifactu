// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { mkdir, open, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertProjectRoot, projectRoot, readJson, stableJson } from "./project.mjs";

await assertProjectRoot();
const manifest = await readJson(resolve(projectRoot, "regulatory/sources.json"));
const edition = manifest.edition;
const snapshot = resolve(projectRoot, "regulatory/snapshots", edition);
const raw = resolve(snapshot, "raw");
const mode = process.argv.includes("--offline") ? "offline" : "fetch";
if (mode === "fetch" && !process.argv.includes("--fetch")) {
  throw new Error("Regulatory import is explicit: pass --fetch or use --offline.");
}

const maxBytes = 64 * 1024 * 1024;
const maxRedirects = 2;
const timeoutMs = 30_000;
const approvedOrigin =
  "https://prewww2.aeat.es/static_files/common/internet/dep/aplicaciones/es/aeat/tikeV1.0/cont/ws/";
const artifacts = [...(manifest.artifacts ?? [])];
if (artifacts.length === 0) throw new Error("Regulatory manifest has no artifacts.");
if (manifest.baseUrl !== approvedOrigin) throw new Error("Unapproved regulatory origin.");
const allowedHostname = new URL(approvedOrigin).hostname;

await mkdir(raw, { recursive: true });
const provenance = [];
for (const artifact of artifacts) {
  const target = safeChild(raw, artifact.file);
  if (mode === "fetch") {
    const result = await downloadArtifact(artifact);
    assertDigest(artifact, result.bytes);
    // The bytes are bounded and digest-verified against the reviewed manifest before persistence.
    await writeVerifiedSnapshot(target, result.bytes);
    provenance.push({
      id: artifact.id,
      url: approvedArtifactUrl(artifact),
      status: result.status,
      mediaType: result.mediaType,
      bytes: result.bytes.length,
      sha256: digest(result.bytes, "sha256"),
      sha512: digest(result.bytes, "sha512"),
    });
  } else {
    const handle = await open(target, "r");
    const metadata = await handle.stat();
    if (!metadata.isFile()) {
      await handle.close();
      throw new Error(`Snapshot is not a regular file: ${artifact.file}`);
    }
    const bytes = await handle.readFile();
    await handle.close();
    if (bytes.length > maxBytes) throw new Error(`Snapshot exceeds limit: ${artifact.file}`);
    provenance.push({
      id: artifact.id,
      bytes: bytes.length,
      sha256: digest(bytes, "sha256"),
      sha512: digest(bytes, "sha512"),
    });
  }
}

if (mode === "fetch") {
  for (const item of provenance) {
    const expected = artifacts.find((artifact) => artifact.id === item.id);
    if (
      !expected ||
      expected.bytes !== item.bytes ||
      expected.sha256 !== item.sha256 ||
      expected.sha512 !== item.sha512
    ) {
      throw new Error(`Regulatory digest mismatch: ${item.id}`);
    }
  }
}

const names = (await readdir(raw, { withFileTypes: true }))
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .sort();
const expectedNames = artifacts.map((artifact) => artifact.file).sort();
if (JSON.stringify(names) !== JSON.stringify(expectedNames)) {
  throw new Error("Snapshot contains missing or unlisted artifacts.");
}
await mkdir(snapshot, { recursive: true });
await writeFile(
  resolve(snapshot, "manifest.json"),
  stableJson({ ...manifest, snapshotPath: `regulatory/snapshots/${edition}` }),
);
await writeFile(
  resolve(snapshot, "provenance.json"),
  stableJson({ edition, mode, artifacts: provenance }),
);
console.log(`Regulatory snapshot verified: ${edition}, ${artifacts.length} artifacts, ${mode}.`);

async function downloadArtifact(artifact) {
  // Resolve network destinations exclusively from the reviewed, compile-time allowlist below.
  // The manifest may tighten a digest or metadata, but cannot redirect this process to an
  // arbitrary endpoint. This also makes the network trust boundary explicit to static analysis.
  const url = approvedArtifactUrl(artifact);
  let current = new URL(url);
  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    if (current.protocol !== "https:") throw new Error(`HTTPS required: ${current.href}`);
    if (current.hostname !== allowedHostname)
      throw new Error(`Unapproved regulatory host: ${current.hostname}`);
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`Redirect without location: ${current.href}`);
      const next = new URL(location, current);
      if (next.hostname !== current.hostname || next.protocol !== "https:")
        throw new Error(`Unsafe redirect: ${next.href}`);
      current = next;
      continue;
    }
    if (!response.ok) throw new Error(`Source download failed ${response.status}: ${current.href}`);
    const length = Number(response.headers.get("content-length") ?? "0");
    if (length > maxBytes) throw new Error(`Source exceeds size limit: ${artifact.id}`);
    const body = response.body;
    if (!body) throw new Error(`Source has no body: ${artifact.id}`);
    const chunks = [];
    let total = 0;
    for await (const chunk of body) {
      total += chunk.byteLength;
      if (total > maxBytes) throw new Error(`Source exceeds size limit: ${artifact.id}`);
      chunks.push(Buffer.from(chunk));
    }
    const bytes = Buffer.concat(chunks);
    const mediaType = (response.headers.get("content-type") ?? "")
      .split(";", 1)[0]
      .trim()
      .toLowerCase();
    if (artifact.mediaType && mediaType && artifact.mediaType !== mediaType)
      throw new Error(`Unexpected media type for ${artifact.id}: ${mediaType}`);
    return { bytes, status: response.status, mediaType };
  }
  throw new Error(`Too many redirects: ${url}`);
}

function safeChild(root, filename) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(filename))
    throw new Error(`Unsafe regulatory filename: ${filename}`);
  const target = resolve(root, filename);
  if (!target.startsWith(`${root}/`)) throw new Error(`Unsafe regulatory filename: ${filename}`);
  return target;
}

function assertDigest(artifact, bytes) {
  if (
    artifact.bytes !== bytes.length ||
    artifact.sha256 !== digest(bytes, "sha256") ||
    artifact.sha512 !== digest(bytes, "sha512")
  )
    throw new Error(`Regulatory digest mismatch: ${artifact.id}`);
}

async function writeVerifiedSnapshot(target, bytes) {
  await writeFile(target, bytes, { mode: 0o644 });
}

function approvedArtifactUrl(artifact) {
  const path = (() => {
    switch (artifact.id) {
      case "AEAT-WSDL-SIF-1.0":
        return "SistemaFacturacion.wsdl";
      case "AEAT-XSD-SUMINISTRO-LR-1.0":
        return "SuministroLR.xsd";
      case "AEAT-XSD-RESPUESTA-SUMINISTRO-1.0":
        return "RespuestaSuministro.xsd";
      case "AEAT-XSD-CONSULTA-LR-1.0":
        return "ConsultaLR.xsd";
      case "AEAT-XSD-RESPUESTA-CONSULTA-LR-1.0":
        return "RespuestaConsultaLR.xsd";
      case "AEAT-XSD-SUMINISTRO-INFORMACION-1.0":
        return "SuministroInformacion.xsd";
      case "AEAT-XSD-EVENTOS-SIF-1.0":
        return "EventosSIF.xsd";
      case "AEAT-XSD-RESPUESTA-VALIDACION-NVF-1.0":
        return "RespuestaValRegistNoVeriFactu.xsd";
      default:
        throw new Error(`Unapproved regulatory artifact: ${artifact.id}`);
    }
  })();
  const url = `${approvedOrigin}${path}`;
  if (artifact.file !== path || (artifact.url !== undefined && artifact.url !== url))
    throw new Error(`Regulatory manifest URL mismatch: ${artifact.id}`);
  return url;
}

function digest(bytes, algorithm) {
  return createHash(algorithm).update(bytes).digest("hex");
}
