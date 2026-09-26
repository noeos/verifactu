import type { Result } from "../contracts/results.js";

export type QrCorrectionLevel = "M";
export interface QrMatrix {
  readonly size: number;
  get(x: number, y: number): boolean;
}
export interface QrEncoderPort {
  readonly providerId: string;
  encode(payload: Uint8Array, level: QrCorrectionLevel): Result<QrMatrix>;
}
export interface QrEdition {
  readonly id: "rrsif-2026-09-21-authoritative-candidate";
  readonly environment: "test" | "production";
  readonly mode: "verifactu" | "non-verifactu";
}
