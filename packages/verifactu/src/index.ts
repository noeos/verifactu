// SPDX-License-Identifier: Apache-2.0

import { editionInfo } from "./generated/edition.js";

export type EditionId = string & { readonly __brand: "NoeosEditionId" };
export type EditionInfo = typeof editionInfo;
export type Result<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: Error };

export { editionInfo };

export function getEdition(id?: EditionId): Result<EditionInfo> {
  if (id !== undefined && id !== editionInfo.edition)
    return { ok: false, error: new Error(`Unknown regulatory edition: ${id}`) };
  return { ok: true, value: editionInfo };
}

export function listEditions(): readonly EditionInfo[] {
  return [editionInfo];
}
