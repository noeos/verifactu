import { gzipSync, gunzipSync } from "node:zlib";

import { assert } from "../lib/policy.mjs";

function field(header, offset, length, value) {
  const bytes = Buffer.from(value, "utf8");
  assert(bytes.length <= length, "TAR_FIELD_OVERFLOW", `tar field exceeds ${length} bytes: ${value}`);
  bytes.copy(header, offset);
}

function octal(header, offset, length, value) {
  const encoded = value.toString(8).padStart(length - 1, "0");
  field(header, offset, length, `${encoded}\0`);
}

function headerFor(name, size, mode = 0o644) {
  const header = Buffer.alloc(512);
  field(header, 0, 100, name);
  octal(header, 100, 8, mode);
  octal(header, 108, 8, 0);
  octal(header, 116, 8, 0);
  octal(header, 124, 12, size);
  octal(header, 136, 12, 0);
  header.fill(0x20, 148, 156);
  field(header, 156, 1, "0");
  field(header, 257, 6, "ustar\0");
  field(header, 263, 2, "00");
  const checksum = [...header].reduce((sum, value) => sum + value, 0);
  field(header, 148, 8, `${checksum.toString(8).padStart(6, "0")}\0 `);
  return header;
}

export function createDeterministicTarGzip(files) {
  const chunks = [];
  for (const { name, bytes, mode = 0o644 } of [...files].sort((left, right) =>
    left.name.localeCompare(right.name, "en"),
  )) {
    assert(
      name.startsWith("package/") && !name.includes("\\") && !name.split("/").includes(".."),
      "TAR_PATH_UNSAFE",
      `unsafe tar path: ${name}`,
    );
    chunks.push(headerFor(name, bytes.length, mode), bytes);
    const padding = (512 - (bytes.length % 512)) % 512;
    if (padding) chunks.push(Buffer.alloc(padding));
  }
  chunks.push(Buffer.alloc(1024));
  const compressed = gzipSync(Buffer.concat(chunks), { level: 9, mtime: 0 });
  compressed[9] = 255;
  return compressed;
}

function parseOctal(buffer) {
  const text = buffer.toString("ascii").replace(/\0.*$/, "").trim();
  return text ? Number.parseInt(text, 8) : 0;
}

export function parseTarGzip(compressed, maximumExpandedBytes = 20 * 1024 * 1024) {
  const tar = gunzipSync(compressed, { maxOutputLength: maximumExpandedBytes });
  const entries = [];
  const names = new Set();
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((value) => value === 0)) break;
    const storedChecksum = parseOctal(header.subarray(148, 156));
    const copy = Buffer.from(header);
    copy.fill(0x20, 148, 156);
    const actualChecksum = [...copy].reduce((sum, value) => sum + value, 0);
    assert(storedChecksum === actualChecksum, "TAR_CHECKSUM", "tar header checksum mismatch");
    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/, "");
    const type = header.subarray(156, 157).toString("ascii") || "0";
    const size = parseOctal(header.subarray(124, 136));
    const mode = parseOctal(header.subarray(100, 108));
    assert(
      name.startsWith("package/") && !name.startsWith("/") && !name.includes("\\") && !name.split("/").includes(".."),
      "TAR_PATH_UNSAFE",
      `unsafe tar entry: ${name}`,
    );
    assert(type === "0" || type === "\0", "TAR_ENTRY_TYPE", `non-regular tar entry is forbidden: ${name} (${type})`);
    assert(!names.has(name), "TAR_DUPLICATE_ENTRY", `duplicate tar entry: ${name}`);
    assert(size >= 0 && offset + 512 + size <= tar.length, "TAR_SIZE", `invalid tar entry size: ${name}`);
    names.add(name);
    const bytes = Buffer.from(tar.subarray(offset + 512, offset + 512 + size));
    entries.push({ name, mode, bytes });
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return entries;
}
