import { DEFAULT_DECODE_LIMITS, type DecodeLimits } from "./limits.js";
import { invalid, ok, type Result } from "./results.js";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

class Parser {
  private i = 0;
  private nodes = 0;
  constructor(
    private readonly s: string,
    private readonly limits: DecodeLimits,
  ) {}
  parse(): JsonValue {
    this.ws();
    const value = this.value(0);
    this.ws();
    if (this.i !== this.s.length) throw new Error("trailing");
    return value;
  }
  private ws(): void {
    while (/[\u0009\u000a\u000d\u0020]/u.test(this.s[this.i] ?? "!")) this.i++;
  }
  private node(depth: number): void {
    if (++this.nodes > this.limits.maxNodes || depth > this.limits.maxDepth)
      throw new Error("limit");
  }
  private value(depth: number): JsonValue {
    this.node(depth);
    this.ws();
    const c = this.s[this.i];
    if (c === '"') return this.string();
    if (c === "{") return this.object(depth + 1);
    if (c === "[") return this.array(depth + 1);
    for (const [word, value] of [
      ["true", true],
      ["false", false],
      ["null", null],
    ] as const) {
      if (this.s.startsWith(word, this.i)) {
        this.i += word.length;
        return value;
      }
    }
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/u.exec(
      this.s.slice(this.i),
    );
    if (match) {
      this.i += match[0].length;
      const n = Number(match[0]);
      if (!Number.isSafeInteger(n) || /[.eE]/u.test(match[0]))
        throw new Error("number");
      return n;
    }
    throw new Error("syntax");
  }
  private string(): string {
    const start = this.i++;
    while (this.i < this.s.length) {
      const c = this.s[this.i++];
      if (c === '"') {
        const value = JSON.parse(this.s.slice(start, this.i)) as string;
        if (value.length > this.limits.maxStringLength)
          throw new Error("limit");
        if (
          /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(
            value,
          )
        )
          throw new Error("string");
        return value;
      }
      if (c === "\\") {
        if (this.i >= this.s.length) throw new Error("escape");
        this.i++;
      } else if ((c?.codePointAt(0) ?? 0) < 0x20) throw new Error("control");
    }
    throw new Error("string");
  }
  private object(depth: number): { [key: string]: JsonValue } {
    this.i++;
    this.ws();
    const out: { [key: string]: JsonValue } = Object.create(null) as {
      [key: string]: JsonValue;
    };
    if (this.s[this.i] === "}") {
      this.i++;
      return out;
    }
    while (true) {
      this.ws();
      if (this.s[this.i] !== '"') throw new Error("key");
      const key = this.string();
      if (Object.hasOwn(out, key)) throw new Error("duplicate");
      this.ws();
      if (this.s[this.i++] !== ":") throw new Error("colon");
      out[key] = this.value(depth);
      this.ws();
      const c = this.s[this.i++];
      if (c === "}") return out;
      if (c !== ",") throw new Error("object");
    }
  }
  private array(depth: number): JsonValue[] {
    this.i++;
    this.ws();
    const out: JsonValue[] = [];
    if (this.s[this.i] === "]") {
      this.i++;
      return out;
    }
    while (true) {
      out.push(this.value(depth));
      this.ws();
      const c = this.s[this.i++];
      if (c === "]") return out;
      if (c !== ",") throw new Error("array");
    }
  }
}

export interface DecodeSchema {
  readonly required: readonly string[];
  readonly optional?: readonly string[];
  readonly validateStructure?: (
    value: Readonly<Record<string, JsonValue>>,
  ) => boolean;
  readonly validateDomain?: (
    value: Readonly<Record<string, JsonValue>>,
  ) => boolean;
  readonly validateEdition?: (
    value: Readonly<Record<string, JsonValue>>,
  ) => boolean;
}
export function decodeJson(
  bytes: Uint8Array,
  schema: DecodeSchema,
  limits: DecodeLimits = DEFAULT_DECODE_LIMITS,
): Result<Record<string, JsonValue>> {
  if (bytes.byteLength > limits.maxBytes)
    return invalid("DIAG-INPUT-BYTES", "bytes");
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      bytes,
    );
  } catch {
    return invalid("DIAG-INPUT-UTF8", "utf8");
  }
  if (text.charCodeAt(0) === 0xfeff) return invalid("DIAG-INPUT-BOM", "utf8");
  let value: JsonValue;
  try {
    value = new Parser(text, limits).parse();
  } catch (error) {
    if (error instanceof Error && error.message === "duplicate")
      return invalid("DIAG-JSON-DUPLICATE", "json");
    if (error instanceof Error && error.message === "limit")
      return invalid("DIAG-JSON-LIMIT", "bytes");
    if (error instanceof Error && error.message === "number")
      return invalid("DIAG-JSON-NUMBER", "json");
    return invalid("DIAG-JSON-SYNTAX", "json");
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    return invalid("DIAG-JSON-OBJECT", "structure");
  const allowed = new Set([...schema.required, ...(schema.optional ?? [])]);
  for (const key of schema.required)
    if (!Object.hasOwn(value, key))
      return invalid("DIAG-JSON-REQUIRED", "structure", `/${key}`);
  for (const key of Object.keys(value))
    if (!allowed.has(key))
      return invalid("DIAG-JSON-UNKNOWN", "structure", safePath(key));
  if (!runCheck(schema.validateStructure, value))
    return invalid("DIAG-JSON-STRUCTURE", "structure");
  if (!runCheck(schema.validateDomain, value))
    return invalid("DIAG-JSON-DOMAIN", "domain");
  if (!runCheck(schema.validateEdition, value))
    return invalid("DIAG-JSON-EDITION", "edition");
  return ok(value);
}

function safePath(key: string): string {
  return /^[A-Za-z0-9_-]{1,64}$/u.test(key) ? `/${key}` : "/[redacted]";
}

function runCheck(
  check: DecodeSchema["validateStructure"],
  value: Readonly<Record<string, JsonValue>>,
): boolean {
  if (!check) return true;
  try {
    return check(value) === true;
  } catch {
    return false;
  }
}

export function encodeCanonicalJson(
  value: Readonly<Record<string, unknown>>,
  fieldOrder: readonly string[],
): Result<Uint8Array> {
  const keys = Object.keys(value);
  if (
    new Set(fieldOrder).size !== fieldOrder.length ||
    fieldOrder.some((key) => /^(?:0|[1-9]\d*)$/u.test(key)) ||
    fieldOrder.some((key) => value[key] === undefined) ||
    keys.some((key) => !fieldOrder.includes(key)) ||
    fieldOrder.some((key) => !keys.includes(key))
  )
    return invalid("DIAG-JSON-ENCODE-SHAPE", "structure");
  const ordered = Object.fromEntries(
    fieldOrder.map((key) => [key, value[key]]),
  );
  try {
    const text = JSON.stringify(ordered);
    return ok(new TextEncoder().encode(`${text}\n`));
  } catch {
    return invalid("DIAG-JSON-ENCODE-VALUE", "structure");
  }
}
