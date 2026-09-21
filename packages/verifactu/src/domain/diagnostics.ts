export type DiagnosticCategory =
  | "input"
  | "configuration"
  | "conflict"
  | "availability"
  | "security"
  | "integrity"
  | "internal";

export type DiagnosticSeverity = "error" | "warning" | "information";

export type DiagnosticStage =
  | "bytes"
  | "utf8"
  | "syntax"
  | "structure"
  | "domain"
  | "edition"
  | "state"
  | "chain";

export type DiagnosticParameter = string | number | boolean | null;

export interface Diagnostic {
  readonly code: `DIAG-${string}`;
  readonly category: DiagnosticCategory;
  readonly severity: DiagnosticSeverity;
  readonly stage: DiagnosticStage;
  readonly path: string;
  readonly parameters: Readonly<Record<string, DiagnosticParameter>>;
}

export function diagnostic(
  code: `DIAG-${string}`,
  category: DiagnosticCategory,
  stage: DiagnosticStage,
  path: string,
  parameters: Readonly<Record<string, DiagnosticParameter>> = {},
  severity: DiagnosticSeverity = "error",
): Diagnostic {
  return Object.freeze({
    code,
    category,
    severity,
    stage,
    path,
    parameters: Object.freeze({ ...parameters }),
  });
}
