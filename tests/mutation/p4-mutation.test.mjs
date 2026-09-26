import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { inflateRawSync } from "node:zlib";
import { promisify } from "node:util";
import { spawnDssBridge } from "../../internal/xades-provider/worker.mjs";
import test from "node:test";

const built = resolve("evidence/runs/artifacts/build/verifactu/dist");
let serial = 0;

async function mutation(id, control, module, before, after, observe) {
  const temporary = await mkdtemp(join(tmpdir(), "verifactu-p4-mutation-"));
  try {
    const dist = join(temporary, "dist");
    await cp(built, dist, { recursive: true });
    const internal = join(temporary, "internal");
    await cp(resolve("internal/xml-provider"), join(internal, "xml-provider"), {
      recursive: true,
    });
    const xades = join(internal, "xades-provider");
    await mkdir(xades, { recursive: true });
    for (const name of ["provider.mjs", "pki.mjs", "worker.mjs"])
      await cp(resolve("internal/xades-provider", name), join(xades, name));
    await writeFile(join(temporary, "package.json"), '{"type":"module"}\n');
    const javaSource = module.endsWith(".java");
    const target = javaSource
      ? join(temporary, "mutated", module)
      : module.startsWith("internal/")
        ? join(temporary, module)
        : join(dist, module);
    const original = await readFile(
      javaSource ? resolve(module) : target,
      "utf8",
    );
    const edits = Array.isArray(before) ? before : [{ before, after }];
    let mutated = original;
    for (const edit of edits) {
      assert(
        mutated.includes(edit.before),
        `mutation source span missing: ${module}`,
      );
      mutated = mutated.replace(edit.before, edit.after);
    }
    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(target, mutated);
    let jarPath;
    if (javaSource) {
      const javaHome = process.env.JAVA_HOME;
      const jar =
        process.env.VERIFACTU_DSS_JAR ??
        resolve(
          "internal/xades-provider/dss/target/verifactu-xades-provider-0.0.0-development.jar",
        );
      assert.ok(javaHome, "P4-D mutation requires the admitted JAVA_HOME");
      const classes = join(temporary, "mutated-classes");
      await mkdir(classes);
      const javac = join(
        javaHome,
        "bin",
        process.platform === "win32" ? "javac.exe" : "javac",
      );
      await promisify(execFile)(javac, [
        "--release",
        "21",
        "-cp",
        jar,
        "-d",
        classes,
        target,
      ]);
      jarPath = `${classes}${process.platform === "win32" ? ";" : ":"}${jar}`;
    }
    const load = async (path) => {
      const base = path.startsWith("internal/") ? temporary : dist;
      return import(
        `${pathToFileURL(join(base, path)).href}?mutation=${serial++}`
      );
    };
    try {
      await observe({ dist, load, temporary, jarPath });
    } catch (error) {
      assert.equal(
        error?.code,
        "ERR_ASSERTION",
        `${id} failed outside its oracle`,
      );
      assert.match(
        error.message,
        new RegExp(control),
        `${id} was killed by the wrong assertion`,
      );
      return;
    }
    assert.fail(`${id} survived its registered behavioral oracle`);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

async function contextFor(load) {
  const { createIdentity } = await load("domain/identities.js");
  const { createFiscalContext } = await load("domain/context.js");
  const id = (kind, value) => createIdentity(kind, value).value;
  return {
    id,
    context: createFiscalContext({
      tenantId: id("tenant", "mutation-tenant"),
      taxpayerId: id("taxpayer", "mutation-taxpayer"),
      installationId: id("installation", "mutation-installation"),
      editionId: id("edition", "mutation-edition"),
    }).value,
  };
}

const date = "2025-01-01";
const at = "2025-01-01T00:00:00Z";
const xadesBytes = new TextEncoder().encode("<RegistroAlta/>");
const xadesValid = {
  editionId: "rrsif-2026-09-21-authoritative-candidate",
  profileId: "AEAT-XADES-EPES-v0.1.5",
  targetName: "RegistroAlta",
  artifactBytes: xadesBytes,
  artifactDigestSha256: createHash("sha256").update(xadesBytes).digest("hex"),
  signingTime: "2026-09-26T12:00:00Z",
  validationTime: "2026-09-26T12:00:00Z",
  maximumRevocationAgeSeconds: 3_600,
  trustAnchorsDer: [new Uint8Array([1])],
  crlEvidence: [new Uint8Array([2])],
  ocspEvidence: [],
};

function officialSignedVector() {
  const archive = readFileSync(
    "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources/aeat/AnexosEjemplosFirmaRegFact.zip",
  );
  const end = archive.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.notEqual(end, -1);
  let offset = archive.readUInt32LE(end + 16);
  const entries = archive.readUInt16LE(end + 10);
  for (let index = 0; index < entries; index += 1) {
    assert.equal(archive.readUInt32LE(offset), 0x02014b50);
    const compressedBytes = archive.readUInt32LE(offset + 20);
    const nameBytes = archive.readUInt16LE(offset + 28);
    const extraBytes = archive.readUInt16LE(offset + 30);
    const commentBytes = archive.readUInt16LE(offset + 32);
    const localOffset = archive.readUInt32LE(offset + 42);
    const name = archive.toString("utf8", offset + 46, offset + 46 + nameBytes);
    if (name === "ejemploRegistro-firmado-epes-xades4j.xml") {
      const body =
        localOffset +
        30 +
        archive.readUInt16LE(localOffset + 26) +
        archive.readUInt16LE(localOffset + 28);
      return new Uint8Array(
        inflateRawSync(archive.subarray(body, body + compressedBytes)),
      );
    }
    offset += 46 + nameBytes + extraBytes + commentBytes;
  }
  assert.fail("official XAdES vector missing");
}

async function verifyWithBridge(artifactBytes, jarPath) {
  const { createXadesProvider, XADES_EDITION_ID, XADES_PROFILE_ID } =
    await import("../../internal/xades-provider/provider.mjs");
  const provider = createXadesProvider({
    execute: (request, options) =>
      spawnDssBridge(request, { ...options, jarPath }),
  });
  return provider.verify({
    editionId: XADES_EDITION_ID,
    profileId: XADES_PROFILE_ID,
    targetName: "RegistroAlta",
    artifactBytes,
    artifactDigestSha256: createHash("sha256")
      .update(artifactBytes)
      .digest("hex"),
    trustAnchorsDer: [],
    crlEvidence: [],
    ocspEvidence: [],
    validationTime: "2025-02-04T00:00:00Z",
    maximumRevocationAgeSeconds: 86_400,
  });
}
const digestPort = {
  providerId: "test:node-crypto",
  digest: (algorithm, bytes) =>
    createHash(algorithm).update(bytes).digest("hex"),
};
const digest = (bytes) =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

test("P4-MUT-001 kills a skipped domain codec stage", async () => {
  await mutation(
    "P4-MUT-001",
    "P4-CB-001",
    "contracts/staged-codec.js",
    "if (!runCheck(schema.validateDomain, value))",
    "if (false && !runCheck(schema.validateDomain, value))",
    async ({ load }) => {
      const { decodeJson } = await load("contracts/staged-codec.js");
      const result = decodeJson(
        new TextEncoder().encode('{"id":"x","kind":"alta"}'),
        { required: ["id", "kind"], validateDomain: () => false },
      );
      assert.equal(
        result.status,
        "invalid",
        "P4-CB-001 domain-stage assertion",
      );
    },
  );
});

test("P4-MUT-002 kills duplicate JSON member acceptance", async () => {
  await mutation(
    "P4-MUT-002",
    "P4-CB-002",
    "contracts/staged-codec.js",
    "if (Object.hasOwn(out, key))",
    "if (false && Object.hasOwn(out, key))",
    async ({ load }) => {
      const { decodeJson } = await load("contracts/staged-codec.js");
      const result = decodeJson(
        new TextEncoder().encode('{"id":"first","id":"second","kind":"alta"}'),
        { required: ["id", "kind"] },
      );
      assert.equal(
        result.status,
        "invalid",
        "P4-CB-002 duplicate-member assertion",
      );
    },
  );
});

test("P4-MUT-003 kills cross-kind identity substitution", async () => {
  await mutation(
    "P4-MUT-003",
    "P4-CB-003",
    "domain/identities.js",
    "candidate.kind === kind",
    "true",
    async ({ load }) => {
      const { isIdentity } = await load("domain/identities.js");
      assert.equal(
        isIdentity({ kind: "taxpayer", value: "x" }, "tenant"),
        false,
        "P4-CB-003 identity-kind assertion",
      );
    },
  );
});

test("P4-MUT-004 kills omitted fiscal context identity", async () => {
  await mutation(
    "P4-MUT-004",
    "P4-CB-004",
    "domain/context.js",
    '!isIdentity(input.editionId, "edition")',
    "false",
    async ({ load }) => {
      const { createIdentity } = await load("domain/identities.js");
      const { createFiscalContext } = await load("domain/context.js");
      const get = (kind) => createIdentity(kind, "x").value;
      const result = createFiscalContext({
        tenantId: get("tenant"),
        taxpayerId: get("taxpayer"),
        installationId: get("installation"),
        editionId: null,
      });
      assert.equal(
        result.status,
        "invalid",
        "P4-CB-004 context completeness assertion",
      );
    },
  );
});

test("P4-MUT-005 kills floating-point decimal coercion", async () => {
  await mutation(
    "P4-MUT-005",
    "P4-CB-005",
    "domain/decimal.js",
    "!Number.isSafeInteger(value) || Object.is(value, -0)",
    "Object.is(value, -0)",
    async ({ load }) => {
      const { decimalFromNumber } = await load("domain/decimal.js");
      const result = decimalFromNumber(1.5, {
        maxIntegerDigits: 3,
        maxScale: 2,
      });
      assert.equal(
        result.status,
        "invalid",
        "P4-CB-005 unsafe number assertion",
      );
    },
  );
});

test("P4-MUT-006 kills an instant without an explicit offset", async () => {
  await mutation(
    "P4-MUT-006",
    "P4-CB-006",
    "domain/date-time.js",
    "(Z|[+-]\\d{2}:(\\d{2}))$",
    "(Z|[+-]\\d{2}:(\\d{2}))?$",
    async ({ load }) => {
      const { createFiscalInstant } = await load("domain/date-time.js");
      const result = createFiscalInstant("2025-01-01T12:00:00");
      assert.equal(
        result.status,
        "invalid",
        "P4-CB-006 explicit-offset assertion",
      );
    },
  );
});

test("P4-FAULT-006 detects an implicit wall-clock read", async () => {
  await mutation(
    "P4-FAULT-006",
    "P4-FAULT-006",
    "domain/date-time.js",
    '!Number.isFinite(Date.parse(value)))\n        return invalid("DIAG-INSTANT-INVALID", "domain");\n    return ok(value);',
    '!Number.isFinite(Date.parse(value)))\n        return invalid("DIAG-INSTANT-INVALID", "domain");\n    return ok(new Date().toISOString());',
    async ({ load }) => {
      const { createFiscalInstant } = await load("domain/date-time.js");
      const input = "2025-01-01T12:00:00Z";
      const result = createFiscalInstant(input);
      assert.equal(
        result.value,
        input,
        "P4-FAULT-006 explicit-time determinism",
      );
    },
  );
});

test("P4-MUT-007 kills record kind confusion", async () => {
  await mutation(
    "P4-MUT-007",
    "P4-CB-007",
    "domain/records.js",
    'input.kind !== "alta" ||',
    "false ||",
    async ({ load }) => {
      const { createIdentity } = await load("domain/identities.js");
      const { createFiscalContext } = await load("domain/context.js");
      const { createFiscalDate, createFiscalInstant } = await load(
        "domain/date-time.js",
      );
      const { createDecimal } = await load("domain/decimal.js");
      const { createAltaRecord } = await load("domain/records.js");
      const get = (kind, value) => createIdentity(kind, value).value;
      const taxpayer = get("taxpayer", "taxpayer");
      const context = createFiscalContext({
        tenantId: get("tenant", "tenant"),
        taxpayerId: taxpayer,
        installationId: get("installation", "installation"),
        editionId: get("edition", "edition"),
      }).value;
      const result = createAltaRecord({
        kind: "anulacion",
        id: get("record", "record"),
        context,
        document: {
          issuer: taxpayer,
          series: "A",
          number: "1",
          issueDate: date,
        },
        issueDate: createFiscalDate(date).value,
        generatedAt: createFiscalInstant(at).value,
        total: createDecimal("1", { maxIntegerDigits: 2, maxScale: 0 }).value,
        predecessorId: null,
        editionId: context.editionId,
      });
      assert.equal(result.status, "invalid", "P4-CB-007 record-kind assertion");
    },
  );
});

test("P4-MUT-008 kills correction history loss", async () => {
  await mutation(
    "P4-MUT-008",
    "P4-CB-008",
    "domain/corrections.js",
    "...graph.relations,",
    "...graph.relations.slice(1),",
    async ({ load }) => {
      const { createIdentity, createFiscalDocumentIdentity } = await load(
        "domain/identities.js",
      );
      const { createFiscalContext } = await load("domain/context.js");
      const { addCorrection } = await load("domain/corrections.js");
      const get = (kind, value) => createIdentity(kind, value).value;
      const taxpayer = get("taxpayer", "taxpayer");
      const context = createFiscalContext({
        tenantId: get("tenant", "tenant"),
        taxpayerId: taxpayer,
        installationId: get("installation", "installation"),
        editionId: get("edition", "edition"),
      }).value;
      const doc = (number) =>
        createFiscalDocumentIdentity({
          issuer: taxpayer,
          series: "A",
          number,
          issueDate: date,
        }).value;
      const first = addCorrection(
        { relations: [] },
        {
          kind: "correction",
          context,
          source: doc("2"),
          target: doc("1"),
          evidenceId: "first",
        },
      );
      const result = addCorrection(first.value, {
        kind: "substitution",
        context,
        source: doc("3"),
        target: doc("2"),
        evidenceId: "second",
      });
      assert.equal(result.status, "ok");
      assert.equal(
        result.value.relations.length,
        2,
        "P4-CB-008 history assertion",
      );
    },
  );
});

test("P4-MUT-009 kills unapproved mode rollback", async () => {
  await mutation(
    "P4-MUT-009",
    "P4-CB-009",
    "domain/mode-tenure.js",
    "!allowRollback",
    "false && !allowRollback",
    async ({ load }) => {
      const { createIdentity } = await load("domain/identities.js");
      const { createFiscalContext } = await load("domain/context.js");
      const { transitionMode } = await load("domain/mode-tenure.js");
      const get = (kind) => createIdentity(kind, "x").value;
      const context = createFiscalContext({
        tenantId: get("tenant"),
        taxpayerId: get("taxpayer"),
        installationId: get("installation"),
        editionId: get("edition"),
      }).value;
      const previous = {
        context,
        mode: "verifactu",
        effectiveFrom: "2024-01-01T00:00:00Z",
        effectiveUntil: "2025-01-01T00:00:00Z",
        authorizationId: "auth",
        evidenceId: "evidence",
      };
      const result = transitionMode(previous, {
        ...previous,
        mode: "nonVerifactu",
        effectiveFrom: "2025-01-01T00:00:00Z",
        effectiveUntil: null,
      });
      assert.equal(result.status, "invalid", "P4-CB-009 rollback assertion");
    },
  );
});

test("P4-MUT-010 kills inclusive mode tenure end time", async () => {
  await mutation(
    "P4-MUT-010",
    "P4-CB-010",
    "domain/mode-tenure.js",
    "Date.parse(at) < Date.parse(t.effectiveUntil)",
    "Date.parse(at) <= Date.parse(t.effectiveUntil)",
    async ({ load }) => {
      const { createIdentity } = await load("domain/identities.js");
      const { createFiscalContext } = await load("domain/context.js");
      const { resolveMode } = await load("domain/mode-tenure.js");
      const get = (kind) => createIdentity(kind, "x").value;
      const context = createFiscalContext({
        tenantId: get("tenant"),
        taxpayerId: get("taxpayer"),
        installationId: get("installation"),
        editionId: get("edition"),
      }).value;
      const tenure = {
        context,
        mode: "nonVerifactu",
        effectiveFrom: "2025-01-01T00:00:00Z",
        effectiveUntil: "2025-01-02T00:00:00Z",
        authorizationId: "auth",
        evidenceId: "evidence",
      };
      assert.equal(
        resolveMode([tenure], tenure.effectiveUntil, context).status,
        "indeterminate",
        "P4-CB-010 effective-end assertion",
      );
    },
  );
});

test("P4-MUT-011 kills mixed regulated-event predecessor identity", async () => {
  await mutation(
    "P4-MUT-011",
    "P4-CB-011",
    "domain/events.js",
    "!sameIdentity(event.previousEventId, previous.id)",
    "false",
    async ({ load }) => {
      const { createIdentity } = await load("domain/identities.js");
      const { createFiscalContext } = await load("domain/context.js");
      const { appendEvent } = await load("domain/events.js");
      const get = (kind, value) => createIdentity(kind, value).value;
      const context = createFiscalContext({
        tenantId: get("tenant", "tenant"),
        taxpayerId: get("taxpayer", "taxpayer"),
        installationId: get("installation", "installation"),
        editionId: get("edition", "edition"),
      }).value;
      const first = {
        id: get("event", "event-1"),
        context,
        code: "START",
        occurredAt: at,
        observedAt: at,
        previousEventId: null,
      };
      const sequence = appendEvent({ context, events: [] }, first).value;
      const second = {
        ...first,
        id: get("event", "event-2"),
        occurredAt: "2025-01-02T00:00:00Z",
        previousEventId: get("event", "foreign-event"),
      };
      const result = appendEvent(sequence, second);
      assert.equal(result.status, "invalid", "P4-CB-011 event-chain assertion");
    },
  );
});

test("P4-MUT-012 kills collapsed terminal outcomes", async () => {
  await mutation(
    "P4-MUT-012",
    "P4-CB-012",
    "domain/states.js",
    "return TERMINAL_OUTCOMES.includes(value);",
    'return value === "accepted";',
    async ({ load }) => {
      const { isTerminalOutcome } = await load("domain/states.js");
      assert.equal(
        isTerminalOutcome("rejected"),
        true,
        "P4-CB-012 terminal outcome distinction assertion",
      );
    },
  );
});

test("P4-MUT-013 kills indeterminate construction advancing a chain", async () => {
  await mutation(
    "P4-MUT-013",
    "P4-CB-013",
    "domain/invariants.js",
    'outcome.status === "accepted"',
    'outcome.status !== "rejected"',
    async ({ load }) => {
      const fixture = await contextFor(load);
      const { chainEligible } = await load("domain/invariants.js");
      const result = chainEligible(
        {
          status: "indeterminate",
          diagnostics: [],
          requiredEvidence: ["evidence"],
          value: { context: fixture.context },
        },
        fixture.context,
      );
      assert.equal(result, false, "P4-CB-013 chain eligibility assertion");
    },
  );
});

test("P4-MUT-014 kills out-of-order billing sequence acceptance", async () => {
  await mutation(
    "P4-MUT-014",
    "P4-CB-014",
    "domain/sequences.js",
    "Date.parse(item.occurredAt) < Date.parse(previous.occurredAt)",
    "false",
    async ({ load }) => {
      const { id, context } = await contextFor(load);
      const { appendSequence } = await load("domain/sequences.js");
      const first = {
        id: id("record", "record-1"),
        context,
        occurredAt: "2025-01-02T00:00:00Z",
        predecessorId: null,
      };
      const sequence = appendSequence({ context, records: [] }, first).value;
      const result = appendSequence(sequence, {
        ...first,
        id: id("record", "record-2"),
        occurredAt: at,
        predecessorId: first.id,
      });
      assert.equal(result.status, "invalid", "P4-CB-014 chronology assertion");
    },
  );
});

test("P4-MUT-015 kills swapped predecessor and current digest fields", async () => {
  await mutation(
    "P4-MUT-015",
    "P4-CB-015",
    "domain/chains.js",
    "recordId,\n        previousDigest,\n        currentDigest,",
    "recordId,\n        previousDigest: currentDigest,\n        currentDigest: previousDigest,",
    async ({ load }) => {
      const { id, context } = await contextFor(load);
      const { createChainLink } = await load("domain/chains.js");
      const input = new TextEncoder().encode("record-bytes");
      const result = createChainLink(
        context,
        id("record", "record-1"),
        null,
        input,
        digest,
      );
      assert.equal(
        result.value.previousDigest,
        null,
        "P4-CB-015 genesis predecessor assertion",
      );
      assert.equal(
        result.value.currentDigest,
        digest(input),
        "P4-CB-015 current digest assertion",
      );
    },
  );
});

test("P4-MUT-016 kills duplicate complete-chain fork acceptance", async () => {
  await mutation(
    "P4-MUT-016",
    "P4-CB-016",
    "domain/chains.js",
    "if (records.has(key))",
    "if (false && records.has(key))",
    async ({ load }) => {
      const { id, context } = await contextFor(load);
      const { createChainLink, verifyCompleteChain } =
        await load("domain/chains.js");
      const input = new TextEncoder().encode("record-bytes");
      const link = createChainLink(
        context,
        id("record", "record-1"),
        null,
        input,
        digest,
      ).value;
      const result = verifyCompleteChain(
        [link, link],
        new Map([[link.recordId.value, input]]),
        context,
        link.currentDigest,
        digest,
      );
      assert.equal(result.code, "DIAG-CHAIN-FORK", "P4-CB-016 fork assertion");
    },
  );
});

test("P4-MUT-017 kills undeclared plan effect acceptance", async () => {
  await mutation(
    "P4-MUT-017",
    "P4-CB-017",
    "application/operation-plan.js",
    "input.effects.length !== 0",
    "false",
    async ({ load }) => {
      const { id, context } = await contextFor(load);
      const { createOperationPlan } = await load(
        "application/operation-plan.js",
      );
      const result = createOperationPlan({
        operationId: id("operation", "op"),
        context,
        editionId: context.editionId,
        expectedHead: null,
        expiresAt: at,
        actions: ["validate"],
        effects: ["network"],
      });
      assert.equal(
        result.status,
        "invalid",
        "P4-CB-017 undeclared effect assertion",
      );
    },
  );
});

test("P4-MUT-018 kills mutable plan output", async () => {
  await mutation(
    "P4-MUT-018",
    "P4-CB-018",
    "application/record-planner.js",
    "return ok(Object.freeze({",
    "return ok(({",
    async ({ load }) => {
      const { id, context } = await contextFor(load);
      const { createDecimal } = await load("domain/decimal.js");
      const { createAltaRecord } = await load("domain/records.js");
      const { planRecord } = await load("application/record-planner.js");
      const record = createAltaRecord({
        kind: "alta",
        id: id("record", "r"),
        context,
        document: {
          issuer: context.taxpayerId,
          series: "s",
          number: "n",
          issueDate: date,
        },
        issueDate: date,
        generatedAt: at,
        total: createDecimal("1", { maxIntegerDigits: 3, maxScale: 2 }).value,
        predecessorId: null,
        editionId: context.editionId,
      }).value;
      const plan = planRecord({
        record,
        operationId: id("operation", "op"),
        expectedHead: null,
        expiresAt: at,
        digest: digestPort,
      }).value;
      assert.equal(
        Object.isFrozen(plan),
        true,
        "P4-CB-018 immutable plan assertion",
      );
    },
  );
});

test("P4-MUT-019 kills undeclared absence in official projection", async () => {
  await mutation(
    "P4-MUT-019",
    "P4-CB-019",
    "application/official-projection.js",
    "field.allowAbsent !== true",
    "false",
    async ({ load }) => {
      const { projectOfficialFields } = await load(
        "application/official-projection.js",
      );
      assert.equal(
        projectOfficialFields([
          { name: "A", order: 0, value: { presence: "absent" } },
        ]).status,
        "invalid",
        "P4-CB-019 absence assertion",
      );
    },
  );
});

test("P4-MUT-020 kills official separator drift", async () => {
  await mutation(
    "P4-MUT-020",
    "P4-CB-020",
    "application/official-serialization.js",
    "rule.separator + lexical",
    '"" + lexical',
    async ({ load }) => {
      const { serializeOfficialProjection } = await load(
        "application/official-serialization.js",
      );
      const result = serializeOfficialProjection(
        [{ name: "A", order: 0, presence: "value", value: "1" }],
        {
          editionId: { kind: "edition", value: "e" },
          label: "FP",
          separator: "&",
          encoding: "utf-8",
          fields: ["A"],
        },
      );
      assert.equal(
        result.value.text,
        "FP&1",
        "P4-CB-020 official separator assertion",
      );
    },
  );
});

test("P4-MUT-021 kills a fingerprint edition mismatch", async () => {
  await mutation(
    "P4-MUT-021",
    "P4-CB-021",
    "application/fingerprint.js",
    "input.rule.editionId.value !== input.editionId.value",
    "false",
    async ({ load }) => {
      const { id } = await contextFor(load);
      const { createFingerprint } = await load("application/fingerprint.js");
      assert.equal(
        createFingerprint({
          editionId: id("edition", "e"),
          expectedEditionId: id("edition", "e"),
          algorithm: "sha256",
          fields: [{ name: "A", order: 0, presence: "value", value: "1" }],
          rule: {
            editionId: id("edition", "other"),
            label: "FP",
            separator: "&",
            encoding: "utf-8",
            fields: ["A"],
          },
          digest: digestPort,
        }).status,
        "invalid",
        "P4-CB-021 algorithm allowlist assertion",
      );
    },
  );
});

test("P4-MUT-022 kills exact artifact byte custody substitution", async () => {
  await mutation(
    "P4-MUT-022",
    "P4-CB-022",
    "application/xml-artifacts.js",
    "Boolean(originalBytes) &&\n        originalBytes !== undefined &&\n        bytesEqual(expectedBytes, originalBytes)",
    "true",
    async ({ load }) => {
      const { id, context } = await contextFor(load);
      const { createHash } = await import("node:crypto");
      const { createXmlArtifact, transitionXmlArtifact } = await load(
        "application/xml-artifacts.js",
      );
      const original = new TextEncoder().encode("123456789");
      const artifact = createXmlArtifact(
        {
          artifactId: "a",
          context,
          editionId: context.editionId,
          kind: "xml",
          mediaType: "application/xml",
          bytes: original,
          parentIds: [],
          transform: "serialize",
          state: "produced",
        },
        digestPort,
      ).value;
      const replacement = new TextEncoder().encode("987654321");
      const tampered = {
        ...artifact,
        bytes: replacement,
        sha256:
          "sha256:" + createHash("sha256").update(replacement).digest("hex"),
        sha512:
          "sha512:" + createHash("sha512").update(replacement).digest("hex"),
      };
      assert.equal(
        transitionXmlArtifact(
          tampered,
          "bounded-and-digested",
          replacement,
          digestPort,
        ).status,
        "invalid",
        "P4-CB-022 byte custody assertion",
      );
    },
  );
});

test("P4-MUT-023 kills a permissive DTD and entity declaration policy", async () => {
  await mutation(
    "P4-MUT-023",
    "P4-CB-023",
    "internal/xml-provider/worker.mjs",
    "if docinfo.doctype or docinfo.internalDTD is not None or docinfo.externalDTD is not None:",
    "if False:",
    async ({ load }) => {
      const { createXmlXsdProvider, PINNED_SCHEMAS, XML_EDITION_ID } =
        await load("internal/xml-provider/provider.mjs");
      const base = resolve(
        "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources",
      );
      const schemas = [
        {
          id: "xsd-suministro-informacion",
          bytes: await readFile(join(base, "aeat/SuministroInformacion.xsd")),
          sha256: PINNED_SCHEMAS["xsd-suministro-informacion"].sha256,
        },
        {
          id: "xmldsig-schema",
          bytes: await readFile(
            join(base, "standards/xmldsig-core-schema.xsd"),
          ),
          sha256: PINNED_SCHEMAS["xmldsig-schema"].sha256,
        },
      ];
      const result = await createXmlXsdProvider().validate({
        editionId: XML_EDITION_ID,
        rootSchemaId: "xsd-suministro-informacion",
        schemas,
        xml: Buffer.from("<!DOCTYPE RegistroAlta><RegistroAlta/>", "utf8"),
      });
      assert.equal(
        result.diagnostics[0],
        "DIAG-XML-DOCTYPE",
        "P4-CB-023 DTD rejection assertion",
      );
    },
  );
});

test("P4-MUT-024 kills missing in-parse node-count enforcement", async () => {
  await mutation(
    "P4-MUT-024",
    "P4-CB-024",
    "internal/xml-provider/worker.mjs",
    "nodes += 1\n                attributes += len(item.attrib)",
    "nodes += 0\n                attributes += len(item.attrib)",
    async ({ load }) => {
      const { createXmlXsdProvider, PINNED_SCHEMAS, XML_EDITION_ID } =
        await load("internal/xml-provider/provider.mjs");
      const base = resolve(
        "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources",
      );
      const schemas = [
        {
          id: "xsd-suministro-informacion",
          bytes: await readFile(join(base, "aeat/SuministroInformacion.xsd")),
          sha256: PINNED_SCHEMAS["xsd-suministro-informacion"].sha256,
        },
        {
          id: "xmldsig-schema",
          bytes: await readFile(
            join(base, "standards/xmldsig-core-schema.xsd"),
          ),
          sha256: PINNED_SCHEMAS["xmldsig-schema"].sha256,
        },
      ];
      const xml = Buffer.from(`<r>${"<n/>".repeat(100_001)}</r>`, "utf8");
      const result = await createXmlXsdProvider().validate({
        editionId: XML_EDITION_ID,
        rootSchemaId: "xsd-suministro-informacion",
        schemas,
        xml,
      });
      assert.equal(result.status, "limit", "P4-CB-024 limit status assertion");
      assert.equal(
        result.diagnostics[0],
        "DIAG-XML-NODES",
        "P4-CB-024 node-count assertion",
      );
    },
  );
});

test("P4-MUT-025 kills semantic-validity promotion by the XSD provider", async () => {
  await mutation(
    "P4-MUT-025",
    "P4-CB-025",
    "internal/xml-provider/provider.mjs",
    'return outcome("valid", "valid", semantic, []);',
    'return outcome("valid", "valid", "valid", []);',
    async ({ load }) => {
      const { createXmlXsdProvider, PINNED_SCHEMAS, XML_EDITION_ID } =
        await load("internal/xml-provider/provider.mjs");
      const base = resolve(
        "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources",
      );
      const schemas = [
        {
          id: "xsd-suministro-informacion",
          bytes: await readFile(join(base, "aeat/SuministroInformacion.xsd")),
          sha256: PINNED_SCHEMAS["xsd-suministro-informacion"].sha256,
        },
        {
          id: "xmldsig-schema",
          bytes: await readFile(
            join(base, "standards/xmldsig-core-schema.xsd"),
          ),
          sha256: PINNED_SCHEMAS["xmldsig-schema"].sha256,
        },
      ];
      const result = await createXmlXsdProvider({
        execute: async () => ({ kind: "valid", diagnostics: [] }),
      }).validate({
        editionId: XML_EDITION_ID,
        rootSchemaId: "xsd-suministro-informacion",
        schemas,
        xml: Buffer.from("<valid/>", "utf8"),
        semanticStatus: "invalid",
      });
      assert.equal(
        result.semantic,
        "invalid",
        "P4-CB-025 semantic separation assertion",
      );
    },
  );
});

if (process.env.VERIFACTU_JAVA_MUTATION === "1") {
  test("P4-MUT-026 detects duplicate IDs in the signed XAdES target", async () => {
    await mutation(
      "P4-MUT-026",
      "P4-CB-026",
      "internal/xades-provider/dss/src/main/java/eu/noeos/verifactu/bridge/DssBridge.java",
      "if (e.hasAttribute(attr) && !ids.add(e.getAttribute(attr))) return false;",
      "if (false) return false;",
      async ({ jarPath }) => {
        const source = officialSignedVector();
        const text = new TextDecoder()
          .decode(source)
          .replace("<sum1:IDVersion>", '<sum1:IDVersion Id="duplicate">')
          .replace("<sum1:IDFactura>", '<sum1:IDFactura Id="duplicate">');
        const result = await verifyWithBridge(
          new TextEncoder().encode(text),
          jarPath,
        );
        assert.equal(
          result.profile,
          "invalid",
          "P4-CB-026 duplicate ID profile assertion",
        );
      },
    );
  });

  test("P4-MUT-027 detects extra references in the signed XAdES profile", async () => {
    await mutation(
      "P4-MUT-027",
      "P4-CB-027",
      "internal/xades-provider/dss/src/main/java/eu/noeos/verifactu/bridge/DssBridge.java",
      [
        {
          before: "signedInfoChildren.size() != 4",
          after: "signedInfoChildren.size() < 4",
        },
        { before: "refs.size() != 2", after: "refs.size() < 2" },
      ],
      undefined,
      async ({ jarPath }) => {
        const source = officialSignedVector();
        const text = new TextDecoder()
          .decode(source)
          .replace(
            "</ds:SignedInfo>",
            '<ds:Reference URI="https://example.invalid/attacker"><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=</ds:DigestValue></ds:Reference></ds:SignedInfo>',
          );
        const result = await verifyWithBridge(
          new TextEncoder().encode(text),
          jarPath,
        );
        assert.equal(
          result.profile,
          "invalid",
          "P4-CB-027 exact reference profile assertion",
        );
      },
    );
  });
}

test("P4-MUT-028 preserves separate chain and trust outcomes", async () => {
  await mutation(
    "P4-MUT-028",
    "P4-CB-028",
    "internal/xades-provider/pki.mjs",
    '    "trust",\n    "time",',
    '    "time",',
    async ({ load }) => {
      const { normalizeCertificateAssessment } = await load(
        "internal/xades-provider/pki.mjs",
      );
      const result = normalizeCertificateAssessment({
        chain: "valid",
        trust: "indeterminate",
        time: "valid",
        usage: "valid",
        identity: "valid",
        authorization: "indeterminate",
        algorithm: "valid",
      });
      assert.equal(
        result.outcomes.trust,
        "indeterminate",
        "P4-CB-028 separated trust outcome assertion",
      );
    },
  );
});

test("P4-MUT-037 rejects substitution of the permitted XAdES profile", async () => {
  await mutation(
    "P4-MUT-037",
    "P4-CB-037",
    "internal/xades-provider/provider.mjs",
    "if (\n    request.editionId !== XADES_EDITION_ID ||\n    request.profileId !== XADES_PROFILE_ID\n  )",
    "if (false)",
    async ({ load }) => {
      const { createXadesProvider } = await load(
        "internal/xades-provider/provider.mjs",
      );
      const result = await createXadesProvider({
        execute: async () => {
          throw new Error("must not execute");
        },
      }).verify({ ...xadesValid, profileId: "attacker-profile" });
      assert.equal(
        result.diagnostics[0],
        "DIAG-XADES-EDITION",
        "P4-CB-037 pinned profile assertion",
      );
    },
  );
});

test("P4-MUT-038 rejects signed bytes whose independent verification is invalid", async () => {
  await mutation(
    "P4-MUT-038",
    "P4-CB-038",
    "internal/xades-provider/provider.mjs",
    'if (\n    verification.profile !== "valid" ||\n    verification.cryptographic !== "valid"\n  )',
    "if (false)",
    async ({ load }) => {
      const { createXadesProvider } = await load(
        "internal/xades-provider/provider.mjs",
      );
      const execute = async (request) => {
        if (request.command === "SIGN_PREPARE")
          return {
            kind: "TBS",
            diagnostic: "NONE",
            payload: new Uint8Array(256),
          };
        if (request.command === "SIGN_COMPLETE")
          return {
            kind: "SIGNED",
            diagnostic: "NONE",
            payload: new TextEncoder().encode("<RegistroAlta/> "),
          };
        return {
          kind: "INDETERMINATE",
          diagnostic: "NONE",
          payload: new TextEncoder().encode(
            "VALID\tINVALID\tVALID\tUNKNOWN\tNONE\t0\t0",
          ),
        };
      };
      const provider = createXadesProvider({ execute });
      const result = await provider.sign({
        ...xadesValid,
        signer: {
          keyHandle: "test:opaque-key",
          certificateDer: new Uint8Array([3]),
          certificateChainDer: [],
          sign: async (data) => new Uint8Array(data.byteLength).fill(9),
        },
      });
      assert.equal(
        result.status,
        "invalid",
        "P4-CB-038 output signature verification assertion",
      );
    },
  );
});

test("P4-MUT-039 rejects revocation evidence outside its caller-time interval", async () => {
  await mutation(
    "P4-MUT-039",
    "P4-CB-039",
    "internal/xades-provider/pki.mjs",
    "thisUpdate > instant ||",
    "false ||",
    async ({ load }) => {
      const { normalizePkiObservation } = await load(
        "internal/xades-provider/pki.mjs",
      );
      const instant = Date.parse("2026-09-26T12:00:00Z");
      const result = normalizePkiObservation(
        {
          status: "valid",
          thisUpdateMs: instant + 1_000,
          nextUpdateMs: instant + 60_000,
        },
        {
          validationTimeMs: instant,
          maximumRevocationAgeSeconds: 3_600,
          crlEvidence: [new Uint8Array([1])],
          ocspEvidence: [],
        },
      );
      assert.equal(
        result.status,
        "stale",
        "P4-CB-039 caller-time evidence interval assertion",
      );
    },
  );
});

test("P4-MUT-029 keeps stale revocation evidence indeterminate", async () => {
  await mutation(
    "P4-MUT-029",
    "P4-CB-029",
    "internal/xades-provider/pki.mjs",
    'if (observation.status === "stale")\n    return Object.freeze({\n      status: "stale",\n      thisUpdateMs: observation.thisUpdateMs,\n      nextUpdateMs: observation.nextUpdateMs,\n    });',
    'if (observation.status === "stale")\n    return Object.freeze({\n      status: "valid",\n      thisUpdateMs: observation.thisUpdateMs,\n      nextUpdateMs: observation.nextUpdateMs,\n    });',
    async ({ load }) => {
      const { normalizePkiObservation } = await load(
        "internal/xades-provider/pki.mjs",
      );
      const result = normalizePkiObservation(
        { status: "stale", thisUpdateMs: 10, nextUpdateMs: 20 },
        {
          validationTimeMs: 15,
          maximumRevocationAgeSeconds: 60,
          crlEvidence: [new Uint8Array([1])],
          ocspEvidence: [],
        },
      );
      assert.equal(
        result.status,
        "stale",
        "P4-CB-029 stale evidence fail-closed assertion",
      );
    },
  );
});

test("P4-MUT-040 keeps unknown revocation evidence indeterminate", async () => {
  await mutation(
    "P4-MUT-040",
    "P4-CB-040",
    "internal/xades-provider/pki.mjs",
    'if (observation.status === "unknown")\n    return Object.freeze({\n      status: "unknown",\n      thisUpdateMs: null,\n      nextUpdateMs: null,\n    });',
    'if (observation.status === "unknown")\n    return Object.freeze({\n      status: "valid",\n      thisUpdateMs: null,\n      nextUpdateMs: null,\n    });',
    async ({ load }) => {
      const { normalizePkiObservation } = await load(
        "internal/xades-provider/pki.mjs",
      );
      const result = normalizePkiObservation(
        { status: "unknown" },
        {
          validationTimeMs: Date.parse("2026-09-26T12:00:00Z"),
          maximumRevocationAgeSeconds: 3_600,
          crlEvidence: [new Uint8Array([1])],
          ocspEvidence: [],
        },
      );
      assert.equal(
        result.status,
        "unknown",
        "P4-CB-040 unknown evidence fail-closed assertion",
      );
    },
  );
});

test("P4-MUT-041 prevents network-enabled Java policy in the DSS worker", async () => {
  await mutation(
    "P4-MUT-041",
    "P4-CB-041",
    "internal/xades-provider/worker.mjs",
    '"-Djava.security.manager=allow",',
    '"-Djava.security.manager=disallow",',
    async ({ load }) => {
      const { DSS_JVM_OPTIONS } = await load(
        "internal/xades-provider/worker.mjs",
      );
      assert.ok(
        DSS_JVM_OPTIONS.includes("-Djava.security.manager=allow"),
        "P4-CB-041 process network-deny assertion",
      );
    },
  );
});
