// SPDX-License-Identifier: Apache-2.0

import { deepFreeze } from "./domain/immutable.js";
import {
  constraintCatalog as generatedConstraintCatalog,
  operationCatalog as generatedOperationCatalog,
  typeCatalog as generatedTypeCatalog,
} from "./generated/edition.js";

export const constraintCatalog = deepFreeze(generatedConstraintCatalog);
export const operationCatalog = deepFreeze(generatedOperationCatalog);
export const typeCatalog = deepFreeze(generatedTypeCatalog);
