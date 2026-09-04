// SPDX-License-Identifier: Apache-2.0

import { types } from "node:util";

export interface InspectionLimits {
  readonly maxDepth: number;
  readonly maxNodes: number;
  readonly maxArrayElements: number;
  readonly maxStringBytes: number;
}

export const DEFAULT_INSPECTION_LIMITS: InspectionLimits = Object.freeze({
  maxDepth: 32,
  maxNodes: 10_000,
  maxArrayElements: 1_000,
  maxStringBytes: 1_048_576,
});

export type InspectionFailure =
  "type" | "property" | "accessor" | "symbol" | "cycle" | "limit" | "unicode";

const PROTOTYPE_POLLUTION_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export type InspectionResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: InspectionFailure; readonly path: string };

interface InspectionState {
  nodes: number;
  readonly seen: WeakSet<object>;
  readonly limits: InspectionLimits;
}

export function inspectExactObject(
  input: unknown,
  keys: readonly string[],
  optional: readonly string[] = [],
): InspectionResult<Readonly<Record<string, unknown>>> {
  if (!isPlainObject(input)) return inspectionFailure("type", "");
  const descriptors = Object.getOwnPropertyDescriptors(input);
  if (Reflect.ownKeys(descriptors).some((key) => typeof key === "symbol")) {
    return inspectionFailure("symbol", "");
  }
  const allowed = new Set([...keys, ...optional]);
  for (const name of Object.keys(descriptors)) {
    if (PROTOTYPE_POLLUTION_KEYS.has(name)) {
      return inspectionFailure("property", `/${escapePointer(name)}`);
    }
    if (!allowed.has(name)) return inspectionFailure("property", `/${escapePointer(name)}`);
    const descriptor = descriptors[name];
    if (descriptor === undefined || !("value" in descriptor)) {
      return inspectionFailure("accessor", `/${escapePointer(name)}`);
    }
  }
  const output: Record<string, unknown> = {};
  for (const name of keys) {
    const descriptor = descriptors[name];
    if (descriptor === undefined || !("value" in descriptor)) {
      return inspectionFailure("property", `/${escapePointer(name)}`);
    }
    const value: unknown = descriptor.value;
    output[name] = value;
  }
  for (const name of optional) {
    const descriptor = descriptors[name];
    if (descriptor !== undefined && "value" in descriptor) {
      const value: unknown = descriptor.value;
      output[name] = value;
    }
  }
  return { ok: true, value: Object.freeze(output) };
}

export function inspectJsonLike(
  input: unknown,
  limits: InspectionLimits = DEFAULT_INSPECTION_LIMITS,
): InspectionResult<unknown> {
  return inspectValue(input, "", 0, { nodes: 0, seen: new WeakSet(), limits });
}

function inspectValue(
  input: unknown,
  path: string,
  depth: number,
  state: InspectionState,
): InspectionResult<unknown> {
  state.nodes += 1;
  if (depth > state.limits.maxDepth || state.nodes > state.limits.maxNodes) {
    return inspectionFailure("limit", path);
  }
  if (input === null || typeof input === "boolean") return { ok: true, value: input };
  if (typeof input === "number") {
    return Number.isSafeInteger(input)
      ? { ok: true, value: input }
      : inspectionFailure("type", path);
  }
  if (typeof input === "string") {
    if (!isValidUnicode(input)) return inspectionFailure("unicode", path);
    if (Buffer.byteLength(input, "utf8") > state.limits.maxStringBytes) {
      return inspectionFailure("limit", path);
    }
    return { ok: true, value: input };
  }
  if (typeof input !== "object" || types.isProxy(input)) {
    return inspectionFailure("type", path);
  }
  if (state.seen.has(input)) return inspectionFailure("cycle", path);
  state.seen.add(input);
  if (Array.isArray(input)) {
    if (input.length > state.limits.maxArrayElements) return inspectionFailure("limit", path);
    const descriptors = Object.getOwnPropertyDescriptors(input);
    const output: unknown[] = [];
    for (let index = 0; index < input.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (descriptor === undefined || !("value" in descriptor)) {
        return inspectionFailure("accessor", `${path}/${String(index)}`);
      }
      const value: unknown = descriptor.value;
      const inspected = inspectValue(value, `${path}/${String(index)}`, depth + 1, state);
      if (!inspected.ok) return inspected;
      output.push(inspected.value);
    }
    state.seen.delete(input);
    return { ok: true, value: Object.freeze(output) };
  }
  if (!isPlainObject(input)) return inspectionFailure("type", path);
  const descriptors = Object.getOwnPropertyDescriptors(input);
  const output: Record<string, unknown> = {};
  for (const key of Reflect.ownKeys(descriptors)) {
    if (typeof key === "symbol") return inspectionFailure("symbol", path);
    if (PROTOTYPE_POLLUTION_KEYS.has(key)) {
      return inspectionFailure("property", `${path}/${escapePointer(key)}`);
    }
    const descriptor = descriptors[key];
    if (descriptor === undefined || !("value" in descriptor)) {
      return inspectionFailure("accessor", `${path}/${escapePointer(key)}`);
    }
    const value: unknown = descriptor.value;
    const inspected = inspectValue(value, `${path}/${escapePointer(key)}`, depth + 1, state);
    if (!inspected.ok) return inspected;
    output[key] = inspected.value;
  }
  state.seen.delete(input);
  return { ok: true, value: Object.freeze(output) };
}

function isPlainObject(input: unknown): input is object {
  if (input === null || typeof input !== "object" || types.isProxy(input)) return false;
  const prototype: unknown = Object.getPrototypeOf(input);
  return prototype === Object.prototype || prototype === null;
}

export function isValidUnicode(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!Number.isInteger(next) || next < 0xdc00 || next > 0xdfff) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) return false;
  }
  return true;
}

function inspectionFailure<T>(reason: InspectionFailure, path: string): InspectionResult<T> {
  return { ok: false, reason, path };
}

function escapePointer(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}
