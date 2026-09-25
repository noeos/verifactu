import type { Result } from "./results.js";
import { invalid, ok } from "./results.js";

export interface RuntimeConfiguration {
  readonly creationAllowed: false;
  readonly editionId: string;
  readonly maxInputBytes: number;
}

export function createConfiguration(
  input: RuntimeConfiguration,
): Result<RuntimeConfiguration> {
  if (input.creationAllowed !== false)
    return invalid(
      "DIAG-CONFIG-CREATION-DISABLED",
      "domain",
      "/creationAllowed",
    );
  if (!input.editionId || input.editionId.length > 128)
    return invalid("DIAG-CONFIG-EDITION", "domain", "/editionId");
  if (
    !Number.isSafeInteger(input.maxInputBytes) ||
    input.maxInputBytes < 1 ||
    input.maxInputBytes > 16_777_216
  ) {
    return invalid("DIAG-CONFIG-LIMIT", "domain", "/maxInputBytes");
  }
  return ok(Object.freeze({ ...input }));
}
