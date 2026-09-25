import { invalid, ok, type Result } from "../contracts/results.js";
import type { Identity } from "../domain/identities.js";
import { isIdentity } from "../domain/identities.js";
import type { ProjectedField } from "./official-projection.js";
export interface SerializationRule {
  readonly editionId: Identity<"edition">;
  readonly label: string;
  readonly separator: string;
  readonly encoding: "utf-8";
  readonly fields: readonly string[];
  readonly nilToken?: string;
}
export interface OfficialSerialization {
  readonly text: string;
  readonly bytes: Uint8Array;
  readonly length: number;
}
function hasOnlyUnicodeScalars(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (index + 1 >= value.length || next < 0xdc00 || next > 0xdfff)
        return false;
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return false;
    }
  }
  return true;
}
export function serializeOfficialProjection(
  fields: readonly ProjectedField[],
  rule: SerializationRule,
): Result<OfficialSerialization> {
  if (
    !Array.isArray(fields) ||
    !rule ||
    !isIdentity(rule.editionId, "edition") ||
    typeof rule.label !== "string" ||
    !rule.label ||
    !hasOnlyUnicodeScalars(rule.label) ||
    typeof rule.separator !== "string" ||
    rule.separator.length > 8 ||
    !hasOnlyUnicodeScalars(rule.separator) ||
    rule.encoding !== "utf-8" ||
    !Array.isArray(rule.fields) ||
    new Set(rule.fields).size !== rule.fields.length ||
    fields.length !== rule.fields.length ||
    fields.some(
      (field) =>
        !field ||
        (field.presence === "nil" &&
          (typeof rule.nilToken !== "string" ||
            rule.nilToken.length === 0 ||
            rule.nilToken.length > 64 ||
            !hasOnlyUnicodeScalars(rule.nilToken))),
    ) ||
    fields.some(
      (field, index) =>
        !field ||
        field.name !== rule.fields[index] ||
        !["value", "empty", "zero", "nil"].includes(field.presence) ||
        (field.value !== null && typeof field.value !== "string") ||
        (field.presence === "value" &&
          (typeof field.value !== "string" ||
            field.value.length === 0 ||
            !hasOnlyUnicodeScalars(field.value))) ||
        (field.presence === "empty" && field.value !== "") ||
        (field.presence === "zero" && field.value !== "0") ||
        (field.presence === "nil" && field.value !== null),
    )
  )
    return invalid("DIAG-SERIALIZATION-RULE", "edition");
  const text =
    rule.label +
    fields
      .map((field) => {
        const lexical =
          field.presence === "nil"
            ? rule.nilToken
            : field.value === null
              ? ""
              : field.value;
        return rule.separator + lexical;
      })
      .join("");
  const bytes = new TextEncoder().encode(text);
  return ok(
    Object.freeze({
      text,
      get bytes() {
        return bytes.slice();
      },
      length: bytes.byteLength,
    }),
  );
}
