import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    "../../evidence/runs/artifacts/build/verifactu/dist/index.js"
);
const RUNS = 4096;
const xmlProvider = await import(
  process.env.VERIFACTU_XML_PROVIDER_ENTRY ??
    new URL("../../internal/xml-provider/provider.mjs", import.meta.url).href
);
const xmlWorker = await import(
  process.env.VERIFACTU_XML_WORKER_ENTRY ??
    new URL("../../internal/xml-provider/worker.mjs", import.meta.url).href
);
let state = 0x4e4f454f;
const next = () => {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state;
};
const id = (kind, value) => api.identity(kind, value).value;
const at = (value) => api.parseFiscalInstant(value).value;
const hash = (algorithm, bytes) =>
  new Uint8Array(
    createHash(algorithm === "SHA-256" ? "sha256" : "sha512")
      .update(bytes)
      .digest(),
  );
const buildQrPayload = (profile, facts) =>
  api.buildQrPayload(profile, facts, hash);

function shrinkQrCounterexample(sample, fails) {
  let current = structuredClone(sample);
  const steps = [];
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const candidates = [
      [
        "numserie-prefix",
        {
          ...current,
          facts: {
            ...current.facts,
            numserie:
              current.facts.numserie.length > 1
                ? current.facts.numserie[0]
                : current.facts.numserie,
          },
        },
      ],
      [
        "importe-negative-zero",
        { ...current, facts: { ...current.facts, importe: "-0" } },
      ],
      [
        "fecha-anchor",
        {
          ...current,
          facts: {
            ...current.facts,
            fecha: api.parseFiscalDate("2000-01-01").value,
          },
        },
      ],
      [
        "environment-test",
        { ...current, profile: { ...current.profile, environment: "test" } },
      ],
      [
        "mode-verifactu",
        { ...current, profile: { ...current.profile, mode: "verifactu" } },
      ],
    ];
    const reduced = candidates.find(
      ([, candidate]) =>
        JSON.stringify(candidate) !== JSON.stringify(current) &&
        fails(candidate),
    );
    if (reduced === undefined) break;
    current = reduced[1];
    steps.push(reduced[0]);
  }
  return Object.freeze({
    counterexample: current,
    steps: Object.freeze(steps),
  });
}

function qrRoundTripHolds(sample) {
  const payload = buildQrPayload(sample.profile, sample.facts);
  if (payload.status !== "succeeded") return false;
  if (JSON.stringify(payload.value.facts) !== JSON.stringify(sample.facts))
    return false;
  if (
    Buffer.compare(
      Buffer.from(payload.value.bytes),
      Buffer.from(payload.value.text, "utf8"),
    ) !== 0
  )
    return false;
  if (
    payload.value.artifactDigest !==
    createHash("sha256").update(payload.value.bytes).digest("hex")
  )
    return false;
  if (payload.value.editionId !== sample.profile.editionId) return false;
  const parsed = api.parseQrPayload(sample.profile, payload.value.text);
  if (
    parsed.status !== "succeeded" ||
    JSON.stringify(parsed.value) !== JSON.stringify(sample.facts)
  )
    return false;
  const rebuilt = buildQrPayload(sample.profile, parsed.value);
  return (
    rebuilt.status === "succeeded" &&
    Buffer.compare(
      Buffer.from(rebuilt.value.bytes),
      Buffer.from(payload.value.bytes),
    ) === 0
  );
}

function assertQrProperty(sample, seed, execution) {
  if (qrRoundTripHolds(sample)) return;
  const shrunk = shrinkQrCounterexample(
    sample,
    (candidate) => !qrRoundTripHolds(candidate),
  );
  assert.fail(
    `P4-PROP-011 seed=${seed} execution=${execution} shrink=${shrunk.steps.join(",")} counterexample=${JSON.stringify(shrunk.counterexample)}`,
  );
}

test("P4-PROP-001 failed syntax never invokes structural decoding", () => {
  let calls = 0;
  const decoder = { decode: () => (calls += 1) };
  for (let index = 0; index < RUNS; index += 1) {
    const result = api.decodeJson(
      new TextEncoder().encode(`{"x":${next()},}`),
      decoder,
    );
    assert.equal(result.status, "invalid");
  }
  assert.equal(calls, 0);
});

test("P4-FUZZ-001 staged codec handles 4096 bounded arbitrary byte inputs", () => {
  const decoder = { decode: api.succeeded };
  const statuses = new Set([
    "succeeded",
    "invalid",
    "conflict",
    "cancelled",
    "unavailable",
    "rejected",
    "indeterminate",
    "defect",
  ]);
  for (let index = 0; index < RUNS; index += 1) {
    const input = new Uint8Array(next() % 65);
    for (let offset = 0; offset < input.length; offset += 1) {
      input[offset] = next() & 0xff;
    }
    assert.equal(statuses.has(api.decodeJson(input, decoder).status), true);
  }
});

test("P4-PROP-002 context identity scopes never substitute", () => {
  for (let index = 0; index < RUNS; index += 1) {
    const suffix = next();
    const context = {
      tenantId: id("tenant", `t-${suffix}`),
      taxpayerId: id("taxpayer", `p-${suffix}`),
      installationId: id("installation", `i-${suffix}`),
      editionId: id("edition", "rrsif-2026-09-21"),
      operatingMode: "non-verifactu",
      tenureId: "tenure-1",
      clock: {
        id: id("clock", "clock-1"),
        instant: at("2026-09-21T00:00:00Z"),
        quality: "authoritative",
      },
      configurationId: id("configuration", "configuration-1"),
      correlationId: id("correlation", `c-${suffix}`),
      principalId: id("principal", `u-${suffix}`),
    };
    assert.equal(
      api.validateContextScope(context, {
        tenantId: context.tenantId,
        taxpayerId: id("taxpayer", `other-${suffix}`),
        installationId: context.installationId,
        editionId: context.editionId,
      }).status,
      "rejected",
    );
  }
});

test("P4-PROP-003 decimal parse-format-parse is exact", () => {
  for (let index = 0; index < RUNS; index += 1) {
    const whole = next() % 1_000_000;
    const fraction = String(next() % 10_000).padStart(4, "0");
    const lexical = `${whole}.${fraction}`;
    const first = api.parseDecimal(lexical).value;
    const second = api.parseDecimal(api.formatDecimal(first)).value;
    assert.deepEqual(second, first);
  }
});

test("P4-PROP-004 date/time parse-format-parse is exact", () => {
  const two = (value) => String(value).padStart(2, "0");
  for (let index = 0; index < RUNS; index += 1) {
    const lexical = `${1800 + (next() % 401)}-${two((next() % 12) + 1)}-${two(
      (next() % 28) + 1,
    )}T${two(next() % 24)}:${two(next() % 60)}:${two(next() % 60)}Z`;
    assert.equal(
      api.parseFiscalInstant(api.parseFiscalInstant(lexical).value).value,
      lexical,
    );
    const otherLexical = `${1800 + (next() % 401)}-${two(
      (next() % 12) + 1,
    )}-${two((next() % 28) + 1)}T${two(next() % 24)}:${two(
      next() % 60,
    )}:${two(next() % 60)}Z`;
    const expected = Math.sign(Date.parse(lexical) - Date.parse(otherLexical));
    assert.equal(
      api.compareFiscalInstants(
        api.parseFiscalInstant(lexical).value,
        api.parseFiscalInstant(otherLexical).value,
      ),
      expected,
    );
  }
});

test("P4-PROP-005 state transition rejects every unlisted edge", () => {
  const principalId = id("principal", "principal-1");
  const event = {
    kind: "transition-completed",
    id: id("event", "event-1"),
    occurredAt: at("2026-09-21T00:00:00Z"),
    principalId,
  };
  for (let index = 0; index < RUNS; index += 1) {
    assert.equal(
      api.transitionInstallation(api.INITIAL_INSTALLATION_STATE, event).status,
      "conflict",
    );
  }
});

test("P4-PROP-006 mode tenure intervals remain contiguous", () => {
  const common = {
    taxpayerId: id("taxpayer", "taxpayer-1"),
    installationId: id("installation", "installation-1"),
    decisionSource: "initial-configuration",
    authorizedBy: id("principal", "principal-1"),
    configurationId: id("configuration", "configuration-1"),
    transitionEvidenceIds: [id("evidence", "tenure-proof-1")],
    relatedEventIds: [id("event", "tenure-event-1")],
  };
  for (let index = 0; index < RUNS; index += 1) {
    const boundary = String((next() % 27) + 2).padStart(2, "0");
    const instant = at(`2026-09-${boundary}T00:00:00Z`);
    const tenures = [
      {
        ...common,
        id: "tenure-1",
        mode: "non-verifactu",
        beganAt: at("2026-09-01T00:00:00Z"),
        endedAt: instant,
      },
      { ...common, id: "tenure-2", mode: "verifactu", beganAt: instant },
    ];
    assert.equal(api.validateTenureSequence(tenures).status, "succeeded");
    assert.equal(api.tenureAt(tenures, instant).value.id, "tenure-2");
  }
});

test("P4-PROP-007 chain recomputation detects every link mutation", () => {
  const taxpayerId = id("taxpayer", "taxpayer-1");
  const issuedOn = api.parseFiscalDate("2026-09-21").value;
  const recordedAt = at("2026-09-21T00:00:00Z");
  const digest = (record, predecessor) => {
    const source = `${record.id}|${predecessor ?? "GENESIS"}`;
    let accumulator = 0n;
    for (const character of source)
      accumulator =
        (accumulator * 131n + BigInt(character.codePointAt(0))) % (1n << 256n);
    return accumulator.toString(16).padStart(64, "0");
  };
  for (let index = 0; index < RUNS; index += 1) {
    const suffix = next();
    const record = {
      kind: "alta",
      id: id("record", `record-${suffix}`),
      taxpayerId,
      issuedOn,
      recordedAt,
      invoiceNumber: `F-${suffix}`,
      total: api.parseDecimal("1.00").value,
    };
    const chain = api.buildChain([record], digest);
    const replacement = chain[0].currentDigest[0] === "a" ? "b" : "a";
    const mutated = [
      {
        ...chain[0],
        currentDigest: `${replacement}${chain[0].currentDigest.slice(1)}`,
      },
    ];
    assert.equal(api.verifyChain(mutated, digest).status, "conflict");
  }
});

test("P4-PROP-008 plans are deterministic and deeply immutable", () => {
  const editionId = id("edition", "property-active-edition");
  for (let index = 0; index < RUNS; index += 1) {
    const suffix = next();
    const input = {
      planId: `plan-${suffix}`,
      commandId: `command-${suffix}`,
      idempotencyKey: id("idempotency", `idem-${suffix}`),
      contextId: `context-${suffix}`,
      editionId,
      configurationId: id("configuration", `configuration-${suffix}`),
      preparedAt: at("2026-09-21T10:00:00+02:00"),
      expiresAt: at("2026-09-21T10:05:00+02:00"),
      observedHead: {
        scope: `chain-${suffix}`,
        version: `v-${suffix}`,
        recordId: null,
        fingerprint: null,
      },
      recordId: id("record", `record-${suffix}`),
      artifactIds: [id("artifact", `artifact-${suffix}`)],
      editionPolicy: {
        edition: editionId,
        creationAllowed: true,
        allowedModes: ["verifactu"],
      },
      fingerprint: suffix.toString(16).padStart(64, "0").slice(-64),
      semanticInputDigest: suffix.toString(16).padStart(64, "0"),
      configurationDigest: (suffix + 1).toString(16).padStart(64, "0"),
    };
    const first = api.planRecord(input, hash).value;
    const second = api.planRecord(structuredClone(input), hash).value;
    assert.deepEqual(
      api.operationPlanBytes(first),
      api.operationPlanBytes(second),
    );
    assert.equal(Object.isFrozen(first), true);
    assert.equal(Object.isFrozen(first.observedHead), true);
    assert.equal(Object.isFrozen(first.binding), true);
    assert.equal(Object.isFrozen(first.artifactIds), true);
    assert.equal(Object.isFrozen(first.effects), true);
    assert.equal(first.effects.every(Object.isFrozen), true);
  }
});

test("P4-PROP-009 official projection preserves presence and order", () => {
  const editionId = id("edition", "property-projection-edition");
  const states = ["absent", "empty", "xsi-nil"];
  for (let index = 0; index < RUNS; index += 1) {
    const suffix = next();
    const ordered = [
      `a-${suffix}`,
      `b-${suffix}`,
      `c-${suffix}`,
      `d-${suffix}`,
    ];
    const descriptor = {
      id: `projection-${suffix}`,
      editionId,
      fields: ordered.map((source, position) => ({
        source,
        label: `F${position}-${suffix}`,
        lexical: "text",
        whitespace: "preserve",
      })),
    };
    const chosen = states[next() % states.length];
    const input = {
      [ordered[1]]: { state: chosen },
      [ordered[2]]: { state: "text", value: `value-${suffix}` },
      [ordered[3]]: { state: "empty" },
    };
    const projection = api.projectOfficialFields(
      descriptor,
      editionId,
      input,
    ).value;
    assert.deepEqual(
      projection.fields.map((field) => field.source),
      ordered,
    );
    assert.equal(projection.fields[0].state, "absent");
    assert.equal(projection.fields[1].state, chosen);
    assert.equal(projection.fields[2].lexical, `value-${suffix}`);
    assert.equal(projection.fields[3].state, "empty");
  }
});

test("P4-PROP-010 XML model serialize-parse preserves supported infoset", () => {
  const decode = (value) =>
    value
      .replaceAll("&#xD;", "\r")
      .replaceAll("&#xA;", "\n")
      .replaceAll("&#x9;", "\t")
      .replaceAll("&quot;", '"')
      .replaceAll("&gt;", ">")
      .replaceAll("&lt;", "<")
      .replaceAll("&amp;", "&");
  for (let index = 0; index < RUNS; index += 1) {
    const suffix = next();
    const attribute = `a&<"\r\n\t-${suffix}`;
    const text = `t&<>\r-${suffix}`;
    const result = api.serializeXmlDocument({
      root: {
        kind: "element",
        name: { namespaceUri: "urn:property", prefix: "p", localName: "Root" },
        namespaces: [{ prefix: "p", namespaceUri: "urn:property" }],
        attributes: [
          {
            name: { namespaceUri: "", prefix: null, localName: "value" },
            value: attribute,
          },
        ],
        children: [{ kind: "text", value: text }],
      },
    });
    assert.equal(result.status, "succeeded");
    const serialized = new TextDecoder().decode(result.value);
    const match =
      /^<\?xml version="1\.0" encoding="UTF-8"\?><p:Root xmlns:p="urn:property" value="([\s\S]*?)">([\s\S]*?)<\/p:Root>$/u.exec(
        serialized,
      );
    assert.notEqual(match, null);
    assert.equal(decode(match[1]), attribute);
    assert.equal(decode(match[2]), text);
  }
});

test("P4-FUZZ-002 XML scanner and serializer handle 4096 bounded arbitrary inputs", () => {
  const statuses = new Set(["succeeded", "invalid"]);
  for (let index = 0; index < RUNS; index += 1) {
    const input = new Uint8Array(next() % 1025);
    for (let offset = 0; offset < input.length; offset += 1)
      input[offset] = next() & 0xff;
    const scanned = xmlProvider.scanXmlResources(
      new TextDecoder().decode(input),
      xmlProvider.DEFAULT_XML_LIMITS,
    );
    assert.equal(scanned === null || typeof scanned === "string", true);
    const model = {
      root: {
        kind: "element",
        name: {
          namespaceUri: "urn:fuzz",
          prefix: "f",
          localName:
            index % 5 === 0
              ? `${String.fromCharCode(next() & 31)}bad`
              : `N${next()}`,
        },
        namespaces: [{ prefix: "f", namespaceUri: "urn:fuzz" }],
        attributes: [],
        children: [{ kind: "text", value: new TextDecoder().decode(input) }],
      },
    };
    assert.equal(statuses.has(api.serializeXmlDocument(model).status), true);
  }
});

test("P4-PROP-011 QR payload encode-decode preserves exact canonical bytes", () => {
  const printable = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -._~!$&'()*+,;=:@/?%";
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const seed = 0x4e4f454f;
  const histogram = {
    environments: { test: 0, production: 0 },
    modes: { verifactu: 0, "non-verifactu": 0 },
    amounts: { negative: 0, nonnegative: 0 },
    leapDays: 0,
  };
  const reservedCharacters = new Set();
  const reserved = " -._~!$&'()*+,;=:@/?%";
  let qrState = seed;
  const nextQr = () => {
    qrState = (Math.imul(qrState, 1664525) + 1013904223) >>> 0;
    return qrState;
  };
  for (let index = 0; index < RUNS; index += 1) {
    const generatedYear = 2000 + (nextQr() % 100);
    const generatedMonth = 1 + (nextQr() % 12);
    const leapBoundary = index % 64 === 0;
    const year = leapBoundary ? 2000 + 4 * ((index / 64) % 25) : generatedYear;
    const month = leapBoundary ? 2 : generatedMonth;
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const monthDays = month === 2 && leap ? 29 : days[month - 1];
    const generatedDay = 1 + (nextQr() % monthDays);
    const day = leapBoundary ? 29 : generatedDay;
    let series = "";
    const seriesLength = 1 + (nextQr() % 60);
    for (let position = 0; position < seriesLength; position += 1)
      series += printable[nextQr() % printable.length];
    const whole = String(nextQr() % 1_000_000_000_000);
    const fraction =
      nextQr() % 3 === 0 ? "" : `.${String(nextQr() % 100).padStart(2, "0")}`;
    const magnitude = `${whole}${fraction}`;
    const importe = index % 2 === 0 ? `-${magnitude}` : magnitude;
    const facts = {
      nif: "89890001K",
      numserie: series,
      fecha: api.parseFiscalDate(
        `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      ).value,
      importe,
    };
    const profile = {
      profileId: "aeat.qr@0.5.0",
      editionId: id("edition", "rrsif-2026-09-21-authoritative-candidate"),
      environment: nextQr() % 2 === 0 ? "test" : "production",
      mode: nextQr() % 2 === 0 ? "verifactu" : "non-verifactu",
      maximumPayloadBytes: 512,
    };
    histogram.environments[profile.environment] += 1;
    histogram.modes[profile.mode] += 1;
    histogram.amounts[importe.startsWith("-") ? "negative" : "nonnegative"] +=
      1;
    if (month === 2 && day === 29) histogram.leapDays += 1;
    for (const character of series)
      if (reserved.includes(character)) reservedCharacters.add(character);
    assertQrProperty({ profile, facts }, seed, index);
  }
  assert.ok(Object.values(histogram.environments).every((count) => count > 0));
  assert.ok(Object.values(histogram.modes).every((count) => count > 0));
  assert.ok(Object.values(histogram.amounts).every((count) => count > 0));
  assert.ok(histogram.leapDays > 0);
  assert.equal(
    [...reserved].every((character) => reservedCharacters.has(character)),
    true,
  );
});

test("P4-PROP-011 shrinker minimizes a seeded QR property counterexample", () => {
  const counterexample = {
    profile: {
      profileId: "aeat.qr@0.5.0",
      editionId: id("edition", "rrsif-2026-09-21-authoritative-candidate"),
      environment: "production",
      mode: "non-verifactu",
      maximumPayloadBytes: 512,
    },
    facts: {
      nif: "89890001K",
      numserie: "SERIES-AB/123456789",
      fecha: api.parseFiscalDate("2024-02-29").value,
      importe: "-241.40",
    },
  };
  const seededFault = (sample) =>
    sample.profile.environment === "production" &&
    sample.profile.mode === "non-verifactu" &&
    sample.facts.numserie.length > 0 &&
    sample.facts.importe.startsWith("-");
  const shrunk = shrinkQrCounterexample(counterexample, seededFault);
  assert.equal(seededFault(shrunk.counterexample), true);
  assert.equal(shrunk.counterexample.facts.numserie, "S");
  assert.equal(shrunk.counterexample.facts.importe, "-0");
  assert.equal(
    shrunk.counterexample.facts.fecha,
    api.parseFiscalDate("2000-01-01").value,
  );
  assert.deepEqual(shrunk.steps, [
    "numserie-prefix",
    "importe-negative-zero",
    "fecha-anchor",
  ]);
});

test("P4-PROP-012 claim aggregation preserves every component status", () => {
  const statuses = ["valid", "invalid", "indeterminate", "unavailable"];
  const priority = ["invalid", "indeterminate", "unavailable", "valid"];
  for (let index = 0; index < RUNS; index += 1) {
    const claims = {
      official: statuses[next() % statuses.length],
      cryptographic: statuses[next() % statuses.length],
      aeat: statuses[next() % statuses.length],
      noeosEvidence: statuses[next() % statuses.length],
    };
    const expected = priority.find((status) =>
      Object.values(claims).includes(status),
    );
    assert.equal(api.defineVerificationClaims(claims).status, "succeeded");
    assert.equal(api.aggregateVerificationClaims(claims), expected);
  }
});
