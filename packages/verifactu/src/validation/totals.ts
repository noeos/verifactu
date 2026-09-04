// SPDX-License-Identifier: Apache-2.0

import { createDiagnostic, type Diagnostic } from "../diagnostics/diagnostic.js";
import { invalid, valid, type ValidationResult } from "../diagnostics/result.js";
import { DecimalLexeme } from "../domain/values.js";
import { inspectExactObject, inspectJsonLike } from "./object-inspection.js";

export interface BreakdownTotals {
  readonly expectedTaxMinorUnits: bigint;
  readonly expectedTotalMinorUnits: bigint;
  readonly declaredTaxMinorUnits: bigint;
  readonly declaredTotalMinorUnits: bigint;
  readonly toleranceMinorUnits: bigint;
}

const MAX_LINES = 1_000;
const AEAT_TOLERANCE_MINOR_UNITS = 1_000n;
const EXEMPT_REGIMES = new Set(["03", "05", "06", "08", "09"]);

export function validateBreakdownTotals(input: unknown): ValidationResult<BreakdownTotals> {
  const safe = inspectJsonLike(input);
  if (!safe.ok) return invalidInput(safe.path);
  const object = inspectExactObject(safe.value, ["taxAmount", "totalAmount", "lines"]);
  if (!object.ok) return invalidInput(object.path);
  const taxAmount = DecimalLexeme.parse(object.value["taxAmount"]);
  const totalAmount = DecimalLexeme.parse(object.value["totalAmount"]);
  const lines = object.value["lines"];
  if (
    taxAmount === undefined ||
    totalAmount === undefined ||
    !Array.isArray(lines) ||
    lines.length === 0 ||
    lines.length > MAX_LINES
  ) {
    return invalidInput("");
  }
  let tax = 0n;
  let total = 0n;
  let totalsApplicable = true;
  for (let index = 0; index < lines.length; index += 1) {
    const inspected = inspectExactObject(lines[index], [
      "baseAmount",
      "taxAmount",
      "surchargeAmount",
      "regimeCode",
    ]);
    if (!inspected.ok) return invalidInput(`/lines/${String(index)}${inspected.path}`);
    const base = DecimalLexeme.parse(inspected.value["baseAmount"]);
    const lineTax = DecimalLexeme.parse(inspected.value["taxAmount"]);
    const surcharge = DecimalLexeme.parse(inspected.value["surchargeAmount"]);
    const regime = inspected.value["regimeCode"];
    if (base === undefined || lineTax === undefined || surcharge === undefined || !isRegime(regime))
      return invalidInput(`/lines/${String(index)}`);
    tax += lineTax.toMinorUnits() + surcharge.toMinorUnits();
    total += base.toMinorUnits() + lineTax.toMinorUnits() + surcharge.toMinorUnits();
    if (EXEMPT_REGIMES.has(regime)) totalsApplicable = false;
  }
  const result = Object.freeze({
    expectedTaxMinorUnits: tax,
    expectedTotalMinorUnits: total,
    declaredTaxMinorUnits: taxAmount.toMinorUnits(),
    declaredTotalMinorUnits: totalAmount.toMinorUnits(),
    toleranceMinorUnits: AEAT_TOLERANCE_MINOR_UNITS,
  });
  if (!totalsApplicable) {
    return valid(result, [
      createDiagnostic({
        code: "VF_RECORD_TOTAL_CHECK_NOT_APPLICABLE",
        severity: "info",
        phase: "record",
        ruleId: "VAL-AEAT-3.1.3-16-17-EXEMPTION",
      }),
    ]);
  }
  const diagnostics: Diagnostic[] = [];
  if (absolute(result.declaredTaxMinorUnits - tax) > AEAT_TOLERANCE_MINOR_UNITS)
    diagnostics.push(ruleFailure("VAL-AEAT-3.1.3-16-CUOTA-TOTAL", "/taxAmount"));
  if (absolute(result.declaredTotalMinorUnits - total) > AEAT_TOLERANCE_MINOR_UNITS)
    diagnostics.push(ruleFailure("VAL-AEAT-3.1.3-17-IMPORTE-TOTAL", "/totalAmount"));
  return valid(result, diagnostics);
}

function ruleFailure(ruleId: string, path: string): Diagnostic {
  return createDiagnostic({
    code: "VF_RECORD_TOTAL_MISMATCH",
    severity: "warning",
    phase: "record",
    ruleId,
    path,
  });
}

function invalidInput<T>(path: string): ValidationResult<T> {
  return invalid([
    createDiagnostic({
      code: "VF_INPUT_VALUE_INVALID",
      severity: "error",
      phase: "input",
      ...(path.length === 0 ? {} : { path }),
    }),
  ]);
}

function isRegime(value: unknown): value is string {
  return typeof value === "string" && /^\d{2}$/u.test(value);
}

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}
