import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { inflateRawSync } from "node:zlib";
import {
  createXmlXsdProvider,
  PINNED_SCHEMA_CLOSURES,
  PINNED_SCHEMAS,
  XML_EDITION_ID,
} from "../../internal/xml-provider/provider.mjs";

const snapshot = "editions/source-snapshots/rrsif-2026-09-21-authoritative";
const sourceRoot = `${snapshot}/sources`;
const pythonExecutable = process.env.VERIFACTU_PYTHON ?? "python3";
const schemaPaths = {
  "xsd-suministro-lr": "aeat/SuministroLR.xsd",
  "xsd-respuesta-suministro": "aeat/RespuestaSuministro.xsd",
  "xsd-consulta-lr": "aeat/ConsultaLR.xsd",
  "xsd-respuesta-consulta-lr": "aeat/RespuestaConsultaLR.xsd",
  "xsd-suministro-informacion": "aeat/SuministroInformacion.xsd",
  "xsd-eventos-sif": "aeat/EventosSIF.xsd",
  "xsd-respuesta-validacion-no-verifactu": "aeat/RespuestaValRegistNoVeriFactu.xsd",
  "xmldsig-schema": "standards/xmldsig-core-schema.xsd",
};
const oracleSource = String.raw`
import base64, json, sys, tempfile
from pathlib import Path
import xmlschema
from xmlschema import XMLResource
r = json.load(sys.stdin)
with tempfile.TemporaryDirectory(prefix="verifactu-xml-oracle-") as tmp:
    root = Path(tmp)
    info = root / "SuministroInformacion.xsd"
    dsig = root / "xmldsig-core-schema.xsd"
    info.write_bytes(base64.b64decode(r["info"], validate=True))
    dsig.write_bytes(base64.b64decode(r["dsig"], validate=True))
    schema = xmlschema.XMLSchema(
        str(info),
        locations=[("http://www.w3.org/2000/09/xmldsig#", str(dsig))],
        allow="sandbox",
        defuse="always",
    )
    print(json.dumps([
        schema.is_valid(XMLResource(base64.b64decode(value, validate=True), allow="none", defuse="always"))
        for value in r["instances"]
    ]))
`;

function zipEntry(archive, wantedName) {
  const signature = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const end = archive.lastIndexOf(signature);
  assert.notEqual(end, -1, "official examples archive has a ZIP directory");
  const entries = archive.readUInt16LE(end + 10);
  let offset = archive.readUInt32LE(end + 16);
  for (let index = 0; index < entries; index += 1) {
    assert.equal(archive.readUInt32LE(offset), 0x02014b50);
    const compressedBytes = archive.readUInt32LE(offset + 20);
    const nameBytes = archive.readUInt16LE(offset + 28);
    const extraBytes = archive.readUInt16LE(offset + 30);
    const commentBytes = archive.readUInt16LE(offset + 32);
    const localOffset = archive.readUInt32LE(offset + 42);
    const name = archive.toString("utf8", offset + 46, offset + 46 + nameBytes);
    if (name === wantedName) {
      const localNameBytes = archive.readUInt16LE(localOffset + 26);
      const localExtraBytes = archive.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameBytes + localExtraBytes;
      const compressed = archive.subarray(dataStart, dataStart + compressedBytes);
      const method = archive.readUInt16LE(offset + 10);
      assert.equal(method, 8, "official sample uses deflate");
      return inflateRawSync(compressed);
    }
    offset += 46 + nameBytes + extraBytes + commentBytes;
  }
  assert.fail(`missing official vector ${wantedName}`);
}

function fixtures() {
  const schemas = schemasFor("xsd-suministro-informacion");
  const archive = readFileSync(join(sourceRoot, "aeat/AnexosEjemplosFirmaRegFact.zip"));
  const xml = zipEntry(archive, "ejemploRegistro-firmado-epes-xades4j.xml");
  return { schemas, xml };
}

function schemasFor(rootSchemaId) {
  return PINNED_SCHEMA_CLOSURES[rootSchemaId].map((id) => ({
    id,
    bytes: readFileSync(join(sourceRoot, schemaPaths[id])),
    sha256: PINNED_SCHEMAS[id].sha256,
  }));
}

function mutatedVectors(xml) {
  const vectors = [
    xml
      .toString("utf8")
      .replace("<sum1:TipoFactura>R3</sum1:TipoFactura>", "<sum1:TipoFactura>ZZ</sum1:TipoFactura>"),
    xml
      .toString("utf8")
      .replace("<sum1:TipoHuella>01</sum1:TipoHuella>", "<sum1:TipoHuella>02</sum1:TipoHuella>"),
    xml.toString("utf8").replace("<sum1:IDVersion>1.0</sum1:IDVersion>", ""),
  ].map((value) => Buffer.from(value));
  assert.ok(vectors.every((value) => !value.equals(xml)));
  return vectors;
}

test("official signed AEAT XML validates against the pinned offline XSD closure", async () => {
  const { schemas, xml } = fixtures();
  const provider = createXmlXsdProvider();
  const result = await provider.validate({
    editionId: XML_EDITION_ID,
    xml,
    rootSchemaId: "xsd-suministro-informacion",
    schemas,
    semanticStatus: "not-evaluated",
  });
  assert.deepEqual(result, {
    status: "valid",
    xsd: "valid",
    semantic: "not-evaluated",
    diagnostics: [],
  });

  const changed = mutatedVectors(xml);
  const primary = await Promise.all(
    changed.map((candidate) =>
      provider.validate({
        editionId: XML_EDITION_ID,
        xml: candidate,
        rootSchemaId: "xsd-suministro-informacion",
        schemas,
        semanticStatus: "valid",
      }),
    ),
  );
  assert.ok(primary.every((entry) => entry.status === "invalid" && entry.xsd === "invalid"));

  const info = readFileSync(join(sourceRoot, schemaPaths["xsd-suministro-informacion"]));
  const dsigOriginal = readFileSync(join(sourceRoot, schemaPaths["xmldsig-schema"]));
  assert.equal(
    createHash("sha256").update(dsigOriginal).digest("hex"),
    PINNED_SCHEMAS["xmldsig-schema"].sha256,
  );
  const dtdStart = dsigOriginal.indexOf(Buffer.from("<!DOCTYPE schema"));
  const dtdEnd = dsigOriginal.indexOf(Buffer.from("]>"), dtdStart) + 2;
  assert.ok(dtdStart >= 0 && dtdEnd > dtdStart);
  const dsig = Buffer.concat([
    dsigOriginal.subarray(0, dtdStart),
    dsigOriginal.subarray(dtdEnd),
  ]);
  const oracle = JSON.parse(
    execFileSync(
      process.env.VERIFACTU_PYTHON ?? "python3",
      ["-I", "-c", oracleSource],
      {
        input: JSON.stringify({
          info: info.toString("base64"),
          dsig: dsig.toString("base64"),
          instances: [xml, ...changed].map((value) => value.toString("base64")),
        }),
        encoding: "utf8",
        timeout: 15_000,
        maxBuffer: 65_536,
      },
    ),
  );
  assert.deepEqual(oracle, [true, false, false, false]);
  assert.deepEqual(primary.map((entry) => entry.semantic), ["valid", "valid", "valid"]);
});

test("provider reports XSD validity separately from caller-owned semantic status", async () => {
  const { schemas, xml } = fixtures();
  const result = await createXmlXsdProvider().validate({
    editionId: XML_EDITION_ID,
    xml,
    rootSchemaId: "xsd-suministro-informacion",
    schemas,
    semanticStatus: "invalid",
  });
  assert.equal(result.status, "valid");
  assert.equal(result.xsd, "valid");
  assert.equal(result.semantic, "invalid");
});

test("all eight pinned schema roots compile with their exact closed dependency sets", async () => {
  const provider = createXmlXsdProvider();
  for (const [rootSchemaId, ids] of Object.entries(PINNED_SCHEMA_CLOSURES)) {
    const schemas = schemasFor(rootSchemaId);
    const result = await provider.validate({
      editionId: XML_EDITION_ID,
      xml: Buffer.from("<unlisted-root/>", "utf8"),
      rootSchemaId,
      schemas,
    });
    assert.equal(result.status, "invalid", `${rootSchemaId} must compile and reject the probe root`);
    assert.equal(result.xsd, "invalid");
  }
});

test("schema bytes remain bound to the immutable source digests", () => {
  const { schemas } = fixtures();
  for (const schema of schemas) {
    const actual = createHash("sha256").update(schema.bytes).digest("hex");
    assert.equal(actual, PINNED_SCHEMAS[schema.id].sha256);
  }
});
