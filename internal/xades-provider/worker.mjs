import { spawn } from "node:child_process";
import { isAscii } from "node:buffer";
import { fileURLToPath } from "node:url";

const PROTOCOL = "VERIFACTU-DSS-1";
const MAX_REQUEST_BYTES = 24_000_000;
const MAX_RESPONSE_BYTES = 12_000_000;
const MAX_DIAGNOSTIC_BYTES = 256;
const MAX_STDERR_WIRE_BYTES = 4_096;
const VALID_KINDS = new Set([
  "TBS",
  "SIGNED",
  "VERIFIED",
  "INVALID",
  "INDETERMINATE",
  "REVOKED",
  "STALE",
  "UNKNOWN",
  "ABSENT",
  "LIMIT",
  "CANCELLED",
  "UNAVAILABLE",
  "DEFECT",
]);

const DEFAULT_JAR = fileURLToPath(
  new URL(
    "./dss/target/verifactu-xades-provider-0.0.0-development.jar",
    import.meta.url,
  ),
);
export const DSS_JVM_OPTIONS = Object.freeze([
  "-Xms16m",
  "-Xmx128m",
  "-XX:MaxMetaspaceSize=96m",
  "-XX:ActiveProcessorCount=2",
  "-XX:+ExitOnOutOfMemoryError",
  "-Dfile.encoding=UTF-8",
  "-Djava.awt.headless=true",
  "-Djava.net.useSystemProxies=false",
  "-Djava.security.manager=allow",
  "-Duser.language=en",
  "-Duser.country=US",
  "-Duser.timezone=UTC",
]);

export function dssChildOptions(cwd, env = minimalEnvironment()) {
  return {
    cwd,
    env,
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  };
}

export async function spawnDssBridge(request, options = {}) {
  if (options.signal?.aborted)
    return result("CANCELLED", "DIAG-XADES-CANCELLED");

  const timeoutMs = options.timeoutMs ?? 5_000;
  const maximumPayloadBytes = Math.min(
    options.maximumOutputBytes ?? MAX_RESPONSE_BYTES,
    MAX_RESPONSE_BYTES,
  );
  const maximumWireBytes = Math.min(
    Math.ceil((maximumPayloadBytes * 4) / 3) + 1_024,
    MAX_RESPONSE_BYTES,
  );
  const input = encodeRequest(request);
  if (!input || input.byteLength > MAX_REQUEST_BYTES)
    return result("LIMIT", "DIAG-XADES-REQUEST-BYTES");

  const javaExecutable =
    options.javaExecutable ?? process.env.VERIFACTU_JAVA ?? "java";
  const jarPath =
    options.jarPath ?? process.env.VERIFACTU_DSS_JAR ?? DEFAULT_JAR;
  const javaOptions = [...DSS_JVM_OPTIONS];
  const jacocoAgent = process.env.VERIFACTU_JACOCO_AGENT;
  const jacocoDestination = process.env.VERIFACTU_JACOCO_DESTFILE;
  if (jacocoAgent || jacocoDestination) {
    if (
      typeof jacocoAgent !== "string" ||
      typeof jacocoDestination !== "string" ||
      /[,\r\n\u0000]/u.test(jacocoAgent) ||
      /[,\r\n\u0000]/u.test(jacocoDestination)
    )
      return result("DEFECT", "DIAG-XADES-JACOCO");
    javaOptions.push(
      `-javaagent:${jacocoAgent}=destfile=${jacocoDestination},append=true,includes=eu.noeos.verifactu.bridge.*`,
    );
  }

  return new Promise((resolve) => {
    let child;
    let settlement;
    let stopReason = null;
    let stdout = Buffer.alloc(0);
    let stderr = Buffer.alloc(0);
    const finish = (value) => {
      if (settlement !== undefined) return;
      settlement = value;
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
      resolve(value);
    };
    const stop = (reason) => {
      if (settlement !== undefined) return;
      stopReason = reason;
      if (child !== undefined) child.kill();
    };
    const abort = () => stop("cancelled");
    const timer = setTimeout(() => stop("timeout"), timeoutMs);
    timer.unref();
    options.signal?.addEventListener("abort", abort, { once: true });

    try {
      child = spawn(
        javaExecutable,
        [...javaOptions, "-cp", jarPath, "eu.noeos.verifactu.bridge.DssBridge"],
        dssChildOptions(options.cwd ?? process.cwd()),
      );
      child.stdout.on("data", (chunk) => {
        if (stdout.byteLength + chunk.byteLength > maximumWireBytes) {
          stop("output");
          return;
        }
        stdout = Buffer.concat([stdout, chunk]);
      });
      child.stderr.on("data", (chunk) => {
        if (stderr.byteLength + chunk.byteLength > MAX_STDERR_WIRE_BYTES) {
          stop("output");
          return;
        }
        stderr = Buffer.concat([stderr, chunk]);
      });
      child.on("error", (error) => {
        finish(
          error.code === "ENOENT"
            ? result("UNAVAILABLE", "DIAG-XADES-UNAVAILABLE")
            : result("DEFECT", "DIAG-XADES-PROCESS"),
        );
      });
      child.on("close", (code, signal) => {
        if (stopReason === "cancelled") {
          finish(result("CANCELLED", "DIAG-XADES-CANCELLED"));
          return;
        }
        if (stopReason === "timeout") {
          finish(result("LIMIT", "DIAG-XADES-DEADLINE"));
          return;
        }
        if (stopReason === "output") {
          finish(result("LIMIT", "DIAG-XADES-OUTPUT"));
          return;
        }
        if (unexpectedStderrBytes(stderr) > MAX_DIAGNOSTIC_BYTES) {
          finish(result("LIMIT", "DIAG-XADES-OUTPUT"));
          return;
        }
        if (code !== 0 || signal !== null) {
          finish(result("DEFECT", "DIAG-XADES-PROCESS"));
          return;
        }
        const decoded = decodeResponse(stdout);
        finish(
          decoded.payload.byteLength > maximumPayloadBytes
            ? result("LIMIT", "DIAG-XADES-OUTPUT")
            : decoded,
        );
      });
      child.stdin.on("error", () => undefined);
      child.stdin.end(input);
    } catch {
      finish(result("UNAVAILABLE", "DIAG-XADES-UNAVAILABLE"));
    }
  });
}

function unexpectedStderrBytes(stderr) {
  const text = stderr.toString("utf8");
  const filtered = text
    .replace(
      /^WARNING: A terminally deprecated method in java\.lang\.System has been called\r?\n/u,
      "",
    )
    .replace(
      /^WARNING: System::setSecurityManager has been called by eu\.noeos\.verifactu\.bridge\.DssBridge \(file:[^\r\n]+\)\r?\n/u,
      "",
    )
    .replace(
      /^WARNING: Please consider reporting this to the maintainers of eu\.noeos\.verifactu\.bridge\.DssBridge\r?\n/u,
      "",
    )
    .replace(
      /^WARNING: System::setSecurityManager will be removed in a future release\r?\n/u,
      "",
    );
  return Buffer.byteLength(filtered);
}

export function encodeRequest(request) {
  if (
    !request ||
    typeof request !== "object" ||
    !["SIGN_PREPARE", "SIGN_COMPLETE", "VERIFY"].includes(request.command) ||
    !(request.artifactBytes instanceof Uint8Array) ||
    !(request.signerCertificateDer instanceof Uint8Array) ||
    (request.signatureBytes !== undefined &&
      !(request.signatureBytes instanceof Uint8Array)) ||
    !Array.isArray(request.certificateChainDer) ||
    !Array.isArray(request.trustAnchorsDer) ||
    !Array.isArray(request.crlEvidence) ||
    !Array.isArray(request.ocspEvidence) ||
    [
      request.certificateChainDer,
      request.trustAnchorsDer,
      request.crlEvidence,
      request.ocspEvidence,
    ].some(
      (items) =>
        items.length > 32 ||
        items.some((item) => !(item instanceof Uint8Array)),
    )
  )
    return null;
  const fields = [
    PROTOCOL,
    request.command,
    request.editionId,
    request.profileId,
    request.targetName,
    request.artifactDigestSha256,
    String(request.signingTimeMs ?? 0),
    String(request.validationTimeMs ?? 0),
    String(request.maximumRevocationAgeSeconds ?? 0),
    request.expectedSignerFingerprintSha256 ?? "",
    request.artifactBytes,
    request.signerCertificateDer,
    ...listFields(request.certificateChainDer),
    request.signatureBytes ?? new Uint8Array(),
    ...listFields(request.trustAnchorsDer),
    ...listFields(request.crlEvidence),
    ...listFields(request.ocspEvidence),
  ];
  if (
    fields.some((field) =>
      typeof field === "string"
        ? field.length > 128 || /[\r\n\u0000]/u.test(field)
        : !(field instanceof Uint8Array),
    )
  )
    return null;
  const encoded = Buffer.from(
    fields.map((field) => Buffer.from(field).toString("base64")).join("\n") +
      "\n",
    "ascii",
  );
  return encoded.byteLength <= MAX_REQUEST_BYTES ? encoded : null;
}

function listFields(value) {
  const fields = [String(value.length)];
  for (const item of value) {
    fields.push(item);
  }
  return fields;
}

export function decodeResponse(stdout) {
  try {
    if (!(stdout instanceof Uint8Array))
      return result("DEFECT", "DIAG-XADES-PROTOCOL");
    if (!isAscii(stdout)) return result("DEFECT", "DIAG-XADES-PROTOCOL");
    const text = new TextDecoder("utf-8").decode(stdout);
    const lines = text.split("\n");
    if (lines.at(-1) === "") lines.pop();
    if (
      lines.length !== 4 ||
      lines[0] !== PROTOCOL ||
      !VALID_KINDS.has(lines[1])
    )
      return result("DEFECT", "DIAG-XADES-PROTOCOL");
    if (lines[2] !== "NONE" && !/^DIAG-[A-Z0-9-]{0,64}$/u.test(lines[2]))
      return result("DEFECT", "DIAG-XADES-PROTOCOL");
    const payload = decodeBase64(lines[3]);
    if (!payload) return result("DEFECT", "DIAG-XADES-PROTOCOL");
    return Object.freeze({ kind: lines[1], diagnostic: lines[2], payload });
  } catch {
    return result("DEFECT", "DIAG-XADES-PROTOCOL");
  }
}

function decodeBase64(value) {
  if (
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(
      value,
    )
  )
    return null;
  const bytes = Buffer.from(value, "base64");
  return bytes.toString("base64") === value ? new Uint8Array(bytes) : null;
}

export function minimalEnvironment(
  platform = process.platform,
  source = process.env,
) {
  const env = { PATH: source.PATH ?? "" };
  if (source.JAVA_HOME) env.JAVA_HOME = source.JAVA_HOME;
  if (platform === "win32") {
    if (source.SystemRoot) env.SystemRoot = source.SystemRoot;
    if (source.WINDIR) env.WINDIR = source.WINDIR;
  }
  return env;
}

function result(kind, diagnostic) {
  return Object.freeze({ kind, diagnostic, payload: new Uint8Array() });
}
