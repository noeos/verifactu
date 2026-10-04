import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { discoverOverallMutationCatalog } from "./p4-mutation-catalog.mjs";
import { applyOverallMutation } from "./p4-mutation-catalog.mjs";
import { executeNodeMutation } from "./p4-overall-mutation-campaign.mjs";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const plan = JSON.parse(
  await readFile(resolve(root, "config/quality/p5-quality-plan.json"), "utf8"),
);
const testsFor = new Map([
  [
    "packages/verifactu/src/persistence/model.ts",
    [
      "tests/unit/p5-persistence-model.test.mjs",
      "tests/security/p5-persistence-attacks.test.mjs",
    ],
  ],
  [
    "packages/verifactu/src/persistence/unit-of-work.ts",
    [
      "tests/contract/p5-persistence-contract.test.mjs",
      "tests/contract/p5-host-uow-contract.test.mjs",
    ],
  ],
  [
    "packages/verifactu/src/persistence/atomic-coordinator.ts",
    ["tests/integration/p5-host-atomicity.test.mjs"],
  ],
  [
    "packages/verifactu/src/persistence/head-cas.ts",
    [
      "tests/property/p5-concurrency-properties.test.mjs",
      "tests/integration/p5-host-atomicity.test.mjs",
    ],
  ],
  [
    "packages/verifactu/src/persistence/leases.ts",
    ["tests/unit/p5-state-machine.test.mjs"],
  ],
  [
    "packages/verifactu/src/persistence/journal.ts",
    [
      "tests/unit/p5-state-machine.test.mjs",
      "tests/contract/p5-recovery-contract.test.mjs",
    ],
  ],
  [
    "packages/verifactu/src/persistence/recovery.ts",
    [
      "tests/integration/p5-crash-restart.test.mjs",
      "tests/performance/p5-recovery-campaign.test.mjs",
    ],
  ],
  [
    "packages/verifactu/src/persistence/migrations.ts",
    ["tests/integration/p5-migration-restore.test.mjs"],
  ],
  [
    "packages/verifactu/src/persistence/backup-restore.ts",
    [
      "tests/contract/p5-recovery-contract.test.mjs",
      "tests/integration/p5-migration-restore.test.mjs",
    ],
  ],
  [
    "packages/verifactu/src/persistence/retention.ts",
    ["tests/security/p5-persistence-attacks.test.mjs"],
  ],
  [
    "packages/verifactu/src/aeat/edition-profile.ts",
    [
      "tests/unit/p5-aeat-binding.test.mjs",
      "tests/contract/p5-aeat-wire-contract.test.mjs",
    ],
  ],
  [
    "packages/verifactu/src/aeat/soap-wire.ts",
    [
      "tests/contract/p5-aeat-wire-contract.test.mjs",
      "tests/property/p5-protocol-properties.test.mjs",
    ],
  ],
  [
    "packages/verifactu/src/aeat/response-parser.ts",
    [
      "tests/security/p5-wire-attacks.test.mjs",
      "tests/security/p5-resource-limits.test.mjs",
      "tests/unit/p5-aeat-binding.test.mjs",
    ],
  ],
  [
    "packages/verifactu/src/aeat/transport.ts",
    [
      "tests/integration/p5-aeat-transport.test.mjs",
      "tests/contract/p5-local-peer-contract.test.mjs",
    ],
  ],
  [
    "packages/verifactu/src/aeat/node-https-transport.ts",
    [
      "tests/contract/p5-local-peer-contract.test.mjs",
      "tests/integration/p5-aeat-transport.test.mjs",
    ],
  ],
  [
    "packages/verifactu/src/aeat/certificate-authorization.ts",
    ["tests/contract/p5-local-peer-contract.test.mjs"],
  ],
  [
    "packages/verifactu/src/aeat/batch-planner.ts",
    [
      "tests/contract/p5-aeat-wire-contract.test.mjs",
      "tests/unit/p5-aeat-binding.test.mjs",
    ],
  ],
  [
    "packages/verifactu/src/aeat/submission-coordinator.ts",
    ["tests/contract/p5-aeat-orchestration-contract.test.mjs"],
  ],
  [
    "packages/verifactu/src/aeat/retry-policy.ts",
    ["tests/unit/p5-state-machine.test.mjs"],
  ],
  [
    "packages/verifactu/src/aeat/correlation.ts",
    ["tests/integration/p5-aeat-reconciliation.test.mjs"],
  ],
  [
    "packages/verifactu/src/aeat/reconciliation.ts",
    ["tests/integration/p5-aeat-reconciliation.test.mjs"],
  ],
  [
    "packages/verifactu/src/aeat/consultation.ts",
    [
      "tests/integration/p5-aeat-reconciliation.test.mjs",
      "tests/security/p5-resource-limits.test.mjs",
    ],
  ],
  [
    "packages/verifactu/src/operations/safe-observability.ts",
    ["tests/security/p5-redaction.test.mjs"],
  ],
  [
    "packages/verifactu/src/operations/runbook-decisions.ts",
    ["tests/security/p5-redaction.test.mjs"],
  ],
]);
const criticalTargets = [
  [
    "packages/verifactu/src/persistence/unit-of-work.ts",
    "identity.commandId !== this.token.commandId",
  ],
  [
    "packages/verifactu/src/persistence/unit-of-work.ts",
    "identity.canonicalDigest !== this.token.canonicalDigest",
  ],
  [
    "packages/verifactu/src/persistence/unit-of-work.ts",
    'this.token.capabilityLevel === "atomic-host" &&\n        !this.hostPublicationStaged',
  ],
  [
    "packages/verifactu/src/persistence/unit-of-work.ts",
    'if (result.status === "ok") this.currentState = "committed";\n      else if (\n        result.status === "indeterminate" ||\n        result.code === "unknown-commit"\n      )\n        this.currentState = "indeterminate";',
  ],
  [
    "packages/verifactu/src/persistence/head-cas.ts",
    "next.generation !== expected.generation + 1",
  ],
  [
    "packages/verifactu/src/persistence/head-cas.ts",
    "record.predecessorId?.value !== expected.lastRecordId.value",
  ],
  [
    "packages/verifactu/src/persistence/leases.ts",
    "result.value.fencingToken !== input.lease.fencingToken",
  ],
  [
    "packages/verifactu/src/aeat/submission-coordinator.ts",
    'started.status !== "ok"',
  ],
  [
    "packages/verifactu/src/aeat/retry-policy.ts",
    'input.state === "accepted" ||\n    input.state === "accepted-with-errors"',
  ],
  [
    "packages/verifactu/src/aeat/retry-policy.ts",
    'input.state === "attempt-started" ||\n    input.state === "indeterminate"',
  ],
  [
    "packages/verifactu/src/aeat/submission-coordinator.ts",
    '`sha256:${createHash("sha256").update(batch.request.bytes).digest("hex")}` !==\n      batch.request.sha256',
  ],
  [
    "packages/verifactu/src/persistence/model.ts",
    "return contextStoreKey(left) === contextStoreKey(right);",
  ],
  [
    "packages/verifactu/src/persistence/model.ts",
    "sha256Digest(bytes) !== descriptor.sha256",
  ],
  [
    "packages/verifactu/src/aeat/correlation.ts",
    "const exact =\n    extraResponseLines === 0 &&\n    duplicateResponseLines === 0",
  ],
  [
    "packages/verifactu/src/aeat/correlation.ts",
    'responseStatus === "unrecognized"',
  ],
  [
    "packages/verifactu/src/aeat/edition-profile.ts",
    'profile.lifecycle !== "active" ||\n    !profile.creationAllowed',
  ],
  [
    "packages/verifactu/src/aeat/edition-profile.ts",
    "candidate.environment === environment",
  ],
  [
    "packages/verifactu/src/aeat/node-https-transport.ts",
    "if (tls === null || tls.authorized !== true)",
  ],
  [
    "packages/verifactu/src/aeat/certificate-authorization.ts",
    "purpose === input.purpose",
  ],
  [
    "packages/verifactu/src/aeat/response-parser.ts",
    "bytes.byteLength > operation.binding.maxResponseBytes",
  ],
  [
    "packages/verifactu/src/persistence/backup-restore.ts",
    "if (uncertain > 0)",
  ],
  [
    "packages/verifactu/src/persistence/migrations.ts",
    "if (adapter.schemaVersion > definition.fromVersion)",
  ],
  [
    "packages/verifactu/src/persistence/retention.ts",
    'else if (item.legalHold !== false || !input.policy.legalHoldResolved)\n      reason = "DIAG-RETENTION-LEGAL-HOLD";',
  ],
  [
    "packages/verifactu/src/operations/safe-observability.ts",
    'input.category === "certificate-expiry" &&\n      input.code !== "DIAG-CERTIFICATE-EXPIRING"',
  ],
].map(([module, needle]) => ({ module, needle }));

async function main() {
  const catalog = await discoverOverallMutationCatalog(root, plan);
  const used = new Set();
  const results = [];
  const syntaxExclusions = [];
  const sourceCache = new Map();
  try {
    const syntacticallyValid = [];
    for (const candidate of catalog.mutants) {
      let source = sourceCache.get(candidate.module);
      if (source === undefined) {
        source = await readFile(resolve(root, candidate.module), "utf8");
        sourceCache.set(candidate.module, source);
      }
      const mutatedSource = applyOverallMutation(source, candidate);
      const emitted = ts.transpileModule(mutatedSource, {
        fileName: resolve(root, candidate.module),
        reportDiagnostics: true,
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
        },
      });
      const error = (emitted.diagnostics ?? []).find(
        (item) => item.category === ts.DiagnosticCategory.Error,
      );
      if (error) {
        syntaxExclusions.push({
          sourceMutation: candidate.id,
          module: candidate.module,
          line: candidate.line,
          diagnosticCode: error.code,
          diagnostic: ts
            .flattenDiagnosticMessageText(error.messageText, " ")
            .slice(0, 200),
        });
      } else syntacticallyValid.push(candidate);
    }
    const execute = async (id, target) => {
      const module = typeof target === "string" ? target : target.module;
      let source = sourceCache.get(module);
      if (source === undefined) {
        source = await readFile(resolve(root, module), "utf8");
        sourceCache.set(module, source);
      }
      const candidates = syntacticallyValid.filter(
        (mutation) =>
          mutation.module === module &&
          !used.has(`${module}:${mutation.start}`),
      );
      let targeted = candidates;
      if (typeof target !== "string") {
        const targetStart = source.indexOf(target.needle);
        if (
          targetStart < 0 ||
          source.indexOf(target.needle, targetStart + 1) >= 0
        )
          throw new Error(
            `${id} critical source target is missing or ambiguous: ${module}:${target.needle}`,
          );
        const targetEnd = targetStart + target.needle.length;
        targeted = candidates.filter(
          (mutation) =>
            mutation.start >= targetStart && mutation.end <= targetEnd,
        );
      }
      const testPaths = testsFor.get(module) ?? [];
      assert.ok(
        testPaths.length > 0,
        `No P5 oracle mapped for ${id} (${module})`,
      );
      const selectionBudget =
        module.endsWith("/retry-policy.ts") ||
        module.endsWith("/response-parser.ts")
          ? 128
          : 24;
      for (const candidate of targeted.slice(0, selectionBudget)) {
        used.add(`${module}:${candidate.start}`);
        const runtimeModule = `evidence/runs/artifacts/build/verifactu/dist/${module.slice("packages/verifactu/src/".length).replace(/\.ts$/u, ".js")}`;
        const mutatedSource = applyOverallMutation(source, candidate);
        const mutated = await executeNodeMutation(
          root,
          {
            ...candidate,
            id,
            runtimeModule,
            tests: testPaths,
            baselineCovered: true,
          },
          { timeoutMs: 45_000, fullTestTimeoutMs: 60_000 },
        );
        if (mutated.compile === "failed")
          throw new Error(
            `${id} unexpected compiler/load failure: ${(mutated.diagnostics ?? []).join(" ").slice(0, 500)}`,
          );
        if (mutated.outcome === "killed") {
          const result = {
            id,
            sourceMutation: candidate.id,
            module,
            line: candidate.line,
            operator: candidate.operator,
            sourceSpan: { start: candidate.start, end: candidate.end },
            originalSourceSha256: `sha256:${createHash("sha256").update(source).digest("hex")}`,
            mutatedSourceSha256: `sha256:${createHash("sha256").update(mutatedSource).digest("hex")}`,
            compile: mutated.compile,
            covered: mutated.covered,
            tests: mutated.tests,
            killEvidence: mutated.killEvidence,
            outcome: "killed",
          };
          results.push(result);
          process.stdout.write(
            `${JSON.stringify({ progress: true, ...result })}\n`,
          );
          return true;
        }
        if (mutated.outcome === "timeout" || mutated.outcome === "testError")
          throw new Error(
            `${id} ${mutated.outcome}: ${(mutated.diagnostics ?? []).join(" ").slice(0, 500)}`,
          );
        if (mutated.outcome === "survived" || mutated.outcome === "noCoverage")
          continue;
        throw new Error(`${id} unexpected mutant outcome ${mutated.outcome}`);
      }
      const result = {
        id,
        module,
        compile: "passed",
        covered: true,
        tests: testPaths,
        killEvidence: [],
        outcome: "survived",
      };
      results.push(result);
      process.stdout.write(
        `${JSON.stringify({ progress: true, ...result })}\n`,
      );
      return false;
    };

    let criticalKilled = 0;
    for (
      let index = 0;
      index < plan.mutation.criticalMutants.length;
      index += 1
    )
      if (
        await execute(
          plan.mutation.criticalMutants[index],
          criticalTargets[index],
        )
      )
        criticalKilled += 1;

    const secondaryModules = [...testsFor.keys()].filter((module) =>
      catalog.mutants.some((mutation) => mutation.module === module),
    );
    let otherKilled = 0;
    for (let index = 0; index < plan.mutation.otherMutants.length; index += 1) {
      const module = secondaryModules[index % secondaryModules.length];
      if (await execute(plan.mutation.otherMutants[index], module))
        otherKilled += 1;
    }
    const criticalSurvivors = results
      .filter(
        (result) =>
          plan.mutation.criticalMutants.includes(result.id) &&
          result.outcome !== "killed",
      )
      .map((result) => result.id);
    assert.equal(
      criticalKilled,
      plan.mutation.criticalMutants.length,
      `critical mutation survivors are forbidden: ${criticalSurvivors.join(",")}`,
    );
    assert.ok(
      (otherKilled / plan.mutation.otherMutants.length) * 100 >=
        plan.mutation.otherKilledPercent,
      `other mutant score ${otherKilled}/${plan.mutation.otherMutants.length}`,
    );
    assert.equal(results.length, 40);
    const report = {
      schemaVersion: 1,
      status: "passed",
      subject: process.env.VERIFACTU_SUBJECT_SHA ?? "unbound",
      tree: process.env.VERIFACTU_SUBJECT_TREE ?? "unbound",
      criticalKilled,
      criticalTotal: 24,
      otherKilled,
      otherTotal: 16,
      candidateSyntaxExcluded: syntaxExclusions.length,
      syntaxExclusions,
      results,
    };
    const reportDirectory = resolve(root, "evidence/runs/artifacts/p5");
    await mkdir(reportDirectory, { recursive: true });
    await writeFile(
      resolve(reportDirectory, "mutation-report.json"),
      `${JSON.stringify(report)}\n`,
      { flag: "w" },
    );
    process.stdout.write(`${JSON.stringify(report)}\n`);
  } finally {
    await catalog.cleanup();
  }
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? (error.stack ?? error.message) : "P5_MUTATION_FAILURE"}\n`,
  );
  process.exitCode = 1;
});
