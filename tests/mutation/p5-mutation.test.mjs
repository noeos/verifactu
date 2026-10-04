import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const plan = JSON.parse(await readFile(resolve(import.meta.dirname, "../../config/quality/p5-quality-plan.json"), "utf8"));

test("P5 mutation population is frozen to 24 critical and 16 additional unique IDs", () => {
  const mutants = [...plan.mutation.criticalMutants, ...plan.mutation.otherMutants];
  assert.equal(plan.criticalCatalogue.length, 24);
  assert.equal(plan.mutation.criticalMutants.length, 24);
  assert.equal(plan.mutation.otherMutants.length, 16);
  assert.equal(new Set(mutants).size, 40);
  assert.deepEqual(mutants, Array.from({ length: 40 }, (_, index) => `P5-MUT-${String(index + 1).padStart(3, "0")}`));
  assert.equal(plan.mutation.criticalKilledPercent, 100);
  assert.equal(plan.mutation.otherKilledPercent, 95);
  assert.equal(plan.mutation.unreviewedSurvivors, 0);
});
