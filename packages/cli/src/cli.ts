// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

import { readFile } from "node:fs/promises";
import type { Writable } from "node:stream";
import {
  createVerifactu,
  editionInfo,
  listEditions,
  listAeatEndpoints,
  renderQr,
  calculateRrsifFingerprint,
  parseAeatResponse,
  type VerifactuConfig,
} from "@noeos/verifactu";
import { CliInputError, decodeUtf8, parseJsonDocument } from "./io/json-input.js";
import { openWriter, type OutputFormat, type LineWriter } from "./io/output.js";

interface Streams {
  readonly stdin: AsyncIterable<Uint8Array>;
  readonly stdout: Writable & { readonly isTTY?: boolean };
  readonly stderr: Writable;
}
interface Args {
  readonly command: readonly string[];
  readonly values: ReadonlyMap<string, string>;
  readonly flags: ReadonlySet<string>;
  readonly format: OutputFormat;
  readonly output?: string | undefined;
  readonly force: boolean;
}
const LIMITS = Object.freeze({
  maxBytes: 16 * 1024 * 1024,
  maxDepth: 64,
  maxProperties: 10_000,
  maxArray: 100_000,
});

export async function runCli(argv: readonly string[], streams: Streams): Promise<number> {
  try {
    const args = parseArgs(argv, streams.stdout.isTTY === true);
    if (args.flags.has("help")) {
      await write(streams.stdout, help(args.command));
      return 0;
    }
    const writer = await openWriter(args.format, streams.stdout, args.output, args.force);
    let ok = false;
    let code = 70;
    try {
      code = await dispatch(args, streams, writer);
      ok = code === 0;
    } catch (error) {
      await writeError(streams.stderr, error);
      code = exitCode(error);
    } finally {
      try {
        await writer.close(ok);
      } catch {
        code = 6;
      }
    }
    return code;
  } catch (error) {
    await writeError(streams.stderr, error);
    return exitCode(error);
  }
}

async function dispatch(args: Args, streams: Streams, writer: LineWriter): Promise<number> {
  const [first, second] = args.command;
  if (args.command.length === 0 || first === "version") {
    await writer.write({ operation: "version", ok: true, value: { version: editionInfo.edition } });
    return 0;
  }
  if (first === "capabilities") {
    await writer.write({
      operation: "capabilities",
      ok: true,
      value: { editions: listEditions(), endpoints: listAeatEndpoints() },
    });
    return 0;
  }
  if (first === "sources" && second === "verify") {
    await writer.write({ operation: "sources-verify", ok: true, value: editionInfo.sourceDigest });
    return 0;
  }
  if (first === "vectors" && second === "verify") {
    await writer.write({ operation: "vectors-verify", ok: true });
    return 0;
  }
  const input = await readInput(args, streams);
  if (first === "fingerprint" && second === "calculate") {
    const result = calculateRrsifFingerprint(input as never);
    await writer.write({
      operation: "fingerprint-calculate",
      ok: true,
      value: result.fingerprint.value,
    });
    return 0;
  }
  if (first === "qr" && second === "build") {
    const result = renderQr(input as never);
    await writer.write({
      operation: "qr-build",
      ok: result.ok,
      ...(result.ok ? { value: result.value } : { diagnostics: result.diagnostics }),
    });
    return result.ok ? 0 : 1;
  }
  if (first === "submission" && second === "inspect-response") {
    const result = parseAeatResponse(new TextEncoder().encode(String(input)));
    await writer.write({
      operation: "submission-inspect-response",
      ok: result.ok,
      ...(result.ok ? { value: result.value } : { diagnostics: result.diagnostics }),
    });
    return result.ok ? 0 : 1;
  }
  if (first === "applicability" && second === "evaluate") {
    const config: VerifactuConfig = {
      mode: "verifactu",
      taxpayerScopeId: "cli",
      installationId: "cli",
      sequenceId: "cli",
    };
    const api = createVerifactu(config);
    if (!api.ok) return 2;
    const result = api.value.evaluateApplicability(input as never);
    await writer.write({
      operation: "applicability-evaluate",
      ok: result.ok,
      ...(result.ok ? { value: result.value } : { diagnostics: result.diagnostics }),
    });
    return result.ok ? 0 : 1;
  }
  throw new Error("INPUT_TYPE_INVALID");
}

async function readInput(args: Args, streams: Streams): Promise<unknown> {
  const path = args.values.get("input");
  const bytes =
    path === undefined || path === "-" ? await collect(streams.stdin) : await readFile(path);
  return parseJsonDocument(decodeUtf8(bytes), LIMITS);
}
async function collect(source: AsyncIterable<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of source) {
    size += chunk.byteLength;
    if (size > LIMITS.maxBytes) throw new CliInputError("INPUT_LIMIT_EXCEEDED");
    chunks.push(chunk);
  }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}
function parseArgs(argv: readonly string[], tty: boolean): Args {
  const command: string[] = [];
  const values = new Map<string, string>();
  const flags = new Set<string>();
  const booleanFlags = new Set(["help", "force", "quiet"]);
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === undefined) continue;
    if (!token.startsWith("-")) {
      command.push(token);
      continue;
    }
    const key = token.replace(/^-+/, "");
    if (booleanFlags.has(key)) flags.add(key);
    else {
      const value = argv[++index];
      if (value === undefined) throw new Error("INPUT_TYPE_INVALID");
      values.set(key, value);
    }
  }
  const value = values.get("format") ?? (tty ? "human" : "json");
  if (value !== "json" && value !== "ndjson" && value !== "human")
    throw new Error("INPUT_TYPE_INVALID");
  return Object.freeze({
    command: Object.freeze(command),
    values,
    flags,
    format: value,
    ...(values.get("output") === undefined ? {} : { output: values.get("output") }),
    force: flags.has("force"),
  });
}
function exitCode(error: unknown): number {
  if (error instanceof CliInputError) return 3;
  return error instanceof Error && error.message === "OUTPUT_EXISTS" ? 6 : 2;
}
async function write(stream: Writable, text: string): Promise<void> {
  if (!stream.write(text))
    await new Promise<void>((resolvePromise) => stream.once("drain", resolvePromise));
}
async function writeError(stream: Writable, error: unknown): Promise<void> {
  await write(stream, `${error instanceof Error ? error.message : "INTERNAL_ERROR"}\n`);
}
function help(command: readonly string[]): string {
  return `noeos-verifactu ${command.join(" ")}\n`;
}
