#!/usr/bin/env node
import { cp, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, main } from "../lib/policy.mjs";
import { buildPackages } from "./build-packages.mjs";

export async function checkBuildPerformance(root) {
  const temporaryRoot = process.env.TMPDIR;
  assert(temporaryRoot, "MISSING_CONTROLLED_TEMP", "TMPDIR must be provided by the canonical runner");
  const samples = [];
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const workspace = await mkdtemp(path.join(temporaryRoot, `performance-${iteration}-`));
    try {
      await cp(path.join(root, "packages"), path.join(workspace, "packages"), {
        recursive: true,
        filter: (entry) => !entry.split(path.sep).includes("dist"),
      });
      await cp(path.join(root, "config/packages"), path.join(workspace, "config/packages"), { recursive: true });
      const started = performance.now();
      await buildPackages(workspace);
      samples.push(Math.round(performance.now() - started));
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  }
  const maximum = Math.max(...samples);
  assert(maximum <= 15000, "BUILD_PERFORMANCE_BUDGET", `clean package build exceeded 15000 ms: ${maximum} ms`);
  return {
    correctnessGuard: "three successful clean builds",
    sampleCount: samples.length,
    durationsMs: samples,
    maximumMs: maximum,
    budgetMs: 15000,
    peakRssBytes: process.resourceUsage().maxRSS * 1024,
  };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main("build-performance-smoke", () => checkBuildPerformance(root));
