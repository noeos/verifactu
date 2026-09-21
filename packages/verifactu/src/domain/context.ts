import type {
  ClockId,
  ConfigurationId,
  CorrelationId,
  EditionId,
  InstallationId,
  PrincipalId,
  TaxpayerId,
  TenantId,
} from "./identities.js";
import type { OperatingMode, TenureId } from "./mode-tenure.js";
import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import type { FiscalInstant } from "./date-time.js";
import { diagnostic } from "./diagnostics.js";

export interface OperationContext {
  readonly tenantId: TenantId;
  readonly taxpayerId: TaxpayerId;
  readonly installationId: InstallationId;
  readonly editionId: EditionId;
  readonly operatingMode: OperatingMode;
  readonly tenureId: TenureId;
  readonly clock: Readonly<{
    id: ClockId;
    instant: FiscalInstant;
    quality: "authoritative" | "synchronized" | "degraded";
  }>;
  readonly configurationId: ConfigurationId;
  readonly locale?: string;
  readonly correlationId: CorrelationId;
  readonly principalId: PrincipalId;
}

export function defineContext(context: OperationContext): OperationContext {
  return Object.freeze({
    ...context,
    clock: Object.freeze({ ...context.clock }),
  });
}

export interface ContextScope {
  readonly tenantId: TenantId;
  readonly taxpayerId: TaxpayerId;
  readonly installationId: InstallationId;
  readonly editionId: EditionId;
}

export function validateContextScope(
  context: OperationContext,
  scope: ContextScope,
): OperationResult<OperationContext> {
  const mismatch = (Object.keys(scope) as (keyof ContextScope)[]).find(
    (key) => context[key] !== scope[key],
  );
  return mismatch === undefined
    ? succeeded(context)
    : failed("rejected", [
        diagnostic("DIAG-CONTEXT-SCOPE", "security", "domain", "/context", {
          field: mismatch,
        }),
      ]);
}
