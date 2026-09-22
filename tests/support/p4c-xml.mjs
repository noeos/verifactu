import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const snapshot = new URL(
  "../../editions/source-snapshots/rrsif-2026-09-21-authoritative/sources/",
  import.meta.url,
);

async function resource(id, relative, aliases = []) {
  const bytes = await readFile(new URL(relative, snapshot));
  return Object.freeze({
    id,
    aliases: Object.freeze(aliases),
    bytes: Uint8Array.from(bytes),
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}

export async function officialSchemaClosure() {
  return Object.freeze([
    await resource("SuministroLR.xsd", "aeat/SuministroLR.xsd"),
    await resource("SuministroInformacion.xsd", "aeat/SuministroInformacion.xsd"),
    await resource(
      "http://www.w3.org/TR/xmldsig-core/xmldsig-core-schema.xsd",
      "standards/xmldsig-core-schema.xsd",
      ["xmldsig-core-schema.xsd"],
    ),
  ]);
}

export async function officialPositiveXml() {
  return Uint8Array.from(
    await readFile(new URL("../vectors/p4c-official-positive.xml", import.meta.url)),
  );
}

export async function loadXmlProvider() {
  return import(
    process.env.VERIFACTU_XML_PROVIDER_ENTRY ??
      new URL("../../internal/xml-provider/provider.mjs", import.meta.url).href
  );
}

export async function loadXmlWorker() {
  return import(
    process.env.VERIFACTU_XML_WORKER_ENTRY ??
      new URL("../../internal/xml-provider/worker.mjs", import.meta.url).href
  );
}
