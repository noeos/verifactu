// SPDX-License-Identifier: Apache-2.0
import { open, rename, rm, lstat } from "node:fs/promises";
import { resolve } from "node:path";
import type { Writable } from "node:stream";

export type OutputFormat = "json" | "ndjson" | "human";
export interface LineWriter {
  write(value: unknown): Promise<void>;
  close(success: boolean): Promise<void>;
}
export async function openWriter(
  format: OutputFormat,
  stdout: Writable,
  path?: string,
  force = false,
): Promise<LineWriter> {
  if (path === undefined) return new StreamWriter(format, stdout);
  const target = resolve(path);
  await ensure(target, force);
  const temp = `${target}.noeos-${String(process.pid)}`;
  const handle = await open(temp, "wx", 0o600);
  return new FileWriter(format, handle, target, temp);
}
class StreamWriter implements LineWriter {
  constructor(
    private readonly format: OutputFormat,
    private readonly stream: Writable,
  ) {}
  async write(value: unknown): Promise<void> {
    const text = format(this.format, value);
    if (!this.stream.write(text))
      await new Promise<void>((resolvePromise, reject) => {
        const drain = () => {
          this.stream.off("error", error);
          resolvePromise();
        };
        const error = (reason: Error) => {
          this.stream.off("drain", drain);
          reject(reason);
        };
        this.stream.once("drain", drain);
        this.stream.once("error", error);
      });
  }
  async close(_success: boolean): Promise<void> {
    void _success;
    await Promise.resolve();
  }
}
class FileWriter implements LineWriter {
  constructor(
    private readonly format: OutputFormat,
    private readonly handle: Awaited<ReturnType<typeof open>>,
    private readonly target: string,
    private readonly temp: string,
  ) {}
  async write(value: unknown): Promise<void> {
    await this.handle.write(format(this.format, value), undefined, "utf8");
  }
  async close(ok: boolean): Promise<void> {
    await this.handle.sync();
    await this.handle.close();
    if (ok) await rename(this.temp, this.target);
    else await rm(this.temp, { force: true });
  }
}
function format(kind: OutputFormat, value: unknown): string {
  if (kind === "human") return `${operationName(value)}\n`;
  const json = JSON.stringify(value);
  return `${typeof json === "string" ? json : "null"}\n`;
}
function operationName(value: unknown): string {
  if (typeof value !== "object" || value === null || !("operation" in value)) return "operation";
  const operation = value.operation;
  return typeof operation === "string" ? operation : "operation";
}
async function ensure(path: string, force: boolean): Promise<void> {
  try {
    const stat = await lstat(path);
    if (stat.isSymbolicLink() || !stat.isFile() || !force) throw new Error("OUTPUT_EXISTS");
  } catch (error) {
    if (!(
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ))
      throw error;
  }
}
