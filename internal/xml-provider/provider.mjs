import { createHash, timingSafeEqual } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnXmlWorker } from "./worker.mjs";

export const XML_EDITION_ID = "rrsif-2026-09-21-authoritative-candidate";

const AEAT_NAMESPACE =
  "https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/";
export const PINNED_SCHEMAS = Object.freeze({
  "xsd-suministro-lr": {
    sha256: "cbdac8d427cc5ab5d77ca48974cab0f35d6bb819c4c66db361681e3710aeba36",
    uri: `${AEAT_NAMESPACE}SuministroLR.xsd`,
  },
  "xsd-respuesta-suministro": {
    sha256: "82acf80f785643caac13087aae66808ed721a13f08ca5218cf8ae81b695549ef",
    uri: `${AEAT_NAMESPACE}RespuestaSuministro.xsd`,
  },
  "xsd-consulta-lr": {
    sha256: "bf2cdb8fc4b95b291757a72b76d8fffca06a6d30d9329122ca2fd6b2d5f8f1b1",
    uri: `${AEAT_NAMESPACE}ConsultaLR.xsd`,
  },
  "xsd-respuesta-consulta-lr": {
    sha256: "de35063acb8d9ba0d6ae51acc6b595de9c2b12333250e95e13108ef5f2670d45",
    uri: `${AEAT_NAMESPACE}RespuestaConsultaLR.xsd`,
  },
  "xsd-suministro-informacion": {
    sha256: "ee4c1655175644de44c4c25055ffeb8e5f4bb4bc3834ce8254d4222ef18c8aa1",
    uri: `${AEAT_NAMESPACE}SuministroInformacion.xsd`,
  },
  "xsd-eventos-sif": {
    sha256: "cc7347c6a9a57a0c8edbc6b9ddcce55176452d0db0e68369477e207e9fbdd7e7",
    uri: `${AEAT_NAMESPACE}EventosSIF.xsd`,
  },
  "xsd-respuesta-validacion-no-verifactu": {
    sha256: "8f47af4f3c49d29b6a62aed261c09f171e855ad6d6bb72ef3fc0b147dc9572f0",
    uri: `${AEAT_NAMESPACE}RespuestaValRegistNoVeriFactu.xsd`,
  },
  "xmldsig-schema": {
    sha256: "d102ad3df7664c307e0c2c776ba4a90513b1969974d8a940bae1a77f9f21e15d",
    uri: "http://www.w3.org/TR/xmldsig-core/xmldsig-core-schema.xsd",
  },
});

export const XML_LIMITS = Object.freeze({
  maximumXmlBytes: 4_194_304,
  maximumSchemaBytes: 8_388_608,
  maximumSchemas: 8,
  maximumDepth: 64,
  maximumNodes: 100_000,
  maximumAttributes: 4_096,
  maximumNamespaces: 256,
  maximumTextBytes: 2_097_152,
  maximumOutputBytes: 65_536,
  deadlineMs: 5_000,
  maximumCpuSeconds: 5,
  maximumMemoryBytes: 536_870_912,
});

export const PINNED_SCHEMA_CLOSURES = Object.freeze({
  "xsd-suministro-lr": [
    "xsd-suministro-lr",
    "xsd-suministro-informacion",
    "xmldsig-schema",
  ],
  "xsd-respuesta-suministro": [
    "xsd-respuesta-suministro",
    "xsd-suministro-informacion",
    "xsd-suministro-lr",
    "xmldsig-schema",
  ],
  "xsd-consulta-lr": [
    "xsd-consulta-lr",
    "xsd-suministro-informacion",
    "xmldsig-schema",
  ],
  "xsd-respuesta-consulta-lr": [
    "xsd-respuesta-consulta-lr",
    "xsd-suministro-informacion",
    "xmldsig-schema",
  ],
  "xsd-suministro-informacion": ["xsd-suministro-informacion", "xmldsig-schema"],
  "xsd-eventos-sif": ["xsd-eventos-sif", "xmldsig-schema"],
  "xsd-respuesta-validacion-no-verifactu": [
    "xsd-respuesta-validacion-no-verifactu",
    "xsd-suministro-informacion",
    "xmldsig-schema",
  ],
  "xmldsig-schema": ["xmldsig-schema"],
});

export function createXmlXsdProvider(options = {}) {
  const execute = options.execute ?? spawnXmlWorker;
  return Object.freeze({ validate: (request, callOptions) =>
    validateXmlXsd(request, { ...options, ...callOptions, execute }),
  });
}

export async function validateXmlXsd(request, options = {}) {
  const semantic = ["valid", "invalid"].includes(request?.semanticStatus)
    ? request.semanticStatus
    : "not-evaluated";
  if (options.signal?.aborted)
    return outcome("cancelled", "not-evaluated", semantic, ["DIAG-XML-CANCELLED"]);

  let limits;
  try {
    limits = normalizeLimits(options.limits);
  } catch {
    return outcome("limit", "not-evaluated", semantic, ["DIAG-XML-LIMITS"]);
  }
  const deadlineMs = options.deadlineMs ?? limits.deadlineMs;
  if (!Number.isSafeInteger(deadlineMs) || deadlineMs <= 0)
    return outcome("limit", "not-evaluated", semantic, ["DIAG-XML-DEADLINE"]);
  if (!validRequest(request))
    return outcome("defect", "not-evaluated", semantic, ["DIAG-XSD-REQUEST"]);
  if (request.xml.byteLength > limits.maximumXmlBytes)
    return outcome("limit", "not-evaluated", semantic, ["DIAG-XML-BYTES"]);

  const schemaBytes = request.schemas.reduce(
    (total, schema) => total + schema.bytes.byteLength,
    0,
  );
  if (
    request.schemas.length > limits.maximumSchemas ||
    schemaBytes > limits.maximumSchemaBytes ||
    request.schemas.some((schema) => schema.bytes.byteLength > limits.maximumSchemaBytes)
  )
    return outcome("limit", "not-evaluated", semantic, ["DIAG-XSD-RESOURCES"]);
  if (request.editionId !== XML_EDITION_ID)
    return outcome("unavailable", "not-evaluated", semantic, ["DIAG-XML-EDITION"]);

  const expectedClosure = PINNED_SCHEMA_CLOSURES[request.rootSchemaId];
  const ids = request.schemas.map((schema) => schema.id).sort();
  if (
    !expectedClosure ||
    JSON.stringify(ids) !== JSON.stringify([...expectedClosure].sort()) ||
    !request.schemas.every((schema) => schemaMatchesPin(schema))
  )
    return outcome("defect", "not-evaluated", semantic, ["DIAG-XSD-RESOURCE-MAP"]);

  const execute = options.execute ?? spawnXmlWorker;
  const work = async () => {
    const directory = await mkdtemp(join(tmpdir(), "verifactu-xml-"));
    try {
      return await execute(
        {
          editionId: request.editionId,
          limits,
          rootSchemaId: request.rootSchemaId,
          schemas: request.schemas.map((schema) => ({
            id: schema.id,
            sha256: schema.sha256,
            base64: Buffer.from(schema.bytes).toString("base64"),
          })),
          xmlBase64: Buffer.from(request.xml).toString("base64"),
        },
        {
          signal: options.signal,
          cwd: directory,
          timeoutMs: deadlineMs,
          maximumOutputBytes: limits.maximumOutputBytes,
          maximumMemoryBytes: limits.maximumMemoryBytes,
          pythonExecutable: options.pythonExecutable,
        },
      );
    } finally {
      await rm(directory, { recursive: true, force: true }).catch(() => undefined);
    }
  };

  try {
    const result = await work();
    if (!validWorkerResult(result))
      return outcome("defect", "not-evaluated", semantic, ["DIAG-XSD-PROVIDER"]);
    if (result.kind === "valid")
      return outcome("valid", "valid", semantic, []);
    if (result.kind === "invalid")
      return outcome("invalid", "invalid", semantic, result.diagnostics);
    if (result.kind === "limit")
      return outcome("limit", "not-evaluated", semantic, result.diagnostics);
    if (result.kind === "cancelled")
      return outcome("cancelled", "not-evaluated", semantic, ["DIAG-XML-CANCELLED"]);
    if (result.kind === "unavailable")
      return outcome("unavailable", "not-evaluated", semantic, result.diagnostics);
    return outcome("defect", "not-evaluated", semantic, result.diagnostics);
  } catch {
    return outcome("defect", "not-evaluated", semantic, ["DIAG-XSD-PROVIDER"]);
  }
}

function validRequest(request) {
  return Boolean(
    request &&
      typeof request === "object" &&
      request.xml instanceof Uint8Array &&
      typeof request.rootSchemaId === "string" &&
      Array.isArray(request.schemas) &&
      request.schemas.every(
        (schema) =>
          schema &&
          typeof schema.id === "string" &&
          schema.bytes instanceof Uint8Array &&
          typeof schema.sha256 === "string",
      ),
  );
}

function schemaMatchesPin(schema) {
  const pin = PINNED_SCHEMAS[schema.id];
  if (!pin || schema.sha256 !== pin.sha256 || schema.bytes.byteLength > XML_LIMITS.maximumSchemaBytes)
    return false;
  const actual = createHash("sha256").update(schema.bytes).digest();
  const expected = Buffer.from(pin.sha256, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function validWorkerResult(result) {
  return Boolean(
    result &&
      typeof result === "object" &&
      ["valid", "invalid", "limit", "cancelled", "unavailable", "defect"].includes(
        result.kind,
      ) &&
      Array.isArray(result.diagnostics) &&
      result.diagnostics.length <= 8 &&
      result.diagnostics.every(
        (item) =>
          typeof item === "string" &&
          item.length <= 80 &&
          /^DIAG-[A-Z0-9-]+$/u.test(item),
      ),
  );
}

function normalizeLimits(overrides = {}) {
  if (
    overrides !== null &&
    (typeof overrides !== "object" || Array.isArray(overrides))
  )
    throw new TypeError("invalid limits");
  const supplied = overrides ?? {};
  if (Object.keys(supplied).some((key) => !Object.hasOwn(XML_LIMITS, key)))
    throw new TypeError("unknown limit");
  const limits = { ...XML_LIMITS, ...supplied };
  for (const [key, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value <= 0 || value > XML_LIMITS[key])
      throw new TypeError(`invalid limit: ${key}`);
  }
  return Object.freeze(limits);
}

function outcome(status, xsd, semantic, diagnostics) {
  return Object.freeze({
    status,
    xsd,
    semantic,
    diagnostics: Object.freeze([...diagnostics]),
  });
}
