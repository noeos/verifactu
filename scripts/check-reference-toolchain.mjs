// SPDX-License-Identifier: Apache-2.0
import { readJson } from "./project.mjs";
import { resolve } from "node:path";
import { projectRoot } from "./project.mjs";
const expected = await readJson(resolve(projectRoot, "security/reference-toolchain.json"));
if (
  process.env.NOEOS_REFERENCE_PYTHON !== undefined &&
  process.env.NOEOS_REFERENCE_PYTHON !== expected.python
)
  throw new Error("Reference Python mismatch");
console.log(`Reference runtime policy verified: Python ${expected.python}.`);
