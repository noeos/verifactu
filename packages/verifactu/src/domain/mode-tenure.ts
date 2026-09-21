import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { compareFiscalInstants, type FiscalInstant } from "./date-time.js";
import { diagnostic } from "./diagnostics.js";
import type {
  ConfigurationId,
  EventId,
  EvidenceId,
  InstallationId,
  PrincipalId,
  TaxpayerId,
} from "./identities.js";

declare const tenureBrand: unique symbol;
export type TenureId = string & { readonly [tenureBrand]: true };
export type OperatingMode = "non-verifactu" | "verifactu";

export interface ModeTenure {
  readonly id: TenureId;
  readonly taxpayerId: TaxpayerId;
  readonly installationId: InstallationId;
  readonly mode: OperatingMode;
  readonly beganAt: FiscalInstant;
  readonly endedAt?: FiscalInstant;
  readonly decisionSource:
    | "initial-configuration"
    | "authorized-transition"
    | "fault-recovery";
  readonly authorizedBy: PrincipalId;
  readonly configurationId: ConfigurationId;
  readonly transitionEvidenceIds: readonly EvidenceId[];
  readonly relatedEventIds: readonly EventId[];
}

export function defineModeTenure(
  tenure: ModeTenure,
): OperationResult<ModeTenure> {
  if (
    (tenure.endedAt !== undefined &&
      compareFiscalInstants(tenure.beganAt, tenure.endedAt) >= 0) ||
    tenure.transitionEvidenceIds.length === 0 ||
    tenure.relatedEventIds.length === 0
  ) {
    return failed("invalid", [
      diagnostic("DIAG-TENURE-INTERVAL", "input", "domain", "/tenure"),
    ]);
  }
  return succeeded(
    Object.freeze({
      ...tenure,
      transitionEvidenceIds: Object.freeze([...tenure.transitionEvidenceIds]),
      relatedEventIds: Object.freeze([...tenure.relatedEventIds]),
    }),
  );
}

export function validateTenureSequence(
  tenures: readonly ModeTenure[],
): OperationResult<readonly ModeTenure[]> {
  for (let index = 0; index < tenures.length; index += 1) {
    const current = tenures[index];
    const next = tenures[index + 1];
    if (
      current === undefined ||
      (next !== undefined &&
        (current.endedAt === undefined ||
          compareFiscalInstants(current.endedAt, next.beganAt) !== 0 ||
          current.taxpayerId !== next.taxpayerId ||
          current.installationId !== next.installationId))
    ) {
      return failed("conflict", [
        diagnostic("DIAG-TENURE-SEQUENCE", "conflict", "state", "/tenures", {
          index,
        }),
      ]);
    }
  }
  return succeeded(Object.freeze([...tenures]));
}

export function transitionMode(
  current: OperatingMode,
  target: OperatingMode,
  rollbackAllowed = false,
): OperationResult<OperatingMode> {
  if (current === target) return succeeded(target);
  if (current === "non-verifactu") return succeeded("verifactu");
  if (rollbackAllowed) return succeeded("non-verifactu");
  return failed("rejected", [
    diagnostic("DIAG-MODE-ROLLBACK", "configuration", "state", "/mode"),
  ]);
}

export function tenureAt(
  tenures: readonly ModeTenure[],
  instant: FiscalInstant,
): OperationResult<ModeTenure> {
  const matches = tenures.filter(
    (tenure) =>
      compareFiscalInstants(tenure.beganAt, instant) <= 0 &&
      (tenure.endedAt === undefined ||
        compareFiscalInstants(instant, tenure.endedAt) < 0),
  );
  return matches.length === 1
    ? succeeded(matches[0]!)
    : failed("conflict", [
        diagnostic("DIAG-TENURE-EFFECTIVE", "conflict", "state", "/tenures", {
          matches: matches.length,
        }),
      ]);
}
