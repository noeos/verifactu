// SPDX-License-Identifier: Apache-2.0

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
  try {
    return new StrictJsonParser(text, limits).parse();
  } catch (error) {
    if (error instanceof CliInputError) throw error;
    throw new CliInputError("JSON_SYNTAX_INVALID");
  }
}

export async function* parseNdjson(
  chunks: AsyncIterable<Uint8Array>,
  limits: JsonLimits,
): AsyncGenerator {
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

class StrictJsonParser {
  private position = 0;

  constructor(
    private readonly text: string,
    private readonly limits: JsonLimits,
  ) {}

  parse(): unknown {
    this.skipWhitespace();
    const value = this.parseValue(0);
    this.skipWhitespace();
    if (this.position !== this.text.length) throw new CliInputError("JSON_SYNTAX_INVALID");
    return value;
  }

  private parseValue(depth: number): unknown {
    if (depth > this.limits.maxDepth) throw new CliInputError("INPUT_LIMIT_EXCEEDED");
    const character = this.text[this.position];
    if (character === "{") return this.parseObject(depth);
    if (character === "[") return this.parseArray(depth);
    if (character === '"') return this.parseString();
    if (character === "t" && this.consume("true")) return true;
    if (character === "f" && this.consume("false")) return false;
    if (character === "n" && this.consume("null")) return null;
    if (character !== undefined && /[-0-9]/u.test(character)) return this.parseNumber();
    throw new CliInputError("JSON_SYNTAX_INVALID");
  }

  private parseObject(depth: number): Record<string, unknown> {
    this.position += 1;
    const value: Record<string, unknown> = {};
    const keys = new Set<string>();
    let propertyCount = 0;
    this.skipWhitespace();
    if (this.peek("}")) {
      this.position += 1;
      return value;
    }
    while (this.position < this.text.length) {
      if (++propertyCount > this.limits.maxProperties) {
        throw new CliInputError("INPUT_LIMIT_EXCEEDED");
      }
      if (this.text[this.position] !== '"') throw new CliInputError("JSON_SYNTAX_INVALID");
      const key = this.parseString();
      if (keys.has(key)) throw new CliInputError("JSON_DUPLICATE_KEY");
      keys.add(key);
      this.skipWhitespace();
      if (this.text[this.position] !== ":") throw new CliInputError("JSON_SYNTAX_INVALID");
      this.position += 1;
      this.skipWhitespace();
      Object.defineProperty(value, key, {
        configurable: true,
        enumerable: true,
        value: this.parseValue(depth + 1),
        writable: true,
      });
      this.skipWhitespace();
      if (this.peek("}")) {
        this.position += 1;
        return value;
      }
      if (!this.peek(",")) throw new CliInputError("JSON_SYNTAX_INVALID");
      this.position += 1;
      this.skipWhitespace();
    }
    throw new CliInputError("JSON_SYNTAX_INVALID");
  }

  private parseArray(depth: number): unknown[] {
    this.position += 1;
    const value: unknown[] = [];
    this.skipWhitespace();
    if (this.peek("]")) {
      this.position += 1;
      return value;
    }
    while (this.position < this.text.length) {
      if (value.length >= this.limits.maxArray) throw new CliInputError("INPUT_LIMIT_EXCEEDED");
      value.push(this.parseValue(depth + 1));
      this.skipWhitespace();
      if (this.peek("]")) {
        this.position += 1;
        return value;
      }
      if (!this.peek(",")) throw new CliInputError("JSON_SYNTAX_INVALID");
      this.position += 1;
      this.skipWhitespace();
    }
    throw new CliInputError("JSON_SYNTAX_INVALID");
  }

  private parseString(): string {
    const start = this.position;
    this.position += 1;
    while (this.position < this.text.length) {
      const character = this.text[this.position];
      if (character === '"') {
        const token = this.text.slice(start, this.position + 1);
        this.position += 1;
        try {
          const value: unknown = JSON.parse(token);
          if (typeof value !== "string") throw new CliInputError("JSON_SYNTAX_INVALID");
          return value;
        } catch {
          throw new CliInputError("JSON_SYNTAX_INVALID");
        }
      }
      if (character === "\\") {
        this.position += 2;
        if (this.text[this.position - 1] === "u") this.position += 4;
      } else {
        if (character !== undefined && character < " ")
          throw new CliInputError("JSON_SYNTAX_INVALID");
        this.position += 1;
      }
    }
    throw new CliInputError("JSON_SYNTAX_INVALID");
  }

  private parseNumber(): number {
    const match = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/u.exec(
      this.text.slice(this.position),
    );
    if (match === null) throw new CliInputError("JSON_SYNTAX_INVALID");
    this.position += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) throw new CliInputError("JSON_NUMBER_INVALID");
    return value;
  }

  private consume(expected: string): boolean {
    if (this.text.startsWith(expected, this.position)) {
      this.position += expected.length;
      return true;
    }
    return false;
  }

  private skipWhitespace(): void {
    while (this.position < this.text.length && isJsonWhitespace(this.text[this.position]))
      this.position += 1;
  }

  private peek(expected: string): boolean {
    return this.text[this.position] === expected;
  }
}

function isJsonWhitespace(value: string | undefined): boolean {
  return value === " " || value === "\t" || value === "\n" || value === "\r";
}
