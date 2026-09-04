// SPDX-License-Identifier: Apache-2.0

import type { Diagnostic } from "./diagnostic.js";
import { orderDiagnostics } from "./diagnostic.js";

export type VerifactuErrorCode =
  "INVALID_INPUT" | "UNSUPPORTED_EDITION" | "ABORTED" | "INTERNAL_EVIDENCE_FAILED";

export interface VerifactuError {
  readonly name: "VerifactuError";
  readonly code: VerifactuErrorCode;
  readonly retryable: false;
}

export type Result<T> =
  | { readonly ok: true; readonly value: T; readonly diagnostics: readonly Diagnostic[] }
  | {
      readonly ok: false;
      readonly error: VerifactuError;
      readonly diagnostics: readonly Diagnostic[];
    };

export type ValidationStatus = "valid" | "invalid" | "indeterminate" | "aborted";

export type ValidationResult<T> =
  | { readonly status: "valid"; readonly value: T; readonly diagnostics: readonly Diagnostic[] }
  | {
      readonly status: "invalid" | "indeterminate" | "aborted";
      readonly diagnostics: readonly Diagnostic[];
    };

const EMPTY_DIAGNOSTICS: readonly Diagnostic[] = Object.freeze([]);

export function success<T>(value: T, diagnostics: readonly Diagnostic[] = []): Result<T> {
  return Object.freeze({
    ok: true,
    value,
    diagnostics: diagnostics.length === 0 ? EMPTY_DIAGNOSTICS : orderDiagnostics(diagnostics),
  });
}

export function failure<T>(
  code: VerifactuErrorCode,
  diagnostics: readonly Diagnostic[],
): Result<T> {
  return Object.freeze({
    ok: false,
    error: Object.freeze({ name: "VerifactuError", code, retryable: false }),
    diagnostics: orderDiagnostics(diagnostics),
  });
}

export function valid<T>(value: T, diagnostics: readonly Diagnostic[] = []): ValidationResult<T> {
  return Object.freeze({
    status: "valid",
    value,
    diagnostics: diagnostics.length === 0 ? EMPTY_DIAGNOSTICS : orderDiagnostics(diagnostics),
  });
}

export function invalid<T>(diagnostics: readonly Diagnostic[]): ValidationResult<T> {
  return Object.freeze({ status: "invalid", diagnostics: orderDiagnostics(diagnostics) });
}

export function indeterminate<T>(diagnostics: readonly Diagnostic[]): ValidationResult<T> {
  return Object.freeze({ status: "indeterminate", diagnostics: orderDiagnostics(diagnostics) });
}

export function aborted<T>(diagnostics: readonly Diagnostic[]): ValidationResult<T> {
  return Object.freeze({ status: "aborted", diagnostics: orderDiagnostics(diagnostics) });
}
