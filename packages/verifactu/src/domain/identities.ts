import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { diagnostic } from "./diagnostics.js";

declare const identityBrand: unique symbol;
export type Identity<Kind extends string> = string & {
  readonly [identityBrand]: Kind;
};

export type TenantId = Identity<"tenant">;
export type TaxpayerId = Identity<"taxpayer">;
export type InstallationId = Identity<"installation">;
export type RecordId = Identity<"record">;
export type EventId = Identity<"event">;
export type CorrelationId = Identity<"correlation">;
export type PrincipalId = Identity<"principal">;
export type EditionId = Identity<"edition">;

const IDENTITY_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._:-]{0,126}[A-Za-z0-9])?$/u;

export function identity<Kind extends string>(
  kind: Kind,
  value: string,
): OperationResult<Identity<Kind>> {
  if (!IDENTITY_PATTERN.test(value)) {
    return failed("invalid", [
      diagnostic("DIAG-IDENTITY-INVALID", "input", "domain", `/${kind}`, {
        kind,
      }),
    ]);
  }
  return succeeded(value as Identity<Kind>);
}

export function editionId(value: string): OperationResult<EditionId> {
  return identity("edition", value);
}
