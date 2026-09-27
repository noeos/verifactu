import {
  createEngine,
  type Engine,
  type EngineOptions,
} from "@noeos/verification-engine";

export type { Engine, EngineOptions } from "@noeos/verification-engine";

export interface VerificationEnginePort {
  createEngine(options?: EngineOptions): Engine;
}

export const verificationEnginePort: VerificationEnginePort = Object.freeze({
  createEngine,
});
