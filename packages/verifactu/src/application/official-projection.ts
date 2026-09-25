import { invalid, ok, type Result } from "../contracts/results.js";
export type ProjectedValue =
  | { readonly presence: "value"; readonly value: string }
  | { readonly presence: "empty" }
  | { readonly presence: "zero" }
  | { readonly presence: "nil" }
  | { readonly presence: "absent" };
export interface ProjectionField {
  readonly name: string;
  readonly order: number;
  readonly value: ProjectedValue;
  readonly allowAbsent?: boolean;
  readonly allowNil?: boolean;
}
export interface ProjectedField {
  readonly name: string;
  readonly order: number;
  readonly presence: Exclude<ProjectedValue["presence"], "absent">;
  readonly value: string | null;
}
export function projectOfficialFields(
  fields: readonly ProjectionField[],
): Result<readonly ProjectedField[]> {
  if (
    !Array.isArray(fields) ||
    fields.some(
      (field) =>
        !field ||
        typeof field.name !== "string" ||
        !/^[A-Za-z_][A-Za-z0-9_.-]*$/u.test(field.name) ||
        !Number.isSafeInteger(field.order) ||
        field.order < 0 ||
        !field.value ||
        !["value", "empty", "zero", "nil", "absent"].includes(
          field.value.presence,
        ),
    )
  )
    return invalid("DIAG-PROJECTION-INVALID", "domain");
  const ordered = [...fields].sort((a, b) => a.order - b.order);
  if (
    new Set(ordered.map((field) => field.name)).size !== ordered.length ||
    new Set(ordered.map((field) => field.order)).size !== ordered.length
  )
    return invalid("DIAG-PROJECTION-ORDER", "domain");
  const out: ProjectedField[] = [];
  for (const field of ordered) {
    const presence = field.value.presence;
    if (presence === "absent") {
      if (field.allowAbsent !== true)
        return invalid("DIAG-PROJECTION-ABSENT", "domain", field.name);
      continue;
    }
    if (presence === "nil" && field.allowNil !== true)
      return invalid("DIAG-PROJECTION-NIL", "domain", field.name);
    if (presence === "value" && typeof field.value.value !== "string")
      return invalid("DIAG-PROJECTION-VALUE", "domain", field.name);
    out.push(
      Object.freeze({
        name: field.name,
        order: field.order,
        presence,
        value:
          presence === "value"
            ? field.value.value
            : presence === "empty"
              ? ""
              : presence === "zero"
                ? "0"
                : null,
      }),
    );
  }
  return ok(Object.freeze(out));
}
