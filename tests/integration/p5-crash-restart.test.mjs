import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, open, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { assessStartupRecovery } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/recovery.js";
import { genesisHead } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/head-cas.js";
import { context, hash, identity } from "../support/p5-domain-fixture.mjs";
import { recordP5FaultDetection } from "../support/p5-fault-evidence.mjs";

const recoveryModule = fileURLToPath(
  new URL(
    "../../evidence/runs/artifacts/build/verifactu/dist/persistence/recovery.js",
    import.meta.url,
  ),
);

function childEnvironment(additional) {
  const environment = {};
  for (const key of ["PATH", "SystemRoot", "WINDIR", "TEMP", "TMP"])
    if (process.env[key] !== undefined) environment[key] = process.env[key];
  return { ...environment, ...additional };
}

const writerSource = String.raw`
import { open, rename } from "node:fs/promises";
const statePath = process.env.P5_CRASH_STATE;
const phase = process.env.P5_CRASH_PHASE;
const bytes = Buffer.from(process.env.P5_CRASH_NEXT_STATE, "base64");
const stagedPath = statePath + ".staged-" + process.pid;
setInterval(() => {}, 60_000);
const handle = await open(stagedPath, "wx", 0o600);
try {
  await handle.writeFile(bytes);
  await handle.sync();
} finally {
  await handle.close();
}
if (phase === "before-rename") {
  process.stdout.write("P5_DURABLE_STAGE_READY\n");
  await new Promise(() => {});
}
await rename(stagedPath, statePath);
process.stdout.write("P5_DURABLE_COMMIT_READY\n");
await new Promise(() => {});
`;

const readerSource = String.raw`
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const state = JSON.parse(await readFile(process.env.P5_CRASH_STATE, "utf8"));
const context = JSON.parse(process.env.P5_CRASH_CONTEXT);
const recoveryPath = pathToFileURL(process.env.P5_RECOVERY_MODULE).href;
const { assessStartupRecovery } = await import(recoveryPath);
const families = ["records", "artifacts", "events", "outbox"];
const familyIds = families.flatMap((family) => state[family].map((item) => item.transactionId));
const familyCounts = families.map((family) => state[family].length);
const record = state.records[0] ?? null;
const artifact = state.artifacts[0] ?? null;
const artifactDigest = artifact
  ? "sha256:" + createHash("sha256").update(Buffer.from(artifact.bytes, "base64")).digest("hex")
  : null;
const manifestInput = {
  generation: state.generation,
  journalVersion: state.journalVersion,
  head: state.head,
  records: state.records,
  artifacts: state.artifacts,
  events: state.events,
  outbox: state.outbox,
};
const expectedManifestDigest = "sha256:" + createHash("sha256").update(JSON.stringify(manifestInput)).digest("hex");
const checkpointChainVerified = state.checkpoint?.manifestDigest === expectedManifestDigest;
const closureVerified = state.generation === 0
  ? familyCounts.every((count) => count === 0)
  : familyCounts.every((count) => count === 1) &&
    new Set(familyIds).size === 1 &&
    record?.id === state.head.lastRecordId.value &&
    record?.digest === state.head.officialFingerprint &&
    artifact?.digest === artifactDigest &&
    artifact?.digest === record?.digest &&
    state.events[0]?.recordId === record?.id &&
    state.outbox[0]?.recordId === record?.id &&
    state.checkpoint?.generation === state.generation &&
    state.checkpoint?.headDigest === state.head.officialFingerprint &&
    checkpointChainVerified;
const head = state.head;
const decision = assessStartupRecovery({
  storeId: "store-p5-process-crash",
  context,
  schemaVersion: 1,
  generation: state.generation,
  head,
  journalVersion: state.journalVersion,
  latestCheckpoint: state.checkpoint,
  checkpointChainVerified,
  artifactClosureVerified: closureVerified,
  eventChainVerified: closureVerified,
  observedAt: "2026-10-04T00:00:00.000Z",
  pendingOutboxStates: state.outbox.map((item) => item.state),
});
process.stdout.write(JSON.stringify({
  generation: state.generation,
  familyCounts,
  familyIds,
  closureVerified,
  recovery: decision,
}) + "\n");
`;

function checkpoint(generation, headDigest, journalVersion, manifestDigest) {
  return {
    storeId: "store-p5-process-crash",
    context,
    schemaVersion: 1,
    generation,
    headDigest,
    journalVersion,
    manifestDigest,
    previousCheckpointDigest: null,
    createdAt: "2026-10-04T00:00:00.000Z",
    externalAnchorDigest: null,
  };
}

function withCheckpoint(state) {
  const manifestInput = {
    generation: state.generation,
    journalVersion: state.journalVersion,
    head: state.head,
    records: state.records,
    artifacts: state.artifacts,
    events: state.events,
    outbox: state.outbox,
  };
  state.checkpoint = checkpoint(
    state.generation,
    state.head.officialFingerprint,
    state.journalVersion,
    `sha256:${hash(JSON.stringify(manifestInput))}`,
  );
  return state;
}

function nextState() {
  const bytes = Buffer.from("exact-persisted-request-bytes");
  const digest = `sha256:${hash(bytes)}`;
  const transactionId = "p5-atomic-commit-1";
  const recordId = identity("record", "record-after-restart");
  const previousHead = genesisHead(context, "chain-process-restart");
  const head = {
    ...previousHead,
    generation: 1,
    lastRecordId: identity("record", recordId.value),
    officialFingerprint: digest,
    generatedAt: "2026-10-04T00:00:00.000Z",
    commitId: transactionId,
  };
  return withCheckpoint({
    generation: 1,
    journalVersion: 1,
    head,
    checkpoint: null,
    records: [{ transactionId, id: recordId.value, digest }],
    artifacts: [{ transactionId, digest, bytes: bytes.toString("base64") }],
    events: [
      { transactionId, recordId: recordId.value, event: "record-committed" },
    ],
    outbox: [
      { transactionId, recordId: recordId.value, state: "attempt-started" },
    ],
  });
}

async function waitForOutput(child, expected, timeoutMs = 5_000) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(
      () =>
        finish(new Error(`timed out waiting for ${expected}; got ${output}`)),
      timeoutMs,
    );
    const finish = (error) => {
      clearTimeout(timer);
      child.stdout.off("data", onData);
      child.off("error", onError);
      child.off("exit", onExit);
      if (error) reject(error);
      else resolve(output);
    };
    const onData = (chunk) => {
      output += chunk.toString();
      if (output.includes(expected)) finish();
    };
    const onError = (error) => finish(error);
    const onExit = (code, signal) =>
      finish(
        new Error(
          `writer exited before ${expected}: code=${code} signal=${signal}; ${output}`,
        ),
      );
    child.stdout.on("data", onData);
    child.once("error", onError);
    child.once("exit", onExit);
  });
}

async function killProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("writer did not stop after SIGKILL")),
      5_000,
    );
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
    if (!child.kill("SIGKILL")) {
      clearTimeout(timer);
      reject(new Error("supervisor could not terminate the writer process"));
    }
  });
}

async function inspectFromIndependentProcess(statePath) {
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", readerSource],
    {
      encoding: "utf8",
      timeout: 5_000,
      windowsHide: true,
      env: childEnvironment({
        P5_CRASH_STATE: statePath,
        P5_CRASH_CONTEXT: JSON.stringify(context),
        P5_RECOVERY_MODULE: recoveryModule,
      }),
    },
  );
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("supervised process crash preserves atomic bytes and restart reconciles an uncertain attempt", async () => {
  const genesis = genesisHead(context, "chain-process-restart");
  const initial = withCheckpoint({
    generation: 0,
    journalVersion: 0,
    head: genesis,
    checkpoint: null,
    records: [],
    artifacts: [],
    events: [],
    outbox: [],
  });
  const committed = nextState();

  async function crashAndInspect(phase, readyMarker) {
    const directory = await mkdtemp(join(tmpdir(), "p5-hard-crash-restart-"));
    const statePath = join(directory, "host-uow.json");
    await writeFile(statePath, `${JSON.stringify(initial)}\n`, { mode: 0o600 });
    let child;
    try {
      child = spawn(
        process.execPath,
        ["--input-type=module", "-e", writerSource],
        {
          cwd: process.cwd(),
          windowsHide: true,
          stdio: ["ignore", "pipe", "ignore"],
          env: childEnvironment({
            P5_CRASH_STATE: statePath,
            P5_CRASH_PHASE: phase,
            P5_CRASH_NEXT_STATE: Buffer.from(
              JSON.stringify(committed),
            ).toString("base64"),
          }),
        },
      );
      await waitForOutput(child, readyMarker);
      await killProcess(child);
      assert.ok(
        child.signalCode === "SIGKILL" || child.exitCode !== 0,
        "writer was not terminated by the supervisor",
      );
      const independentRead = await inspectFromIndependentProcess(statePath);
      const generation = phase === "before-rename" ? 0 : 1;
      assert.equal(independentRead.generation, generation);
      assert.deepEqual(independentRead.familyCounts, Array(4).fill(generation));
      assert.equal(independentRead.closureVerified, true);
      assert.equal(independentRead.recovery.status, "ok");
      assert.equal(independentRead.recovery.value.status, "ready");
      assert.equal(
        independentRead.recovery.value.attemptsRequiringReconciliation,
        generation,
      );
      return independentRead;
    } finally {
      if (child && child.exitCode === null && child.signalCode === null)
        await killProcess(child);
      await rm(directory, { recursive: true, force: true });
    }
  }

  const beforeCommit = await crashAndInspect(
    "before-rename",
    "P5_DURABLE_STAGE_READY",
  );
  assert.equal(beforeCommit.generation, 0);
  assert.equal(beforeCommit.recovery.value.workerDiscoveryAllowed, true);

  const afterDurableCommit = await crashAndInspect(
    "after-rename",
    "P5_DURABLE_COMMIT_READY",
  );
  assert.equal(afterDurableCommit.generation, 1);
  assert.equal(
    afterDurableCommit.recovery.value.reasons.includes(
      "DIAG-RECONCILIATION-REQUIRED",
    ),
    true,
  );
  const timedOutStore = {
    async readCheckpoint() {
      return { status: "unavailable", code: "unavailable" };
    },
  };
  const unavailableCheckpoint = await timedOutStore.readCheckpoint();
  const blockedAfterReadTimeout = assessStartupRecovery({
    storeId: "store-p5-process-crash",
    context,
    schemaVersion: 1,
    generation: 0,
    head: genesis,
    journalVersion: 0,
    latestCheckpoint:
      unavailableCheckpoint.status === "ok"
        ? unavailableCheckpoint.value
        : null,
    checkpointChainVerified: false,
    artifactClosureVerified: false,
    eventChainVerified: false,
    observedAt: "2026-10-04T00:00:00.000Z",
    pendingOutboxStates: [],
  });
  assert.equal(blockedAfterReadTimeout.value.status, "blocked");
  assert.equal(blockedAfterReadTimeout.value.workerDiscoveryAllowed, false);
  assert.equal(blockedAfterReadTimeout.value.networkAllowed, false);
  recordP5FaultDetection(
    "P5-FAULT-054",
    beforeCommit.generation === 0 &&
      afterDurableCommit.generation === 1 &&
      afterDurableCommit.recovery.value.attemptsRequiringReconciliation === 1 &&
      blockedAfterReadTimeout.value.networkAllowed === false,
  );
});
