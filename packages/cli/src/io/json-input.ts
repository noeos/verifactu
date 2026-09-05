// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unnecessary-type-arguments */

import { Buffer } from "node:buffer";

export interface JsonLimits {
  readonly maxBytes: number;
  readonly maxDepth: number;
  readonly maxProperties: number;
  readonly maxArray: number;
}
export class CliInputError extends Error {
  constructor(
    readonly code: string,
    readonly line?: number,
  ) {
    super(code);
    this.name = "CliInputError";
  }
}

export function decodeUtf8(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new CliInputError("UTF8_INVALID");
  }
}

export function parseJsonDocument(text: string, limits: JsonLimits): unknown {
  if (text.codePointAt(0) === 0xfeff || Buffer.byteLength(text) > limits.maxBytes)
    throw new CliInputError("INPUT_LIMIT_EXCEEDED");
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    throw new CliInputError("JSON_SYNTAX_INVALID");
  }
  checkShape(value, 0, limits);
  return value;
}

export async function* parseNdjson(
  chunks: AsyncIterable<Uint8Array>,
  limits: JsonLimits,
): AsyncGenerator<unknown> {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let pending = "";
  let line = 0;
  try {
    for await (const chunk of chunks) {
      pending += decoder.decode(chunk, { stream: true });
      let index = pending.indexOf("\n");
      while (index >= 0) {
        const raw = pending.slice(0, index).replace(/\r$/u, "");
        pending = pending.slice(index + 1);
        line += 1;
        if (raw.length === 0) throw new CliInputError("NDJSON_LINE_EMPTY", line);
        try {
          yield parseJsonDocument(raw, limits);
        } catch (error) {
          throw new CliInputError(
            error instanceof CliInputError ? error.code : "JSON_SYNTAX_INVALID",
            line,
          );
        }
        index = pending.indexOf("\n");
      }
      if (Buffer.byteLength(pending) > limits.maxBytes)
        throw new CliInputError("NDJSON_LINE_TOO_LARGE", line + 1);
    }
    pending += decoder.decode();
  } catch (error) {
    if (error instanceof TypeError) throw new CliInputError("UTF8_INVALID", line + 1);
    throw error;
  }
  if (pending.length > 0) {
    line += 1;
    try {
      yield parseJsonDocument(pending, limits);
    } catch (error) {
      throw new CliInputError(
        error instanceof CliInputError ? error.code : "JSON_SYNTAX_INVALID",
        line,
      );
    }
  }
}

function checkShape(value: unknown, depth: number, limits: JsonLimits): void {
  if (depth > limits.maxDepth) throw new CliInputError("INPUT_LIMIT_EXCEEDED");
  if (Array.isArray(value)) {
    if (value.length > limits.maxArray) throw new CliInputError("INPUT_LIMIT_EXCEEDED");
    for (const item of value) checkShape(item, depth + 1, limits);
    return;
  }
  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value);
    if (keys.length > limits.maxProperties) throw new CliInputError("INPUT_LIMIT_EXCEEDED");
    for (const key of keys) checkShape((value as Record<string, unknown>)[key], depth + 1, limits);
  }
}
