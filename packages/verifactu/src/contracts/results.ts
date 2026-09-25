export type DiagnosticStage =
  | "bytes"
  | "utf8"
  | "json"
  | "structure"
  | "domain"
  | "edition";

export interface Diagnostic {
  readonly code: string;
  readonly stage: DiagnosticStage;
  readonly path: string;
  readonly severity: "error" | "fatal";
  readonly retryable: false;
}

export type Result<T> =
  | { readonly status: "ok"; readonly value: T }
  | {
      readonly status: "invalid" | "conflict" | "indeterminate" | "unavailable";
      readonly diagnostics: readonly Diagnostic[];
    };

export const ok = <T>(value: T): Result<T> => ({ status: "ok", value });
export const invalid = <T = never>(
  code: string,
  stage: DiagnosticStage,
  path = "",
): Result<T> => ({
  status: "invalid",
  diagnostics: [{ code, stage, path, severity: "error", retryable: false }],
});
