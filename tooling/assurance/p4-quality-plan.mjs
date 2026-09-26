#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const readJson = async (path) =>
  JSON.parse(await readFile(resolve(root, path), "utf8"));
const plan = await readJson("config/quality/p4-quality-plan.json");
const lifecycle = await readJson("config/regulatory/edition-lifecycle.json");
const generation = await readJson(
  "editions/rrsif-2026-09-21-authoritative-candidate/generated/generation-report.json",
);
const admission = await readJson("config/admission/dependencies.json");
const toolchain = await readJson("config/toolchain/toolchain.json");
const javaProvider = await readJson("config/admission/java-provider.json");

function fail(code, detail) {
  const error = new Error(`${code}: ${detail}`);
  error.code = code;
  throw error;
}

function assert(condition, code, detail) {
  if (!condition) fail(code, String(detail));
}

function canonical(value) {
  const normalize = (item) =>
    Array.isArray(item)
      ? item.map(normalize)
      : item && typeof item === "object"
        ? Object.fromEntries(
            Object.keys(item)
              .sort()
              .map((key) => [key, normalize(item[key])]),
          )
        : item;
  return JSON.stringify(normalize(value));
}

function unique(values, code) {
  assert(new Set(values).size === values.length, code, "duplicate value");
}

function git(...args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert(result.status === 0, "P4_PLAN_GIT", result.stderr.trim());
  return result.stdout.trim();
}

const validProductionPath = (path) =>
  (path.startsWith("packages/verifactu/src/") && path.endsWith(".ts")) ||
  (path.startsWith("internal/xml-provider/") && path.endsWith(".mjs")) ||
  (path.startsWith("internal/xades-provider/") &&
    (path.endsWith(".mjs") || path.endsWith(".java"))) ||
  path === "internal/independent-oracles/p4_oracle.py";

function readZipEntry(archivePath, entryName) {
  const python =
    process.env.VERIFACTU_PYTHON ??
    (process.platform === "win32" ? "python" : "python3");
  const script =
    "import sys, zipfile\nwith zipfile.ZipFile(sys.argv[1]) as archive:\n sys.stdout.buffer.write(archive.read(sys.argv[2]))\n";
  const result = spawnSync(
    python,
    ["-c", script, resolve(root, archivePath), entryName],
    { cwd: root, encoding: null, maxBuffer: 8 * 1024 * 1024 },
  );
  assert(
    result.status === 0,
    "P4_PLAN_ZIP_EVIDENCE_READ",
    `${entryName}: ${result.stderr?.toString("utf8") ?? "zip read failed"}`,
  );
  return result.stdout;
}

export function validateP4QualityPlan(candidate, discoveredProduction = []) {
  assert(
    javaProvider.schemaVersion === 1 &&
      javaProvider.id === "JAVA-PROVIDER-ADMISSION-0001" &&
      javaProvider.status === "incomplete-candidate-lock" &&
      javaProvider.runtimeGraph.componentCount === 42 &&
      javaProvider.buildPluginGraph.componentCount === 99 &&
      javaProvider.components.length === 139,
    "P4_PLAN_JAVA_PROVIDER_ADMISSION",
    `${javaProvider.runtimeGraph?.componentCount}/${javaProvider.buildPluginGraph?.componentCount}/${javaProvider.components?.length}`,
  );
  const admittedPurls = new Set(
    javaProvider.components.map((item) => item.purl),
  );
  const providerPurl =
    "pkg:maven/eu.noeos.verifactu.internal/verifactu-xades-provider@0.0.0-development";
  assert(
    admittedPurls.size === javaProvider.components.length &&
      javaProvider.components.every(
        (item) =>
          item.jarSha256?.length === 64 &&
          item.pomSha256?.length === 64 &&
          typeof item.spdxLicenseExpression === "string" &&
          item.spdxLicenseExpression.length > 0,
      ),
    "P4_PLAN_JAVA_PROVIDER_COMPONENTS",
    "duplicate purl, missing artifact digest, or missing SPDX expression",
  );
  assert(
    javaProvider.runtimeGraph.edges.every(
      (edge) =>
        (admittedPurls.has(edge.from) || edge.from === providerPurl) &&
        admittedPurls.has(edge.to),
    ) &&
      javaProvider.runtimeGraph.edges.some(
        (edge) =>
          edge.to ===
          `pkg:maven/${javaProvider.runtimeGraph.directDependencies[0].replaceAll(":", "/").replace(/\/([^/]+)$/u, "@$1")}`,
      ),
    "P4_PLAN_JAVA_PROVIDER_RUNTIME_GRAPH",
    "runtime relationship references an unadmitted purl",
  );
  const runtimeRoot = providerPurl;
  const runtimeReachable = new Set([runtimeRoot]);
  let runtimeChanged = true;
  while (runtimeChanged) {
    runtimeChanged = false;
    for (const edge of javaProvider.runtimeGraph.edges) {
      if (runtimeReachable.has(edge.from) && !runtimeReachable.has(edge.to)) {
        runtimeReachable.add(edge.to);
        runtimeChanged = true;
      }
    }
  }
  const runtimePurls = new Set(
    javaProvider.components
      .filter((item) => item.scope.includes("runtime"))
      .map((item) => item.purl),
  );
  assert(
    runtimePurls.size === javaProvider.runtimeGraph.componentCount &&
      runtimeReachable.size === runtimePurls.size + 1 &&
      [...runtimePurls].every((purl) => runtimeReachable.has(purl)),
    "P4_PLAN_JAVA_PROVIDER_RUNTIME_CLOSURE",
    "runtime graph does not close over exactly the admitted runtime artifacts",
  );
  assert(
    javaProvider.buildPluginGraph.plugins.length === 8 &&
      javaProvider.buildPluginGraph.plugins.every(
        (plugin) =>
          plugin.resolvedComponents.length > 0 &&
          plugin.resolvedComponents.every((purl) => admittedPurls.has(purl)) &&
          plugin.edgeEvidence?.closurePurls.length > 0 &&
          new Set(plugin.resolvedComponents).size ===
            plugin.edgeEvidence.closurePurls.length &&
          plugin.edgeEvidence.closurePurls.every((purl) =>
            plugin.resolvedComponents.includes(purl),
          ) &&
          plugin.edgeEvidence.closurePurls.every((purl) =>
            admittedPurls.has(purl),
          ),
      ),
    "P4_PLAN_JAVA_PROVIDER_PLUGIN_GRAPH",
    "plugin realm membership is incomplete or references an unadmitted purl",
  );
  assert(
    javaProvider.buildPluginGraph.edges.length ===
      javaProvider.buildPluginGraph.edgeCount &&
      javaProvider.buildPluginGraph.edges.every(
        (edge) =>
          admittedPurls.has(edge.from) &&
          admittedPurls.has(edge.to) &&
          typeof edge.source === "string" &&
          edge.source.length > 0,
      ) &&
      javaProvider.buildPluginGraph.plugins.every((plugin) => {
        const roots = plugin.edgeEvidence.closurePurls.filter((purl) =>
          purl.includes(`/${plugin.artifactId}@`),
        );
        if (roots.length !== 1) return false;
        const reachable = new Set([roots[0]]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const edge of javaProvider.buildPluginGraph.edges) {
            if (
              reachable.has(edge.from) &&
              plugin.edgeEvidence.closurePurls.includes(edge.to) &&
              !reachable.has(edge.to)
            ) {
              reachable.add(edge.to);
              changed = true;
            }
          }
        }
        return (
          reachable.size === plugin.edgeEvidence.closurePurls.length &&
          plugin.edgeEvidence.closurePurls.every((purl) => reachable.has(purl))
        );
      }),
    "P4_PLAN_JAVA_PROVIDER_PLUGIN_EDGES",
    "transitive plugin graph is dangling or does not close over exact selected components",
  );
  const hashedEvidence = (path, digest, code) => {
    const bytes = readFileSync(resolve(root, path));
    assert(
      createHash("sha256").update(bytes).digest("hex") === digest,
      code,
      path,
    );
    return bytes;
  };
  hashedEvidence(
    javaProvider.runtimeGraph.evidencePath,
    javaProvider.runtimeGraph.reportSha256,
    "P4_PLAN_JAVA_PROVIDER_RUNTIME_EVIDENCE",
  );
  hashedEvidence(
    javaProvider.buildPluginGraph.resolutionProof.reportPath,
    javaProvider.buildPluginGraph.resolutionProof.reportSha256,
    "P4_PLAN_JAVA_PROVIDER_PLUGIN_EVIDENCE",
  );
  for (const plugin of javaProvider.buildPluginGraph.plugins) {
    const pom = hashedEvidence(
      plugin.edgeEvidence.pomEvidencePath,
      plugin.edgeEvidence.pomSha256,
      "P4_PLAN_JAVA_PROVIDER_PLUGIN_POM_EVIDENCE",
    );
    const treeBytes = hashedEvidence(
      plugin.edgeEvidence.treeEvidencePath,
      plugin.edgeEvidence.treeSha256,
      "P4_PLAN_JAVA_PROVIDER_PLUGIN_TREE_EVIDENCE",
    );
    const tree = JSON.parse(treeBytes.toString("utf8"));
    const exactVersions = new Map(
      plugin.edgeEvidence.closurePurls.map((purl) => {
        const item = javaProvider.components.find(
          (entry) => entry.purl === purl,
        );
        return [`${item.groupId}:${item.artifactId}`, purl];
      }),
    );
    const expectedTreeEdges = [];
    const observedUnmapped = new Set();
    const visitTree = (node, parent) => {
      const target = exactVersions.get(`${node.groupId}:${node.artifactId}`);
      if (!target) {
        observedUnmapped.add(
          `${node.groupId}:${node.artifactId}:${node.version}`,
        );
        return;
      }
      if (parent !== target)
        expectedTreeEdges.push(
          `${parent}\0${target}\0${node.scope || "compile"}`,
        );
      for (const child of node.children ?? []) visitTree(child, target);
    };
    const rootPurl = plugin.edgeEvidence.closurePurls.find((purl) =>
      purl.includes(`/${plugin.artifactId}@`),
    );
    for (const node of tree.children ?? []) visitTree(node, rootPurl);
    const actualTreeEdges = new Set(
      javaProvider.buildPluginGraph.edges
        .filter(
          (edge) =>
            edge.source === "maven-dependency-tree-json" &&
            edge.pluginArtifactId === plugin.artifactId &&
            plugin.edgeEvidence.closurePurls.includes(edge.from) &&
            plugin.edgeEvidence.closurePurls.includes(edge.to),
        )
        .map((edge) => `${edge.from}\0${edge.to}\0${edge.scope}`),
    );
    const expectedTreeEdgeSet = new Set(expectedTreeEdges);
    assert(
      canonical([...observedUnmapped].sort()) ===
        canonical(plugin.edgeEvidence.unmappedTreeCoordinates) &&
        expectedTreeEdgeSet.size === actualTreeEdges.size &&
        [...expectedTreeEdgeSet].every((edge) => actualTreeEdges.has(edge)) &&
        actualTreeEdges.size === expectedTreeEdgeSet.size,
      "P4_PLAN_JAVA_PROVIDER_PLUGIN_TREE_RECONCILIATION",
      `${plugin.artifactId} (${pom.length} byte probe POM)`,
    );
    assert(
      javaProvider.buildPluginGraph.edges.filter(
        (edge) => edge.pluginArtifactId === plugin.artifactId,
      ).length === plugin.edgeEvidence.edgeCount,
      "P4_PLAN_JAVA_PROVIDER_PLUGIN_EDGE_COUNT",
      plugin.artifactId,
    );
  }
  const pluginPurls = new Set(
    javaProvider.buildPluginGraph.plugins.flatMap(
      (plugin) => plugin.edgeEvidence.closurePurls,
    ),
  );
  const admittedPluginPurls = new Set(
    javaProvider.components
      .filter((item) => item.scope.includes("build-plugin"))
      .map((item) => item.purl),
  );
  assert(
    pluginPurls.size === javaProvider.buildPluginGraph.componentCount &&
      pluginPurls.size === admittedPluginPurls.size &&
      [...pluginPurls].every((purl) => admittedPluginPurls.has(purl)),
    "P4_PLAN_JAVA_PROVIDER_PLUGIN_CLOSURE",
    "plugin closures do not reconcile to the exact selected plugin union",
  );
  for (const license of javaProvider.licenseClosure.customLicenseTexts) {
    hashedEvidence(
      license.path,
      license.sha256,
      "P4_PLAN_JAVA_PROVIDER_LICENSE_TEXT",
    );
  }
  const integrityEvidenceBytes = hashedEvidence(
    javaProvider.artifactIntegrity.evidencePath,
    javaProvider.artifactIntegrity.evidenceSha256,
    "P4_PLAN_JAVA_PROVIDER_CENTRAL_INTEGRITY_REPORT",
  );
  const integrityEvidence = JSON.parse(integrityEvidenceBytes.toString("utf8"));
  const verifiedCentralArtifacts = new Map(
    integrityEvidence.components.map((item) => [
      `${item.purl}\0${item.kind}`,
      item,
    ]),
  );
  assert(
    integrityEvidence.componentCount === javaProvider.components.length &&
      integrityEvidence.artifactAndPomCount === 278 &&
      integrityEvidence.artifactAndPomExactCentralByteMatches === 278 &&
      integrityEvidence.failures.length === 0 &&
      javaProvider.components.every((item) => {
        const jar = verifiedCentralArtifacts.get(`${item.purl}\0jar`);
        const pom = verifiedCentralArtifacts.get(`${item.purl}\0pom`);
        return (
          jar?.expectedSha256 === item.jarSha256 &&
          jar.localSha256 === item.jarSha256 &&
          jar.remoteSha256 === item.jarSha256 &&
          pom?.expectedSha256 === item.pomSha256 &&
          pom.localSha256 === item.pomSha256 &&
          pom.remoteSha256 === item.pomSha256
        );
      }),
    "P4_PLAN_JAVA_PROVIDER_CENTRAL_INTEGRITY",
    "the locked artifact/POM digests do not reconcile to exact Maven Central bytes",
  );
  const projectLicense = javaProvider.licenseClosure.project;
  hashedEvidence(
    projectLicense.licensePath,
    projectLicense.licenseSha256,
    "P4_PLAN_JAVA_PROVIDER_PROJECT_LICENSE",
  );
  hashedEvidence(
    projectLicense.noticePath,
    projectLicense.noticeSha256,
    "P4_PLAN_JAVA_PROVIDER_PROJECT_NOTICE",
  );
  const dssLicense = javaProvider.licenseClosure.dss;
  hashedEvidence(
    `internal/xades-provider/dss/src/main/resources/${dssLicense.archivePath}`,
    dssLicense.sourceSha256,
    "P4_PLAN_JAVA_PROVIDER_DSS_LICENSE",
  );
  const mavenLegal = javaProvider.licenseClosure.selectedMavenDistribution;
  hashedEvidence(
    mavenLegal.licenseEvidencePath,
    mavenLegal.licenseSha256,
    "P4_PLAN_JAVA_PROVIDER_MAVEN_LICENSE",
  );
  hashedEvidence(
    mavenLegal.noticeEvidencePath,
    mavenLegal.noticeSha256,
    "P4_PLAN_JAVA_PROVIDER_MAVEN_NOTICE",
  );
  hashedEvidence(
    javaProvider.toolchain.setupJavaAction.licenseEvidencePath,
    javaProvider.toolchain.setupJavaAction.runtimeLicenseSha256,
    "P4_PLAN_JAVA_PROVIDER_SETUP_JAVA_LICENSE",
  );
  hashedEvidence(
    javaProvider.toolchain.spdxLicenseList.evidencePath,
    javaProvider.toolchain.spdxLicenseList.licenseDataSha256,
    "P4_PLAN_JAVA_PROVIDER_SPDX_LICENSE_LIST",
  );
  const osvReport = hashedEvidence(
    javaProvider.vulnerabilityObservation.evidencePath,
    javaProvider.vulnerabilityObservation.osvJsonSha256,
    "P4_PLAN_JAVA_PROVIDER_OSV_EVIDENCE_HASH",
  );
  const osvContent = JSON.parse(osvReport.toString("utf8"));
  assert(
    javaProvider.vulnerabilityObservation.result === "No issues found" &&
      osvContent.results.every(
        (result) =>
          !result.packages?.some(
            (pkg) => (pkg.vulnerabilities ?? []).length > 0,
          ),
      ),
    "P4_PLAN_JAVA_PROVIDER_OSV_EVIDENCE",
    javaProvider.vulnerabilityObservation.evidencePath,
  );
  const projectBuild = javaProvider.buildProbes.projectPomOfflinePackage;
  const projectBuildLog = hashedEvidence(
    projectBuild.logEvidencePath,
    projectBuild.logSha256,
    "P4_PLAN_JAVA_PROVIDER_BUILD_LOG",
  );
  assert(
    projectBuild.status === "passed-with-empty-bridge-source" &&
      projectBuild.repeatEvidence.length === 2 &&
      projectBuild.reproducibleBuildCount === 2 &&
      projectBuild.repeatedOutputIdentically === true &&
      projectBuild.outputSha256 ===
        javaProvider.licenseClosure.shadedArchive.sha256 &&
      projectBuildLog.toString("utf8").includes("BUILD SUCCESS"),
    "P4_PLAN_JAVA_PROVIDER_REPRODUCIBLE_BUILD",
    "offline candidate build evidence is incomplete or does not match the shaded artifact",
  );
  for (const run of projectBuild.repeatEvidence) {
    const buildLog = hashedEvidence(
      run.path,
      run.logSha256,
      "P4_PLAN_JAVA_PROVIDER_REPEAT_BUILD_LOG",
    );
    assert(
      buildLog.toString("utf8").includes("BUILD SUCCESS"),
      "P4_PLAN_JAVA_PROVIDER_REPEAT_BUILD",
      run.path,
    );
  }
  const bridgeCoverage = javaProvider.buildProbes.bridgeCoverageFeasibility;
  const bridgeCoverageCsv = hashedEvidence(
    bridgeCoverage.reportPath,
    bridgeCoverage.reportSha256,
    "P4_PLAN_JAVA_PROVIDER_BRIDGE_COVERAGE_EVIDENCE",
  );
  assert(
    bridgeCoverage.status === "passed-on-scratch-copy; feasibility only" &&
      bridgeCoverage.classesAnalyzed === 1 &&
      bridgeCoverage.branchMissed === 0 &&
      bridgeCoverage.branchCovered === 2 &&
      bridgeCoverageCsv
        .toString("utf8")
        .includes("BridgeProbe,3,13,0,2,1,2,1,3,1,2"),
    "P4_PLAN_JAVA_PROVIDER_BRIDGE_COVERAGE",
    "JaCoCo scratch feasibility report does not prove both probe branches",
  );
  const officialProbe = javaProvider.buildProbes.officialVectorProbe;
  for (const item of [
    officialProbe.source.specificationPdfPath,
    officialProbe.source.examplesZipPath,
    officialProbe.signedVector.path,
    officialProbe.validationReportPath,
  ]) {
    const entry =
      item === officialProbe.source.specificationPdfPath
        ? officialProbe.source.specificationPdfSha256
        : item === officialProbe.source.examplesZipPath
          ? officialProbe.source.examplesZipSha256
          : item === officialProbe.signedVector.path
            ? officialProbe.signedVector.sha256
            : officialProbe.validationReportSha256;
    hashedEvidence(
      item,
      entry,
      "P4_PLAN_JAVA_PROVIDER_OFFICIAL_VECTOR_EVIDENCE",
    );
  }
  const signedZipVector = readZipEntry(
    officialProbe.source.examplesZipPath,
    officialProbe.signedVector.archiveEntry,
  );
  const unsignedZipVector = readZipEntry(
    officialProbe.source.examplesZipPath,
    officialProbe.unsignedVector.archiveEntry,
  );
  const officialValidation = readFileSync(
    resolve(root, officialProbe.validationReportPath),
    "utf8",
  );
  assert(
    officialProbe.source.specificationVersion === "0.1.5" &&
      createHash("sha256").update(signedZipVector).digest("hex") ===
        officialProbe.signedVector.sha256 &&
      createHash("sha256").update(unsignedZipVector).digest("hex") ===
        officialProbe.unsignedVector.sha256 &&
      officialProbe.signedVector.structuralSignature === true &&
      officialProbe.signedVector.basicSignature === true &&
      officialProbe.signedVector.referenceAndSignedPropertiesIntact === true &&
      officialProbe.signedVector.trustResult ===
        "INDETERMINATE / NO_CERTIFICATE_CHAIN_FOUND" &&
      officialValidation.includes("guardNetworkAttempt=denied") &&
      officialValidation.includes("structural=true basic=true intact=true") &&
      officialValidation.includes(
        "INDETERMINATE sub=NO_CERTIFICATE_CHAIN_FOUND",
      ),
    "P4_PLAN_JAVA_PROVIDER_OFFICIAL_VECTOR_PROBE",
    "the official example probe lacks explicit network-denial evidence or overstates trust",
  );
  const syntheticProbe = javaProvider.buildProbes.syntheticSigningProbe;
  hashedEvidence(
    syntheticProbe.signedArtifactPath,
    syntheticProbe.signedArtifactSha256,
    "P4_PLAN_JAVA_PROVIDER_SYNTHETIC_SIGNATURE",
  );
  const syntheticReport = hashedEvidence(
    syntheticProbe.validationReportPath,
    syntheticProbe.validationReportSha256,
    "P4_PLAN_JAVA_PROVIDER_SYNTHETIC_SIGNATURE_REPORT",
  ).toString("utf8");
  assert(
    syntheticProbe.trustResult ===
      "INDETERMINATE / NO_CERTIFICATE_CHAIN_FOUND" &&
      syntheticReport.includes("structural=true basic=true intact=true") &&
      syntheticReport.includes("INDETERMINATE sub=NO_CERTIFICATE_CHAIN_FOUND"),
    "P4_PLAN_JAVA_PROVIDER_SYNTHETIC_SIGNATURE_PROBE",
    "synthetic signature report does not preserve the trust-indeterminate result",
  );
  assert(candidate?.schemaVersion === 1, "P4_PLAN_SCHEMA", "schemaVersion");
  assert(
    candidate.id === "P4-QUALITY-PLAN-0001" &&
      candidate.phaseState === "pre-implementation" &&
      candidate.declaredBeforeImplementation === true,
    "P4_PLAN_STATE",
    candidate.id,
  );
  assert(
    candidate.governingProtectedMain ===
      "999d78c19b0e1be3097201a0cc61947a10760bbe",
    "P4_PLAN_SUBJECT",
    candidate.governingProtectedMain,
  );
  assert(
    candidate.governingProtectedTree ===
      "8375829168e5eb11150cfbb297fcd4125c922fc3",
    "P4_PLAN_SUBJECT_TREE",
    candidate.governingProtectedTree,
  );
  assert(
    candidate.edition?.id === "rrsif-2026-09-21-authoritative-candidate" &&
      candidate.edition.sourceSnapshot === "rrsif-2026-09-21-authoritative" &&
      candidate.edition.sourceManifestSha256 ===
        "0856118bfb3d528ffa2acc6322c3484616ba6aff978f620db5e7aab916ba60c6" &&
      candidate.edition.generatedOutputSha256 ===
        "561005c36d5c3ae0b00a98215f59e24769b7b4dec9b1a6cba878f00eacb90482" &&
      candidate.edition.creationAllowed === false,
    "P4_PLAN_EDITION",
    candidate.edition?.id,
  );
  assert(
    lifecycle.current.editionId === candidate.edition.id &&
      lifecycle.current.creationAllowed === false &&
      generation.editionId === candidate.edition.id &&
      generation.sourceManifestSha256 ===
        candidate.edition.sourceManifestSha256 &&
      generation.outputDigest === candidate.edition.generatedOutputSha256,
    "P4_PLAN_EDITION_CURRENT",
    candidate.edition.id,
  );
  const engine = admission.dependencies.find(
    (entry) => entry.name === "@noeos/verification-engine",
  );
  assert(
    engine &&
      engine.version === candidate.verificationEngine.version &&
      engine.integrity === candidate.verificationEngine.integrity &&
      candidate.verificationEngine.name === engine.name &&
      canonical(candidate.verificationEngine.allowedExports) ===
        canonical([".", "./profiles", "./schemas", "./vectors"]),
    "P4_PLAN_ENGINE",
    candidate.verificationEngine?.version,
  );

  assert(
    Array.isArray(candidate.productionModules) &&
      candidate.productionModules.length === 44,
    "P4_PLAN_MODULE_POPULATION",
    candidate.productionModules?.length,
  );
  unique(candidate.productionModules, "P4_PLAN_MODULE_DUPLICATE");
  assert(
    candidate.productionModules.every(validProductionPath),
    "P4_PLAN_MODULE_SCOPE",
    "unapproved production path",
  );
  assert(
    discoveredProduction.every((path) =>
      candidate.productionModules.includes(path),
    ),
    "P4_PLAN_UNDECLARED_PRODUCTION",
    discoveredProduction
      .filter((path) => !candidate.productionModules.includes(path))
      .join(","),
  );
  assert(
    Array.isArray(candidate.testFiles) && candidate.testFiles.length === 26,
    "P4_PLAN_TEST_POPULATION",
    candidate.testFiles?.length,
  );
  unique(candidate.testFiles, "P4_PLAN_TEST_DUPLICATE");
  assert(
    candidate.testFiles.every(
      (path) => path.startsWith("tests/") && path.endsWith(".test.mjs"),
    ),
    "P4_PLAN_TEST_SCOPE",
    "test outside declared test tree",
  );

  const thresholds = candidate.coverage?.thresholds;
  assert(
    thresholds?.linesPercent === 98 &&
      thresholds.statementsPercent === 98 &&
      thresholds.functionsPercent === 98 &&
      thresholds.branchesPercent === 95 &&
      thresholds.criticalBranchesPercent === 100,
    "P4_PLAN_COVERAGE_THRESHOLD",
    canonical(thresholds),
  );
  assert(
    candidate.coverage.exclude.length === 3 &&
      canonical(candidate.coverage.exclude) ===
        canonical([
          "generated declarations",
          "type-only declarations",
          "test fixtures",
        ]),
    "P4_PLAN_COVERAGE_EXCLUSION",
    candidate.coverage.exclude.join(","),
  );

  assert(
    candidate.criticalCatalogue.length === 43,
    "P4_PLAN_CRITICAL_POPULATION",
    candidate.criticalCatalogue.length,
  );
  unique(
    candidate.criticalCatalogue.map((entry) => entry.id),
    "P4_PLAN_CRITICAL_DUPLICATE",
  );
  unique(
    candidate.criticalCatalogue.map((entry) => entry.mutant),
    "P4_PLAN_MUTANT_DUPLICATE",
  );
  candidate.criticalCatalogue.forEach((entry, index) => {
    const suffix = String(index + 1).padStart(3, "0");
    assert(entry.id === `P4-CB-${suffix}`, "P4_PLAN_CRITICAL_ID", entry.id);
    assert(
      entry.mutant === `P4-MUT-${suffix}`,
      "P4_PLAN_CRITICAL_MUTANT",
      entry.mutant,
    );
    assert(
      candidate.productionModules.includes(entry.path),
      "P4_PLAN_CRITICAL_PATH",
      entry.path,
    );
    assert(
      candidate.testFiles.includes(entry.test),
      "P4_PLAN_CRITICAL_TEST",
      entry.test,
    );
    assert(
      typeof entry.decision === "string" && entry.decision.length >= 24,
      "P4_PLAN_CRITICAL_DECISION",
      entry.id,
    );
  });
  assert(
    candidate.mutation.operators.length === 6 &&
      candidate.mutation.thresholds.criticalKilledPercent === 100 &&
      candidate.mutation.thresholds.overallKilledPercent >= 95 &&
      candidate.mutation.thresholds.unreviewedCriticalSurvivors === 0 &&
      candidate.mutation.thresholds.compileErrors === 0 &&
      candidate.mutation.thresholds.testErrors === 0 &&
      candidate.mutation.thresholds.timeouts === 0 &&
      candidate.mutation.thresholds.noCoverage === 0,
    "P4_PLAN_MUTATION_THRESHOLD",
    canonical(candidate.mutation.thresholds),
  );

  assert(
    candidate.propertyCampaigns.length === 14 &&
      candidate.propertyCampaigns.every(
        (entry, index) =>
          entry.id === `P4-PROP-${String(index + 1).padStart(3, "0")}` &&
          entry.executions === 4096 &&
          entry.maxDiscardPercent >= 0 &&
          entry.maxDiscardPercent <= 2,
      ),
    "P4_PLAN_PROPERTY_POPULATION",
    candidate.propertyCampaigns.length,
  );
  assert(
    candidate.fuzzCampaigns.length === 8 &&
      candidate.fuzzCampaigns.every(
        (entry, index) =>
          entry.id === `P4-FUZZ-${String(index + 1).padStart(3, "0")}` &&
          entry.executions === 4096 &&
          entry.maximumInputBytes > 0,
      ),
    "P4_PLAN_FUZZ_POPULATION",
    candidate.fuzzCampaigns.length,
  );
  assert(
    candidate.seededFaults.length === 33,
    "P4_PLAN_FAULT_POPULATION",
    candidate.seededFaults.length,
  );
  unique(candidate.seededFaults, "P4_PLAN_FAULT_DUPLICATE");
  const providerFaults = [
    "dss-altered-signed-bytes-success",
    "provider-serializes-or-logs-private-key",
    "stale-crl-ocsp-promoted-valid",
    "unauthorized-revocation-responder-trusted",
    "provider-attempts-network-without-evidence",
    "qr-payload-truncated-or-rewritten",
    "qr-oracle-uses-production-decoder",
  ];
  assert(
    canonical(candidate.seededFaults.slice(-7)) === canonical(providerFaults),
    "P4_PLAN_PROVIDER_FAULTS",
    "provider fault identities or order drift",
  );

  assert(
    candidate.compatibilityMatrix.length === 5 &&
      candidate.compatibilityMatrix.every(
        (cell) =>
          cell.status === "required" &&
          cell.module === "esm" &&
          cell.npm &&
          cell.node,
      ),
    "P4_PLAN_COMPATIBILITY",
    candidate.compatibilityMatrix.length,
  );
  assert(
    candidate.performanceBudgets.length === 11 &&
      candidate.performanceBudgets.every(
        (budget, index) =>
          budget.id === `P4-BUD-${String(index + 1).padStart(3, "0")}` &&
          budget.threshold > 0 &&
          budget.direction === "maximum" &&
          budget.environment.length > 0,
      ),
    "P4_PLAN_BUDGET",
    candidate.performanceBudgets.length,
  );
  assert(
    canonical(
      candidate.performanceBudgets.map((budget) => budget.threshold),
    ) ===
      canonical([
        1048576, 4194304, 8388608, 64, 200000, 5000, 268435456, 5000, 4096,
        16777216, 67108864,
      ]),
    "P4_PLAN_BUDGET_VALUE",
    "frozen threshold drift",
  );
  assert(
    candidate.requiredEvidence.length === 13,
    "P4_PLAN_EVIDENCE_POPULATION",
    candidate.requiredEvidence.length,
  );
  unique(candidate.requiredEvidence, "P4_PLAN_EVIDENCE_DUPLICATE");
  assert(
    canonical(candidate.requiredEvidence) ===
      canonical([
        "coverage-report",
        "critical-branch-report",
        "mutation-report",
        "property-report-with-seeds-and-shrinks",
        "fuzz-report-with-corpus-and-seeds",
        "seeded-fault-report",
        "official-and-independent-vector-report",
        "security-attack-report",
        "performance-and-resource-report",
        "compatibility-matrix-report",
        "clean-packed-consumer-report",
        "DSS reproducible offline build and bridge coverage",
        "Maven/SBOM/shade/licence/NOTICE reconciliation",
      ]),
    "P4_PLAN_EVIDENCE_IDENTITIES",
    "evidence report identities drift",
  );

  assert(
    candidate.providerCandidates.qrEncoder.version === "5.0.3" &&
      candidate.providerCandidates.qrEncoder.integrity ===
        "sha512-eKxU05NO2A5ycOiAKu9XKaf5akfR0wJHgjBvy4Wgy2dOgBjMh58IHz8gvMwS2IBiqWq63ITntuzP/iuVA2wOHg==" &&
      candidate.providerCandidates.qrEncoder.license === "MIT" &&
      candidate.providerCandidates.qrEncoder.role === "private runtime encoder",
    "P4_PLAN_QR_ENCODER",
    "candidate identity",
  );
  assert(
    candidate.providerCandidates.qrDecoder.version === "0.23.0" &&
      candidate.providerCandidates.qrDecoder.integrity ===
        "sha512-6fkkoFwP8CHxl6ugnPsj74PLJgX2iRv5zczGAyt5OBzQgxFhuhF0NCEc4t4OvSr8xAv2MRLlI0Iu9ZGDZQ2urA==" &&
      candidate.providerCandidates.qrDecoder.license === "Apache-2.0" &&
      candidate.providerCandidates.qrDecoder.role ===
        "test-only independent decode oracle" &&
      candidate.providerCandidates.qrDecoder.maintenanceState.includes(
        "compare maintained alternatives",
      ),
    "P4_PLAN_QR_DECODER",
    "candidate identity and maintenance caveat",
  );
  assert(
    candidate.providerCandidates.xadesProvider.version === "6.5" &&
      candidate.providerCandidates.xadesProvider.license === "LGPL-2.1" &&
      candidate.providerCandidates.xadesProvider.noRemoteDemoService === true,
    "P4_PLAN_DSS",
    "DSS local-provider boundary",
  );
  const jdk = candidate.providerToolchainCandidates.java;
  assert(
    jdk.vendor === "Eclipse Temurin" &&
      jdk.version === "21.0.12.1+1" &&
      jdk.package === "jdk" &&
      Object.keys(jdk.supportedArchivesSha256).length === 5 &&
      Object.values(jdk.supportedArchivesSha256).every((digest) =>
        /^[a-f0-9]{64}$/u.test(digest),
      ) &&
      canonical(jdk.supportedArchivesSha256) ===
        canonical({
          "ubuntu-24.04-x64":
            "ce79869e1307ed8ee1e2baa86a412b1eb5b75d10a01006d788a6f968bcfaee94",
          "windows-2025-x64":
            "f9d6e191ab098c0d416e7d588a24420a8621cd2f4720dab2459b8b7b2d2d8b4e",
          "macos-15-x64":
            "44db0f08196daf19a47f90d13388b0c943b67663cb537f998fe29e836fa842ce",
          "macos-15-arm64":
            "3623232f33a9c3baadf304480b2535f9a3cba8a58d42ecbb438ba267315d9998",
          "ubuntu-24.04-arm64":
            "23e37e026f12f3e706f18938ff611db3032d075b09d0879a25d06718c773e223",
        }),
    "P4_PLAN_JDK",
    "exact per-platform JDK candidate digests",
  );
  assert(
    candidate.providerToolchainCandidates.setupJavaAction.sha ===
      "de7274f081f381c8f8158605e0321c36c376e2e6" &&
      candidate.providerToolchainCandidates.setupJavaAction.treeSha ===
        "0ce6b787d77e67a1dbf0cb529055ed508de8e545" &&
      candidate.providerToolchainCandidates.setupJavaAction.license === "MIT" &&
      candidate.providerToolchainCandidates.setupJavaAction.runtime ===
        "node24" &&
      candidate.providerToolchainCandidates.setupJavaAction.commitSignature ===
        "GitHub verified",
    "P4_PLAN_SETUP_JAVA",
    "exact candidate commit and tree",
  );
  assert(
    candidate.providerToolchainCandidates.maven.version === "3.9.12" &&
      candidate.providerToolchainCandidates.maven.distributionSha512 ===
        "0a1be79f02466533fc1a80abbef8796e4f737c46c6574ede5658b110899942a94db634477dfd3745501c80aef9aac0d4f841d38574373f7e2d24cce89d694f70",
    "P4_PLAN_MAVEN",
    "exact distribution and checksum",
  );
  return true;
}

const tracked = git("ls-files", "--cached", "--others", "--exclude-standard")
  .split(/\r?\n/u)
  .filter(Boolean);
const discoveredProduction = tracked.filter(validProductionPath);
const discoveredP4Tests = tracked.filter(
  (path) => path.startsWith("tests/") && /p4-.*\.test\.mjs$/u.test(path),
);
assert(
  discoveredP4Tests.every((path) => plan.testFiles.includes(path)),
  "P4_PLAN_UNDECLARED_TEST",
  discoveredP4Tests.filter((path) => !plan.testFiles.includes(path)).join(","),
);
validateP4QualityPlan(plan, discoveredProduction);

const doc = await readFile(
  resolve(root, "docs/17-roadmap-risk/p4-quality-plan.md"),
  "utf8",
);
const prompts = await readFile(
  resolve(root, "docs/17-roadmap-risk/prompts.md"),
  "utf8",
);
const coveragePolicy = await readFile(
  resolve(root, "docs/11-quality-testing/coverage-policy.md"),
  "utf8",
);
const p3Policies = (await readJson("config/quality/p3b-baseline.json"))
  .p4FirstCommitPolicies;
const extractInventory = (heading) => {
  const start = doc.indexOf(heading);
  assert(start >= 0, "P4_PLAN_DOC_SECTION", heading);
  const tail = doc.slice(start + heading.length);
  const fence = String.fromCharCode(96).repeat(3);
  const match = tail.match(
    new RegExp("\\n" + fence + "text\\n([\\s\\S]*?)\\n" + fence),
  );
  assert(match, "P4_PLAN_DOC_INVENTORY", heading);
  return match[1].split(/\r?\n/u).filter(Boolean);
};
assert(
  canonical(extractInventory("## Frozen production-module inventory")) ===
    canonical(plan.productionModules),
  "P4_PLAN_DOC_PRODUCTION",
  "human and machine production inventories differ",
);
assert(
  canonical(extractInventory("## Frozen test-file inventory")) ===
    canonical(plan.testFiles),
  "P4_PLAN_DOC_TESTS",
  "human and machine test inventories differ",
);
assert(
  doc.includes("P4-A → P4-B → P4-C → P4-D → P4-E → P4-F → P4-G"),
  "P4_PLAN_DOC_ORDER",
  "serial order missing",
);
assert(
  prompts.includes("Do not stop or end this goal") &&
    prompts.includes("P4-G is completely implemented"),
  "P4_PLAN_PROMPT_TERMINATION",
  "continue-through-handoff prompt language missing",
);
assert(
  coveragePolicy.includes("98% lines, 98% functions and 95% branches") &&
    p3Policies.mutation.threshold.includes("100% critical mutants") &&
    p3Policies.mutation.threshold.includes(">=95% overall"),
  "P4_PLAN_CANONICAL_THRESHOLDS",
  "coverage or mutation policy drift",
);
const required = await readJson("config/ci/required-checks.json");
const requiredCells = required.checks
  .filter((check) => check.task === "gate:platform")
  .map((check) => ({
    os: check.runner,
    node: check.node,
    npm: toolchain.profiles.find((profile) => profile.node === check.node)?.npm,
  }));
const declaredCells = plan.compatibilityMatrix.map((cell) => ({
  os: cell.os,
  node: cell.node,
  npm: cell.npm,
}));
assert(
  canonical(requiredCells) === canonical(declaredCells),
  "P4_PLAN_REQUIRED_MATRIX",
  "compatibility matrix differs from protected CI",
);
const tick = String.fromCharCode(96);
for (const row of plan.criticalCatalogue.slice(36)) {
  const tableLine = doc
    .split(/\r?\n/u)
    .find((line) => line.startsWith("| " + tick + row.id + tick + " |"));
  assert(
    tableLine &&
      tableLine.includes(tick + row.path + tick) &&
      tableLine.includes(tick + row.test + tick) &&
      tableLine.includes(tick + row.mutant + tick),
    "P4_PLAN_DOC_CRITICAL",
    row.id,
  );
}

const baselinePaths = git(
  "ls-tree",
  "-r",
  "--name-only",
  plan.governingProtectedMain,
)
  .split(/\r?\n/u)
  .filter(Boolean);
assert(
  git("rev-parse", `${plan.governingProtectedMain}^{tree}`) ===
    plan.governingProtectedTree &&
    canonical(
      baselinePaths.filter((path) => plan.productionModules.includes(path)),
    ) === canonical(["packages/verifactu/src/index.ts"]) &&
    !baselinePaths.some(
      (path) => path.startsWith("tests/") && /p4-.*\.test\.mjs$/u.test(path),
    ),
  "P4_PLAN_IMPLEMENTATION_BASELINE",
  "declared P3-B baseline already contains planned P4 implementation",
);

const negativeCases = [
  ["P4_PLAN_SUBJECT", (value) => (value.governingProtectedMain = "unknown")],
  [
    "P4_PLAN_SUBJECT_TREE",
    (value) => (value.governingProtectedTree = "unknown"),
  ],
  ["P4_PLAN_MODULE_POPULATION", (value) => value.productionModules.pop()],
  ["P4_PLAN_TEST_POPULATION", (value) => value.testFiles.pop()],
  [
    "P4_PLAN_COVERAGE_THRESHOLD",
    (value) => (value.coverage.thresholds.branchesPercent = 94),
  ],
  ["P4_PLAN_CRITICAL_POPULATION", (value) => value.criticalCatalogue.pop()],
  [
    "P4_PLAN_CRITICAL_MUTANT",
    (value) => (value.criticalCatalogue[42].mutant = "P4-MUT-999"),
  ],
  [
    "P4_PLAN_MUTATION_THRESHOLD",
    (value) => (value.mutation.thresholds.criticalKilledPercent = 99),
  ],
  [
    "P4_PLAN_PROPERTY_POPULATION",
    (value) => (value.propertyCampaigns[13].executions = 0),
  ],
  [
    "P4_PLAN_FUZZ_POPULATION",
    (value) => (value.fuzzCampaigns[7].executions = 0),
  ],
  ["P4_PLAN_FAULT_POPULATION", (value) => value.seededFaults.pop()],
  [
    "P4_PLAN_BUDGET_VALUE",
    (value) => (value.performanceBudgets[0].threshold = 999999999),
  ],
  ["P4_PLAN_COMPATIBILITY", (value) => value.compatibilityMatrix.pop()],
  [
    "P4_PLAN_QR_DECODER",
    (value) => (value.providerCandidates.qrDecoder.role = "runtime decoder"),
  ],
  [
    "P4_PLAN_MAVEN",
    (value) => (value.providerToolchainCandidates.maven.version = "3.9.11"),
  ],
  [
    "P4_PLAN_UNDECLARED_PRODUCTION",
    (value) =>
      validateP4QualityPlan(value, ["internal/xades-provider/not-planned.mjs"]),
  ],
];
let killed = 0;
const negativeResults = [];
for (const [expected, mutate] of negativeCases) {
  const candidate = structuredClone(plan);
  try {
    mutate(candidate);
    validateP4QualityPlan(candidate);
  } catch (error) {
    negativeResults.push(expected + "=" + error.code);
    if (error.code === expected) killed += 1;
  }
}
assert(
  killed === negativeCases.length,
  "P4_PLAN_SEEDED_FAULTS",
  `${killed}/${negativeCases.length}: ${negativeResults.join(",")}`,
);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const totalProperties = plan.propertyCampaigns.reduce(
  (sum, campaign) => sum + campaign.executions,
  0,
);
const totalFuzz = plan.fuzzCampaigns.reduce(
  (sum, campaign) => sum + campaign.executions,
  0,
);
process.stdout.write(
  JSON.stringify({
    status: "passed",
    selected: 14 + plan.productionModules.length + plan.testFiles.length,
    executed: 14 + plan.productionModules.length + plan.testFiles.length,
    passed: 14 + plan.productionModules.length + plan.testFiles.length,
    failed: 0,
    skipped: 0,
    outputDigest: sha256(canonical(plan)),
    diagnostics: [
      "production-modules:" + plan.productionModules.length,
      "test-files:" + plan.testFiles.length,
      "critical-branches:" + plan.criticalCatalogue.length,
      "critical-mutants:" + plan.criticalCatalogue.length,
      "property-executions:" + totalProperties,
      "fuzz-executions:" + totalFuzz,
      "seeded-plan-faults:" + killed + "/" + negativeCases.length,
    ],
  }) + "\n",
);
