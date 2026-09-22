import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import type { FiscalDate, FiscalInstant } from "../domain/date-time.js";
import { diagnostic } from "../domain/diagnostics.js";
import type { ExactDecimal } from "../domain/decimal.js";
import type { EditionId } from "../domain/identities.js";

export type OfficialInputValue =
  | { readonly state: "absent" }
  | { readonly state: "empty" }
  | { readonly state: "xsi-nil" }
  | { readonly state: "text"; readonly value: string }
  | { readonly state: "decimal"; readonly value: ExactDecimal }
  | { readonly state: "date"; readonly value: FiscalDate }
  | { readonly state: "instant"; readonly value: FiscalInstant };

export type OfficialLexicalKind =
  | "text"
  | "decimal-exact"
  | "decimal-trim-trailing-zeroes"
  | "date-iso"
  | "date-day-month-year"
  | "instant";

export interface OfficialFieldRule {
  readonly source: string;
  readonly label: string;
  readonly lexical: OfficialLexicalKind;
  readonly whitespace: "preserve" | "trim";
}

export interface OfficialProjectionDescriptor {
  readonly id: string;
  readonly editionId: EditionId;
  readonly fields: readonly OfficialFieldRule[];
}

export type ProjectedField =
  | {
      readonly source: string;
      readonly label: string;
      readonly state: "absent" | "empty" | "xsi-nil";
    }
  | {
      readonly source: string;
      readonly label: string;
      readonly state: "value";
      readonly lexical: string;
    };

export interface OfficialProjection {
  readonly descriptorId: string;
  readonly editionId: EditionId;
  readonly fields: readonly ProjectedField[];
}

export function projectOfficialFields(
  descriptor: OfficialProjectionDescriptor,
  editionId: EditionId,
  input: Readonly<Record<string, OfficialInputValue>>,
): OperationResult<OfficialProjection> {
  if (descriptor.editionId !== editionId)
    return projectionFailure("DIAG-PROJECTION-EDITION", "/editionId");
  if (
    descriptor.id.length === 0 ||
    descriptor.fields.length === 0 ||
    hasDuplicates(descriptor.fields.map((field) => field.source)) ||
    hasDuplicates(descriptor.fields.map((field) => field.label))
  )
    return projectionFailure("DIAG-PROJECTION-DESCRIPTOR", "/descriptor");

  const fields: ProjectedField[] = [];
  for (const rule of descriptor.fields) {
    if (rule.source.length === 0 || !validLabel(rule.label))
      return projectionFailure("DIAG-PROJECTION-DESCRIPTOR", "/descriptor");
    const value = input[rule.source] ?? { state: "absent" };
    const projected = projectValue(rule, value);
    if (projected === null)
      return projectionFailure(
        "DIAG-PROJECTION-LEXICAL",
        `/fields/${rule.source}`,
      );
    fields.push(projected);
  }
  return succeeded(
    Object.freeze({
      descriptorId: descriptor.id,
      editionId,
      fields: Object.freeze(fields),
    }),
  );
}

function projectValue(
  rule: OfficialFieldRule,
  value: OfficialInputValue,
): ProjectedField | null {
  if (
    value.state === "absent" ||
    value.state === "empty" ||
    value.state === "xsi-nil"
  )
    return Object.freeze({
      source: rule.source,
      label: rule.label,
      state: value.state,
    });
  let lexical: string;
  if (value.state === "text" && rule.lexical === "text") lexical = value.value;
  else if (value.state === "decimal" && rule.lexical.startsWith("decimal-"))
    lexical =
      rule.lexical === "decimal-exact"
        ? value.value.lexical
        : trimDecimal(value.value);
  else if (value.state === "date" && rule.lexical.startsWith("date-"))
    lexical =
      rule.lexical === "date-iso" ? value.value : reverseDate(value.value);
  else if (value.state === "instant" && rule.lexical === "instant")
    lexical = value.value;
  else return null;
  return Object.freeze({
    source: rule.source,
    label: rule.label,
    state: "value",
    lexical: rule.whitespace === "trim" ? lexical.trim() : lexical,
  });
}

function trimDecimal(value: ExactDecimal): string {
  if (value.scale === 0) return value.lexical;
  const trimmed = value.lexical.replace(/0+$/u, "").replace(/\.$/u, "");
  return trimmed === "-0" ? "0" : trimmed;
}

function reverseDate(value: FiscalDate): string {
  return `${value.slice(8, 10)}-${value.slice(5, 7)}-${value.slice(0, 4)}`;
}

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

function validLabel(value: string): boolean {
  return value.length > 0 && !/[=&]/u.test(value);
}

function projectionFailure(
  code: `DIAG-${string}`,
  path: string,
): OperationResult<never> {
  return failed("invalid", [diagnostic(code, "input", "edition", path)]);
}
