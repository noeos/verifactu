import type { EditionId } from "../domain/identities.js";
import type { OperatingMode } from "../domain/mode-tenure.js";

export interface EditionPolicy {
  readonly edition: EditionId;
  readonly creationAllowed: boolean;
  readonly allowedModes: readonly OperatingMode[];
}

export interface LibraryConfiguration {
  readonly editionPolicy: EditionPolicy;
  readonly strictDecoding: true;
}

export function defineConfiguration(
  configuration: LibraryConfiguration,
): LibraryConfiguration {
  return Object.freeze({
    editionPolicy: Object.freeze({
      ...configuration.editionPolicy,
      allowedModes: Object.freeze([
        ...configuration.editionPolicy.allowedModes,
      ]),
    }),
    strictDecoding: true,
  });
}
