import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { diagnostic } from "./diagnostics.js";
import type { FiscalEvent } from "./events.js";
import type { InstallationId, TaxpayerId } from "./identities.js";
import type { OperatingMode } from "./mode-tenure.js";

export type InstallationState =
  | { readonly kind: "unconfigured" }
  | {
      readonly kind: "active";
      readonly mode: OperatingMode;
      readonly taxpayerId: TaxpayerId;
      readonly installationId: InstallationId;
    }
  | {
      readonly kind: "transition-pending";
      readonly from: "non-verifactu";
      readonly to: "verifactu";
      readonly taxpayerId: TaxpayerId;
      readonly installationId: InstallationId;
    }
  | {
      readonly kind: "suspended-by-fault";
      readonly priorMode: OperatingMode;
      readonly taxpayerId: TaxpayerId;
      readonly installationId: InstallationId;
    }
  | { readonly kind: "retired" };

export const INITIAL_INSTALLATION_STATE: InstallationState = Object.freeze({
  kind: "unconfigured",
});

export function transitionInstallation(
  state: InstallationState,
  event: FiscalEvent,
): OperationResult<InstallationState> {
  if (state.kind === "unconfigured" && event.kind === "configured") {
    return succeeded(
      Object.freeze({
        kind: "active",
        mode: event.mode,
        taxpayerId: event.taxpayerId,
        installationId: event.installationId,
      }),
    );
  }
  if (
    state.kind === "active" &&
    state.mode === "non-verifactu" &&
    event.kind === "transition-requested"
  ) {
    return succeeded(
      Object.freeze({
        kind: "transition-pending",
        from: "non-verifactu",
        to: "verifactu",
        taxpayerId: state.taxpayerId,
        installationId: state.installationId,
      }),
    );
  }
  if (
    state.kind === "transition-pending" &&
    event.kind === "transition-completed"
  ) {
    return succeeded(
      Object.freeze({
        kind: "active",
        mode: "verifactu",
        taxpayerId: state.taxpayerId,
        installationId: state.installationId,
      }),
    );
  }
  if (state.kind === "active" && event.kind === "fault-suspended") {
    return succeeded(
      Object.freeze({
        kind: "suspended-by-fault",
        priorMode: state.mode,
        taxpayerId: state.taxpayerId,
        installationId: state.installationId,
      }),
    );
  }
  if (state.kind === "suspended-by-fault" && event.kind === "resumed") {
    return succeeded(
      Object.freeze({
        kind: "active",
        mode: state.priorMode,
        taxpayerId: state.taxpayerId,
        installationId: state.installationId,
      }),
    );
  }
  if (
    state.kind !== "unconfigured" &&
    state.kind !== "retired" &&
    event.kind === "retired"
  ) {
    return succeeded(Object.freeze({ kind: "retired" }));
  }
  return failed("conflict", [
    diagnostic("DIAG-STATE-TRANSITION", "conflict", "state", "/state", {
      state: state.kind,
      event: event.kind,
    }),
  ]);
}
