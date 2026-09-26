import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const admission = JSON.parse(
  await readFile(resolve(root, "config/admission/java-provider.json"), "utf8"),
);
const runnerTemp = process.env.RUNNER_TEMP;
const githubEnv = process.env.GITHUB_ENV;
const githubPath = process.env.GITHUB_PATH;
if (!runnerTemp || !githubEnv || !githubPath)
  throw new Error("JAVA_PROVIDER_SETUP_ENVIRONMENT");

const toolsDirectory = join(runnerTemp, "verifactu-java-provider-tools");
const jdkDirectory = join(toolsDirectory, "jdk");
await mkdir(jdkDirectory, { recursive: true });
const platform =
  process.platform === "linux" && process.arch === "x64"
    ? "ubuntu-24.04-x64"
    : process.platform === "win32" && process.arch === "x64"
      ? "windows-2025-x64"
      : process.platform === "darwin" && process.arch === "arm64"
        ? "macos-15-arm64"
        : process.platform === "darwin" && process.arch === "x64"
          ? "macos-15-x64"
          : undefined;
const jdk = admission.toolchain.jdk;
const jdkArchive = jdk.archives.find(
  (archive) => archive.platform === platform,
);
const expectedJdkFiles = {
  "ubuntu-24.04-x64": "OpenJDK21U-jdk_x64_linux_hotspot_21.0.12.1_1.tar.gz",
  "windows-2025-x64": "OpenJDK21U-jdk_x64_windows_hotspot_21.0.12.1_1.zip",
  "macos-15-x64": "OpenJDK21U-jdk_x64_mac_hotspot_21.0.12.1_1.tar.gz",
  "macos-15-arm64": "OpenJDK21U-jdk_aarch64_mac_hotspot_21.0.12.1_1.tar.gz",
};
if (
  jdk.version !== "21.0.12.1+1" ||
  !platform ||
  !jdkArchive ||
  jdkArchive.file !== expectedJdkFiles[platform] ||
  !/^[a-f0-9]{64}$/u.test(jdkArchive.sha256)
)
  throw new Error(
    `JAVA_PROVIDER_JDK_ADMISSION: ${platform ?? process.platform}`,
  );
const jdkArchivePath = join(jdkDirectory, jdkArchive.file);
const jdkArchiveUrl = new URL(
  `https://github.com/adoptium/temurin21-binaries/releases/download/jdk-${encodeURIComponent(jdk.version)}/${jdkArchive.file}`,
).href;
const jdkBytes = await fetchBytes(jdkArchiveUrl, 600_000_000);
if (digest("sha256", jdkBytes) !== jdkArchive.sha256)
  throw new Error(`JAVA_PROVIDER_JDK_SHA256: ${jdkArchive.platform}`);
await writeFile(jdkArchivePath, jdkBytes, { mode: 0o600 });
await mkdir(join(jdkDirectory, "expanded"), { recursive: true });
const jdkExpanded = join(jdkDirectory, "expanded");
await execFileAsync(
  "tar",
  [
    ...(process.platform === "win32" ? ["-xf"] : ["-xzf"]),
    jdkArchivePath,
    "-C",
    jdkExpanded,
  ],
  { windowsHide: true, timeout: 180_000 },
);
const javaExecutable = process.platform === "win32" ? "java.exe" : "java";
const extractedRoots = await readdir(jdkExpanded, { withFileTypes: true });
let jdkHome;
if (extractedRoots.length === 1 && extractedRoots[0].isDirectory()) {
  const extractedRoot = join(jdkExpanded, extractedRoots[0].name);
  for (const candidate of [
    extractedRoot,
    join(extractedRoot, "Contents", "Home"),
  ]) {
    try {
      if ((await stat(join(candidate, "bin", javaExecutable))).isFile()) {
        jdkHome = candidate;
        break;
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}
const java = jdkHome && join(jdkHome, "bin", javaExecutable);
if (!java) throw new Error("JAVA_PROVIDER_JDK_ARCHIVE_LAYOUT");
const javaVersion = await execFileAsync(
  java,
  ["-XshowSettings:properties", "-version"],
  { windowsHide: true },
);
const javaText = `${javaVersion.stdout ?? ""}${javaVersion.stderr ?? ""}`;
if (
  !javaText.includes("java.runtime.version = 21.0.12.1+1-LTS") ||
  !javaText.includes("java.vendor = Eclipse Adoptium")
)
  throw new Error(`JAVA_PROVIDER_JDK_IDENTITY: ${javaText}`);

const maven = admission.toolchain.maven;
const archiveName = new URL(maven.distributionUrl).pathname.split("/").at(-1);
if (
  !archiveName ||
  !/^[A-Za-z0-9._-]+\.tar\.gz$/u.test(archiveName) ||
  !/^[a-f0-9]{128}$/u.test(maven.sha512)
)
  throw new Error("JAVA_PROVIDER_MAVEN_ADMISSION");
const archivePath = join(toolsDirectory, archiveName);
await mkdir(toolsDirectory, { recursive: true });
const archive = await fetchBytes(maven.distributionUrl, 50_000_000);
if (digest("sha512", archive) !== maven.sha512)
  throw new Error("JAVA_PROVIDER_MAVEN_SHA512");
await writeFile(archivePath, archive, { mode: 0o600 });
await execFileAsync("tar", ["-xzf", archivePath, "-C", toolsDirectory], {
  windowsHide: true,
  timeout: 60_000,
});

const mavenDirectory = join(toolsDirectory, "apache-maven-3.9.12");
const mavenExecutable = join(
  mavenDirectory,
  "bin",
  process.platform === "win32" ? "mvn.cmd" : "mvn",
);
const repository = join(runnerTemp, "verifactu-maven-repository");
await mkdir(repository, { recursive: true });
const components = admission.components;
if (components.length !== 140)
  throw new Error(`JAVA_PROVIDER_COMPONENT_COUNT: ${components.length}`);

let cursor = 0;
const workers = Array.from({ length: 8 }, async () => {
  while (cursor < components.length) {
    const component = components[cursor++];
    await admitComponent(component, repository);
  }
});
await Promise.all(workers);
const metadataPoms = admission.buildMetadataPoms;
if (!Array.isArray(metadataPoms) || metadataPoms.length !== 100)
  throw new Error(`JAVA_PROVIDER_METADATA_POM_COUNT: ${metadataPoms?.length}`);
let metadataCursor = 0;
const metadataWorkers = Array.from({ length: 8 }, async () => {
  while (metadataCursor < metadataPoms.length) {
    const pom = metadataPoms[metadataCursor++];
    await admitMetadataPom(pom, repository);
  }
});
await Promise.all(metadataWorkers);

const envLines = [
  `JAVA_HOME=${jdkHome}`,
  `VERIFACTU_JAVA=${java}`,
  `VERIFACTU_MAVEN=${mavenExecutable}`,
  `VERIFACTU_MAVEN_REPOSITORY=${repository}`,
  "VERIFACTU_JAVA_MUTATION=1",
];
await writeFile(githubEnv, `${envLines.join("\n")}\n`, { flag: "a" });
await writeFile(githubPath, `${join(jdkHome, "bin")}\n`, { flag: "a" });
process.stdout.write(
  `java-provider-ready jdk=${jdkArchive.platform}:${jdk.version} components=${components.length} jars=${components.length} componentPoms=${components.length} metadataPoms=${metadataPoms.length} maven=3.9.12\n`,
);

async function admitMetadataPom(pom, localRepository) {
  if (
    !pom ||
    typeof pom.groupId !== "string" ||
    typeof pom.artifactId !== "string" ||
    typeof pom.version !== "string" ||
    !/^[a-f0-9]{64}$/u.test(pom.pomSha256)
  )
    throw new Error("JAVA_PROVIDER_METADATA_POM_ADMISSION");
  const path = join(
    localRepository,
    ...pom.groupId.split("."),
    pom.artifactId,
    pom.version,
  );
  await mkdir(path, { recursive: true });
  const name = `${pom.artifactId}-${pom.version}.pom`;
  const destination = join(path, name);
  let valid = false;
  try {
    valid = digest("sha256", await readFile(destination)) === pom.pomSha256;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!valid) {
    const url = new URL(
      `${pom.groupId.replaceAll(".", "/")}/${pom.artifactId}/${pom.version}/${name}`,
      "https://repo.maven.apache.org/maven2/",
    );
    const bytes = await fetchBytes(url.href, 10_000_000);
    if (digest("sha256", bytes) !== pom.pomSha256)
      throw new Error(
        `JAVA_PROVIDER_METADATA_POM_SHA256: ${pom.groupId}:${pom.artifactId}:${pom.version}`,
      );
    const temporary = `${destination}.tmp-${process.pid}`;
    await writeFile(temporary, bytes, { mode: 0o600 });
    const { rename } = await import("node:fs/promises");
    await rename(temporary, destination);
  }
  const marker = join(path, "_remote.repositories");
  await writeFile(
    marker,
    `# exact admitted Central metadata\n${name}>central=\n`,
    {
      mode: 0o600,
    },
  );
}

async function admitComponent(component, localRepository) {
  if (
    !component ||
    typeof component.groupId !== "string" ||
    typeof component.artifactId !== "string" ||
    typeof component.version !== "string" ||
    !component.centralBaseUrl?.startsWith(
      "https://repo.maven.apache.org/maven2/",
    )
  )
    throw new Error(`JAVA_PROVIDER_COMPONENT_IDENTITY: ${component?.purl}`);
  const path = join(
    localRepository,
    ...component.groupId.split("."),
    component.artifactId,
    component.version,
  );
  await mkdir(path, { recursive: true });
  const classifier = component.classifier ? `-${component.classifier}` : "";
  const files = [
    {
      name: `${component.artifactId}-${component.version}${classifier}.jar`,
      sha256: component.jarSha256,
    },
    {
      name: `${component.artifactId}-${component.version}.pom`,
      sha256: component.pomSha256,
    },
  ];
  for (const file of files) {
    if (!/^[a-f0-9]{64}$/u.test(file.sha256))
      throw new Error(`JAVA_PROVIDER_COMPONENT_DIGEST: ${component.purl}`);
    const destination = join(path, file.name);
    let valid = false;
    try {
      valid = digest("sha256", await readFile(destination)) === file.sha256;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (!valid) {
      const bytes = await fetchBytes(
        new URL(file.name, component.centralBaseUrl).href,
        100_000_000,
      );
      if (digest("sha256", bytes) !== file.sha256)
        throw new Error(
          `JAVA_PROVIDER_COMPONENT_SHA256: ${component.purl}/${file.name}`,
        );
      const temporary = `${destination}.tmp-${process.pid}`;
      await writeFile(temporary, bytes, { mode: 0o600 });
      const { rename } = await import("node:fs/promises");
      await rename(temporary, destination);
    }
  }
  const marker = join(path, "_remote.repositories");
  const markerLines = files.map((file) => `${file.name}>central=`);
  await writeFile(
    marker,
    `# exact admitted Central artifacts\n${markerLines.join("\n")}\n`,
    {
      mode: 0o600,
    },
  );
}

async function fetchBytes(url, maximumBytes) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.byteLength === 0 || bytes.byteLength > maximumBytes)
        throw new Error(`INPUT_SIZE for ${url}`);
      return bytes;
    } catch (error) {
      lastError = error;
      if (attempt < 2)
        await new Promise((resolveDelay) =>
          setTimeout(resolveDelay, 250 * 2 ** attempt),
        );
    }
  }
  throw lastError;
}

function digest(algorithm, bytes) {
  return createHash(algorithm).update(bytes).digest("hex");
}
