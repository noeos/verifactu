// SPDX-License-Identifier: Apache-2.0

import { deepFreeze } from "./domain/immutable.js";
import {
  contractSchema as generatedContractSchema,
  constraintCatalog as generatedConstraintCatalog,
  typeCatalog as generatedTypeCatalog,
} from "./generated/edition.js";

export const contractSchema = deepFreeze(generatedContractSchema);
export const constraintCatalog = deepFreeze(generatedConstraintCatalog);
export const typeCatalog = deepFreeze(generatedTypeCatalog);
