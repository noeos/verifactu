/** Output boundary for deterministic QR symbol renderers and independent readers. */
export interface QrRenderer {
  render(
    payload: Uint8Array,
    options: {
      readonly errorCorrection: "M";
      readonly quietZoneModules: number;
    },
  ): Promise<
    | { readonly kind: "rendered"; readonly svg: string }
    | { readonly kind: "unavailable"; readonly diagnostics: readonly string[] }
    | { readonly kind: "defect"; readonly diagnostics: readonly string[] }
  >;
}
