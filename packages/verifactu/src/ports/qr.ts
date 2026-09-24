/** Output boundary for deterministic QR symbol renderers and independent readers. */
export interface QrRenderer {
  render(
    payload: Uint8Array,
    options: {
      readonly errorCorrection: "M";
      readonly quietZoneModules: number;
    },
  ): Promise<
    | {
        readonly kind: "rendered";
        readonly svg: string;
        readonly errorCorrection: "M";
        readonly symbolModules: number;
        readonly quietZoneModules: number;
        readonly symbolWidthMillimetres: 32;
        readonly widthMillimetres: number;
        readonly quietZoneMillimetres: number;
      }
    | { readonly kind: "invalid"; readonly diagnostics: readonly string[] }
    | { readonly kind: "limit"; readonly diagnostics: readonly string[] }
    | { readonly kind: "unavailable"; readonly diagnostics: readonly string[] }
    | { readonly kind: "defect"; readonly diagnostics: readonly string[] }
  >;
}
