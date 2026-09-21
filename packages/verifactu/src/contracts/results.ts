import type { Diagnostic } from "../domain/diagnostics.js";

export type OperationResult<T> =
  | { readonly status: "succeeded"; readonly value: T }
  | { readonly status: "invalid"; readonly diagnostics: readonly Diagnostic[] }
  | { readonly status: "conflict"; readonly diagnostics: readonly Diagnostic[] }
  | {
      readonly status: "cancelled";
      readonly diagnostics: readonly Diagnostic[];
    }
  | {
      readonly status: "unavailable";
      readonly diagnostics: readonly Diagnostic[];
    }
  | { readonly status: "rejected"; readonly diagnostics: readonly Diagnostic[] }
  | {
      readonly status: "indeterminate";
      readonly diagnostics: readonly Diagnostic[];
    }
  | { readonly status: "defect"; readonly diagnostics: readonly Diagnostic[] };

export const succeeded = <T>(value: T): OperationResult<T> =>
  Object.freeze({ status: "succeeded", value });

export const failed = <T>(
  status: Exclude<OperationResult<T>["status"], "succeeded">,
  diagnostics: readonly Diagnostic[],
): OperationResult<T> =>
  Object.freeze({ status, diagnostics: Object.freeze([...diagnostics]) });

export function mapResult<A, B>(
  result: OperationResult<A>,
  map: (value: A) => B,
): OperationResult<B> {
  return result.status === "succeeded" ? succeeded(map(result.value)) : result;
}
