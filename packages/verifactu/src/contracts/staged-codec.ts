import {
  DEFAULT_DECODE_LIMITS,
  validDecodeLimits,
  type DecodeLimits,
} from "./limits.js";
import { failed, type OperationResult } from "./results.js";
import { diagnostic } from "../domain/diagnostics.js";

export interface StructuralDecoder<T> {
  readonly decode: (value: unknown) => OperationResult<T>;
}

class JsonReader {
  #position = 0;
  #members = 0;

  constructor(
    private readonly source: string,
    private readonly limits: DecodeLimits,
  ) {}

  read(): unknown {
    const value = this.#value(0);
    this.#space();
    if (this.#position !== this.source.length) throw new Error("trailing-data");
    return value;
  }

  #space(): void {
    while (/\s/u.test(this.source[this.#position] ?? "")) this.#position += 1;
  }

  #value(depth: number): unknown {
    this.#space();
    if (depth > this.limits.maximumDepth) throw new Error("maximum-depth");
    const token = this.source[this.#position];
    if (token === "{") return this.#object(depth + 1);
    if (token === "[") return this.#array(depth + 1);
    if (token === '"') return this.#string();
    for (const [literal, value] of [
      ["true", true],
      ["false", false],
      ["null", null],
    ] as const) {
      if (this.source.startsWith(literal, this.#position)) {
        this.#position += literal.length;
        return value;
      }
    }
    const number = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/u.exec(
      this.source.slice(this.#position),
    )?.[0];
    if (number === undefined) throw new Error("unexpected-token");
    this.#position += number.length;
    const parsed = Number(number);
    if (!Number.isFinite(parsed)) throw new Error("non-finite-number");
    return parsed;
  }

  #string(): string {
    const start = this.#position;
    this.#position += 1;
    while (this.#position < this.source.length) {
      const token = this.source[this.#position];
      if (token === '"') {
        this.#position += 1;
        const value = JSON.parse(
          this.source.slice(start, this.#position),
        ) as string;
        if ([...value].length > this.limits.maximumStringCodePoints)
          throw new Error("maximum-string");
        return value;
      }
      if (token === "\\") this.#position += 1;
      this.#position += 1;
    }
    throw new Error("unterminated-string");
  }

  #object(depth: number): Readonly<Record<string, unknown>> {
    this.#position += 1;
    const result: Record<string, unknown> = Object.create(null) as Record<
      string,
      unknown
    >;
    const names = new Set<string>();
    this.#space();
    if (this.source[this.#position] === "}") {
      this.#position += 1;
      return result;
    }
    for (;;) {
      this.#space();
      if (this.source[this.#position] !== '"') throw new Error("member-name");
      const name = this.#string();
      if (names.has(name)) throw new Error("duplicate-member");
      names.add(name);
      this.#members += 1;
      if (this.#members > this.limits.maximumMembers)
        throw new Error("maximum-members");
      this.#space();
      if (this.source[this.#position] !== ":") throw new Error("member-colon");
      this.#position += 1;
      result[name] = this.#value(depth);
      this.#space();
      const separator = this.source[this.#position];
      this.#position += 1;
      if (separator === "}") return Object.freeze(result);
      if (separator !== ",") throw new Error("member-separator");
    }
  }

  #array(depth: number): readonly unknown[] {
    this.#position += 1;
    const result: unknown[] = [];
    this.#space();
    if (this.source[this.#position] === "]") {
      this.#position += 1;
      return Object.freeze(result);
    }
    for (;;) {
      result.push(this.#value(depth));
      this.#space();
      const separator = this.source[this.#position];
      this.#position += 1;
      if (separator === "]") return Object.freeze(result);
      if (separator !== ",") throw new Error("array-separator");
    }
  }
}

export function decodeJson<T>(
  bytes: Uint8Array,
  decoder: StructuralDecoder<T>,
  limits: DecodeLimits = DEFAULT_DECODE_LIMITS,
): OperationResult<T> {
  if (!validDecodeLimits(limits) || bytes.byteLength > limits.maximumBytes) {
    return failed("invalid", [
      diagnostic("DIAG-DECODE-LIMIT", "input", "bytes", "", {
        maximumBytes: limits.maximumBytes,
      }),
    ]);
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      bytes,
    );
  } catch {
    return failed("invalid", [
      diagnostic("DIAG-UTF8-INVALID", "input", "utf8", ""),
    ]);
  }
  let value: unknown;
  try {
    value = new JsonReader(text, limits).read();
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown";
    return failed("invalid", [
      diagnostic(
        reason === "duplicate-member"
          ? "DIAG-JSON-DUPLICATE"
          : "DIAG-JSON-SYNTAX",
        "input",
        "syntax",
        "",
        { reason },
      ),
    ]);
  }
  return decoder.decode(value);
}

export function objectShape<T>(
  allowedMembers: readonly string[],
  map: (value: Readonly<Record<string, unknown>>) => OperationResult<T>,
): StructuralDecoder<T> {
  return {
    decode(value) {
      if (value === null || Array.isArray(value) || typeof value !== "object") {
        return failed("invalid", [
          diagnostic("DIAG-STRUCTURE-OBJECT", "input", "structure", ""),
        ]);
      }
      const record = value as Readonly<Record<string, unknown>>;
      const unexpected = Object.keys(record).filter(
        (member) => !allowedMembers.includes(member),
      );
      if (unexpected.length > 0) {
        return failed("invalid", [
          diagnostic("DIAG-STRUCTURE-MEMBER", "input", "structure", "", {
            member: unexpected[0] ?? "",
          }),
        ]);
      }
      return map(record);
    },
  };
}
