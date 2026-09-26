import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile, spawnSync } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolve } from "node:path";
import {
  encodeRequest,
  DSS_JVM_OPTIONS,
  minimalEnvironment,
  spawnDssBridge,
} from "../../internal/xades-provider/worker.mjs";

const request = {
  command: "VERIFY",
  editionId: "edition",
  profileId: "profile",
  targetName: "RegistroAlta",
  artifactDigestSha256: "0".repeat(64),
  artifactBytes: new Uint8Array([1]),
  signerCertificateDer: new Uint8Array(),
  certificateChainDer: [],
  trustAnchorsDer: [],
  crlEvidence: [],
  ocspEvidence: [],
  signatureBytes: new Uint8Array(),
};

const javacExecutable = process.env.JAVA_HOME
  ? join(
      process.env.JAVA_HOME,
      "bin",
      process.platform === "win32" ? "javac.exe" : "javac",
    )
  : process.platform === "win32"
    ? "javac.exe"
    : "javac";

test("bridge encoder rejects unknown commands and malformed evidence lists", () => {
  assert.equal(encodeRequest({ ...request, command: "SHELL" }), null);
  assert.equal(encodeRequest({ ...request, crlEvidence: ["not bytes"] }), null);
  assert.equal(
    encodeRequest({
      ...request,
      ocspEvidence: Array.from({ length: 33 }, () => new Uint8Array([1])),
    }),
    null,
  );
});

test("bridge encoder serializes a bounded request using strict base64 lines", () => {
  const encoded = encodeRequest(request);
  assert.ok(encoded instanceof Uint8Array);
  const lines = new TextDecoder().decode(encoded).trimEnd().split("\n");
  assert.ok(lines.length >= 17);
  assert.ok(lines.every((line) => /^(?:[A-Za-z0-9+/]*={0,2})$/u.test(line)));
});

test("bridge child environment excludes unrelated parent secrets", () => {
  const key = "VERIFACTU_XADES_TEST_SECRET";
  const previous = process.env[key];
  process.env[key] = "must-not-cross-process-boundary";
  try {
    assert.equal(
      Object.hasOwn(minimalEnvironment(), key),
      false,
      "P4-CB-041 child environment allowlist assertion",
    );
  } finally {
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  }
});

test("DSS JVM enables the process network-deny policy", () => {
  assert.ok(DSS_JVM_OPTIONS.includes("-Djava.security.manager=allow"));
  assert.ok(DSS_JVM_OPTIONS.includes("-Djava.net.useSystemProxies=false"));
});

function runRawBridge(input) {
  const javaExecutable =
    process.env.VERIFACTU_JAVA ??
    (process.platform === "win32" ? "java.exe" : "java");
  const jarPath =
    process.env.VERIFACTU_DSS_JAR ??
    resolve(
      "internal/xades-provider/dss/target/verifactu-xades-provider-0.0.0-development.jar",
    );
  const jacocoArgs = jacocoJvmOptions();
  return spawnSync(
    javaExecutable,
    [
      ...DSS_JVM_OPTIONS,
      ...jacocoArgs,
      "-cp",
      jarPath,
      "eu.noeos.verifactu.bridge.DssBridge",
    ],
    { input, encoding: "utf8", timeout: 10_000, maxBuffer: 4_096 },
  );
}

function jacocoJvmOptions() {
  const agent = process.env.VERIFACTU_JACOCO_AGENT;
  const destination = process.env.VERIFACTU_JACOCO_DESTFILE;
  if (agent === undefined && destination === undefined) return [];
  if (
    typeof agent !== "string" ||
    typeof destination !== "string" ||
    /[,\r\n\u0000]/u.test(agent) ||
    /[,\r\n\u0000]/u.test(destination)
  )
    throw new Error("invalid JaCoCo instrumentation configuration");
  return [
    `-javaagent:${agent}=destfile=${destination},append=true,includes=eu.noeos.verifactu.bridge.*`,
  ];
}

test("Java bridge turns malformed wire data into a bounded defect response", () => {
  const result = runRawBridge(Buffer.from("bm90LXByb3RvY29s\n", "ascii"));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^VERIFACTU-DSS-1\nDEFECT\nDIAG-XADES-BRIDGE\n/u);
});

test("Java bridge rejects over-budget wire input before decoding the payload", () => {
  const input = Buffer.alloc(24_000_001, 0x41);
  const result = runRawBridge(input);
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /^VERIFACTU-DSS-1\nLIMIT\nDIAG-XADES-REQUEST-BYTES\n/u,
  );
});

function rawWireRequest(overrides = {}) {
  const artifactBytes = overrides.artifactBytes ?? new Uint8Array([1]);
  const digest = createHash("sha256").update(artifactBytes).digest("hex");
  const chain = overrides.certificateChainDer ?? [];
  const anchors = overrides.trustAnchorsDer ?? [];
  const crls = overrides.crlEvidence ?? [];
  const ocsps = overrides.ocspEvidence ?? [];
  const fields = [
    overrides.protocol ?? "VERIFACTU-DSS-1",
    overrides.command ?? "VERIFY",
    overrides.editionId ?? "rrsif-2026-09-21-authoritative-candidate",
    overrides.profileId ?? "AEAT-XADES-EPES-v0.1.5",
    overrides.targetName ?? "RegistroAlta",
    overrides.artifactDigestSha256 ?? digest,
    String(overrides.signingTimeMs ?? 1_738_620_000_000),
    String(overrides.validationTimeMs ?? 1_738_620_000_000),
    String(overrides.maximumRevocationAgeSeconds ?? 86_400),
    overrides.expectedSignerFingerprintSha256 ?? "",
    artifactBytes,
    overrides.signerCertificateDer ?? new Uint8Array(),
    String(chain.length),
    ...chain,
    overrides.signatureBytes ?? new Uint8Array(),
    String(anchors.length),
    ...anchors,
    String(crls.length),
    ...crls,
    String(ocsps.length),
    ...ocsps,
  ];
  return Buffer.from(
    fields
      .map((field) => Buffer.from(field).toString("base64") + "\n")
      .join(""),
    "ascii",
  );
}

test("Java bridge fails closed across invalid command, digest, signing and XML request paths", () => {
  const cases = [
    {
      name: "unknown command",
      request: { command: "EXEC" },
      kind: "INVALID",
      diagnostic: "DIAG-XADES-COMMAND",
    },
    {
      name: "wrong digest",
      request: { artifactDigestSha256: "f".repeat(64) },
      kind: "INVALID",
      diagnostic: "DIAG-XADES-DIGEST",
    },
    {
      name: "missing signing certificate",
      request: { command: "SIGN_PREPARE" },
      kind: "INVALID",
      diagnostic: "DIAG-XADES-CERTIFICATE",
    },
    {
      name: "short signing value",
      request: {
        command: "SIGN_COMPLETE",
        signerCertificateDer: new Uint8Array([1]),
        signatureBytes: new Uint8Array([2]),
      },
      kind: "INVALID",
      diagnostic: "DIAG-XADES-SIGNATURE",
    },
    {
      name: "bad explicit signing interval",
      request: {
        command: "SIGN_PREPARE",
        signerCertificateDer: new Uint8Array([1]),
        signingTimeMs: 2,
        validationTimeMs: 1,
      },
      kind: "INVALID",
      diagnostic: "DIAG-XADES-REQUEST",
    },
    {
      name: "zero revocation age",
      request: {
        command: "SIGN_PREPARE",
        signerCertificateDer: new Uint8Array([1]),
        maximumRevocationAgeSeconds: 0,
      },
      kind: "INVALID",
      diagnostic: "DIAG-XADES-REQUEST",
    },
    {
      name: "excessive revocation age",
      request: {
        command: "SIGN_PREPARE",
        signerCertificateDer: new Uint8Array([1]),
        maximumRevocationAgeSeconds: 172_801,
      },
      kind: "INVALID",
      diagnostic: "DIAG-XADES-REQUEST",
    },
    {
      name: "oversized signature value",
      request: {
        command: "SIGN_COMPLETE",
        signerCertificateDer: new Uint8Array([1]),
        signatureBytes: new Uint8Array(1_025),
      },
      kind: "INVALID",
      diagnostic: "DIAG-XADES-SIGNATURE",
    },
    {
      name: "wrong unsigned target",
      request: {
        command: "SIGN_PREPARE",
        signerCertificateDer: new Uint8Array([1]),
        artifactBytes: new TextEncoder().encode("<Other/>"),
      },
      kind: "INVALID",
      diagnostic: "DIAG-XADES-TARGET",
    },
    {
      name: "malformed signing XML",
      request: {
        command: "SIGN_PREPARE",
        signerCertificateDer: new Uint8Array([1]),
        artifactBytes: new TextEncoder().encode("<RegistroAlta>"),
      },
      kind: "INVALID",
      diagnostic: "DIAG-XADES-XML",
    },
    {
      name: "malformed verification XML",
      request: { artifactBytes: new TextEncoder().encode("<RegistroAlta>") },
      kind: "INVALID",
      diagnostic: "NONE",
      reportDiagnostic: "DIAG-XADES-XML",
    },
    {
      name: "wrong XML root profile",
      request: { artifactBytes: new TextEncoder().encode("<Other/>") },
      kind: "INVALID",
      diagnostic: "NONE",
      reportDiagnostic: "DIAG-XADES-PROFILE",
    },
  ];
  for (const item of cases) {
    const result = runRawBridge(rawWireRequest(item.request));
    assert.equal(result.status, 0, `${item.name}: ${result.stderr}`);
    assert.match(
      result.stdout,
      new RegExp(
        `^VERIFACTU-DSS-1\\n${item.kind}\\n${item.diagnostic}\\n`,
        "u",
      ),
      item.name,
    );
    if (item.reportDiagnostic) {
      const report = Buffer.from(
        result.stdout.trimEnd().split("\n")[3],
        "base64",
      )
        .toString("ascii")
        .split("\t");
      assert.equal(report[12], item.reportDiagnostic, item.name);
    }
  }
});

test("Java bridge enforces every top-level request identity and artifact bound", () => {
  const tooLarge = new Uint8Array(8_388_609);
  const cases = [
    { name: "wrong protocol", request: { protocol: "VERIFACTU-DSS-0" } },
    { name: "wrong edition", request: { editionId: "other-edition" } },
    { name: "wrong profile", request: { profileId: "other-profile" } },
    { name: "wrong target", request: { targetName: "OtherTarget" } },
    { name: "empty artifact", request: { artifactBytes: new Uint8Array() } },
    { name: "oversized artifact", request: { artifactBytes: tooLarge } },
  ];
  for (const item of cases) {
    const result = runRawBridge(rawWireRequest(item.request));
    assert.equal(result.status, 0, `${item.name}: ${result.stderr}`);
    assert.match(
      result.stdout,
      /^VERIFACTU-DSS-1\nINVALID\nDIAG-XADES-REQUEST\n/u,
      item.name,
    );
  }
});

test("Java XML parser enforces depth, node, attribute and expanded-text limits", () => {
  const nested = `${"<n>".repeat(65)}x${"</n>".repeat(65)}`;
  const tooManyNodes = `<r>${"<n/>".repeat(100_000)}</r>`;
  const tooManyAttributes = `<r ${Array.from({ length: 4_097 }, (_, i) => `a${i}="x"`).join(" ")}/>`;
  const tooMuchText = `<r>${"x".repeat(2_097_153)}</r>`;
  for (const [name, xml] of [
    ["depth", nested],
    ["nodes", tooManyNodes],
    ["attributes", tooManyAttributes],
    ["expanded text", tooMuchText],
  ]) {
    const result = runRawBridge(
      rawWireRequest({ artifactBytes: new TextEncoder().encode(xml) }),
    );
    assert.equal(result.status, 0, `${name}: ${result.stderr}`);
    assert.match(
      result.stdout,
      /^VERIFACTU-DSS-1\nLIMIT\nDIAG-XADES-REQUEST-BYTES\n/u,
      name,
    );
  }
});

test("Java XML parser traverses bounded comments, text, CDATA and nested elements", () => {
  const xml = new TextEncoder().encode(
    "<RegistroAlta><!-- comment --><n>text<![CDATA[cdata]]><leaf/></n></RegistroAlta>",
  );
  const result = runRawBridge(rawWireRequest({ artifactBytes: xml }));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^VERIFACTU-DSS-1\nINVALID\nNONE\n/u);
  const report = Buffer.from(result.stdout.trimEnd().split("\n")[3], "base64")
    .toString("ascii")
    .split("\t");
  assert.equal(report[12], "DIAG-XADES-PROFILE");
});

test("Java bridge rejects malformed and excessive certificate/revocation evidence", () => {
  const oneMegabyte = new Uint8Array(1_048_576);
  const cases = [
    {
      name: "too many chain certificates",
      request: {
        certificateChainDer: Array.from(
          { length: 17 },
          () => new Uint8Array([1]),
        ),
      },
    },
    {
      name: "too many evidence items",
      request: {
        trustAnchorsDer: Array.from({ length: 17 }, () => new Uint8Array([1])),
      },
    },
    {
      name: "empty trust certificate",
      request: { trustAnchorsDer: [new Uint8Array()] },
    },
    {
      name: "oversized signer certificate",
      request: { signerCertificateDer: new Uint8Array(1_048_577) },
    },
    {
      name: "oversized trust certificate",
      request: { trustAnchorsDer: [new Uint8Array(1_048_577)] },
    },
    { name: "empty CRL", request: { crlEvidence: [new Uint8Array()] } },
    {
      name: "empty OCSP response",
      request: { ocspEvidence: [new Uint8Array()] },
    },
    {
      name: "combined evidence ceiling",
      request: {
        trustAnchorsDer: Array.from({ length: 9 }, () => oneMegabyte),
      },
    },
  ];
  for (const item of cases) {
    const result = runRawBridge(rawWireRequest(item.request));
    assert.equal(result.status, 0, `${item.name}: ${result.stderr}`);
    assert.match(
      result.stdout,
      /^VERIFACTU-DSS-1\nLIMIT\nDIAG-XADES-EVIDENCE-BYTES\n/u,
      item.name,
    );
  }
});

test("Java bridge installs a policy that denies socket permissions at runtime", async () => {
  const directory = await mkdtemp(
    join(tmpdir(), "verifactu-dss-network-deny-"),
  );
  const source = join(directory, "NetworkDeniedProbe.java");
  const jarPath =
    process.env.VERIFACTU_DSS_JAR ??
    resolve(
      "internal/xades-provider/dss/target/verifactu-xades-provider-0.0.0-development.jar",
    );
  try {
    await writeFile(
      source,
      'import eu.noeos.verifactu.bridge.DssBridge; import java.io.*; import java.net.*; public final class NetworkDeniedProbe { @SuppressWarnings("removal") public static void main(String[] args) { System.setIn(new ByteArrayInputStream(new byte[0])); DssBridge.main(new String[0]); try { System.getSecurityManager().checkPermission(new SocketPermission("127.0.0.1:9", "connect,resolve")); System.out.print("NETWORK-ALLOWED"); } catch (SecurityException denied) { System.out.print("NETWORK-DENIED"); } } }\n',
    );
    await promisify(execFile)(javacExecutable, [
      "--release",
      "21",
      "-cp",
      jarPath,
      "-d",
      directory,
      source,
    ]);
    const separator = process.platform === "win32" ? ";" : ":";
    const javaExecutable =
      process.env.VERIFACTU_JAVA ??
      (process.platform === "win32" ? "java.exe" : "java");
    const result = spawnSync(
      javaExecutable,
      [
        "-Djava.security.manager=allow",
        ...jacocoJvmOptions(),
        "-cp",
        `${directory}${separator}${jarPath}`,
        "NetworkDeniedProbe",
      ],
      { encoding: "utf8", timeout: 10_000, maxBuffer: 4_096 },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /NETWORK-DENIED/u);
    assert.doesNotMatch(result.stdout, /NETWORK-ALLOWED/u);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("bridge process applies deadline and cancellation, with a minimal environment", async () => {
  const directory = await mkdtemp(join(tmpdir(), "verifactu-dss-worker-"));
  const source = join(directory, "eu/noeos/verifactu/bridge/DssBridge.java");
  const classPath = join(directory, "classes");
  try {
    await mkdir(join(directory, "eu/noeos/verifactu/bridge"), {
      recursive: true,
    });
    await mkdir(classPath);
    await writeFile(
      source,
      "package eu.noeos.verifactu.bridge; public final class DssBridge { public static void main(String[] args) throws Exception { Thread.sleep(10000); } }\n",
    );
    await promisify(execFile)(javacExecutable, [
      "--release",
      "21",
      "-d",
      classPath,
      source,
    ]);
    const javaExecutable =
      process.env.VERIFACTU_JAVA ??
      (process.platform === "win32" ? "java.exe" : "java");
    const timed = await spawnDssBridge(request, {
      javaExecutable,
      jarPath: classPath,
      timeoutMs: 20,
    });
    assert.equal(timed.kind, "LIMIT");
    assert.equal(timed.diagnostic, "DIAG-XADES-DEADLINE");

    const controller = new AbortController();
    const pending = spawnDssBridge(request, {
      javaExecutable,
      jarPath: classPath,
      signal: controller.signal,
      timeoutMs: 5_000,
    });
    setTimeout(() => controller.abort(), 20);
    const cancelled = await pending;
    assert.equal(cancelled.kind, "CANCELLED");
    assert.equal(cancelled.diagnostic, "DIAG-XADES-CANCELLED");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
