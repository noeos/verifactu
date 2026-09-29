import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { applyOverallMutation } from "./p4-mutation-catalog.mjs";

const configPath = process.env.VERIFACTU_P4_MUTATION_CONFIG;
if (!configPath) throw new Error("P4_MUTATION_CONFIG_MISSING");

const config = JSON.parse(readFileSync(configPath, "utf8"));
const root = resolve(config.root);
const sourcePath = resolve(root, config.module);
const runtimePath = resolve(root, config.runtimeModule);
const sourceUrl = pathToFileURL(sourcePath).href;
const runtimeUrl = pathToFileURL(runtimePath).href;
const original = readFileSync(sourcePath, "utf8");
const mutated = applyOverallMutation(original, config.mutation);

let runtimeSource = mutated;
if (sourcePath.endsWith(".ts")) {
  const configFile = ts.readConfigFile(
    resolve(root, "packages/verifactu/tsconfig.json"),
    ts.sys.readFile,
  );
  if (configFile.error)
    throw new Error(
      `P4_MUTATION_TYPESCRIPT_CONFIG: ${ts.flattenDiagnosticMessageText(
        configFile.error.messageText,
        "\n",
      )}`,
    );
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    resolve(root, "packages/verifactu"),
  );
  if (parsed.errors.length > 0)
    throw new Error(
      `P4_MUTATION_TYPESCRIPT_CONFIG: ${parsed.errors
        .map((error) =>
          ts.flattenDiagnosticMessageText(error.messageText, "\n"),
        )
        .join("; ")}`,
    );
  const emitted = ts.transpileModule(mutated, {
    fileName: sourcePath,
    compilerOptions: {
      ...parsed.options,
      declaration: false,
      declarationMap: false,
      emitDeclarationOnly: false,
      inlineSourceMap: false,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      sourceMap: false,
    },
    reportDiagnostics: true,
  });
  const diagnostics = emitted.diagnostics ?? [];
  if (diagnostics.length > 0)
    throw new Error(
      `P4_MUTATION_TYPESCRIPT_EMIT: ${diagnostics
        .map((diagnostic) =>
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        )
        .join("; ")}`,
    );
  runtimeSource = emitted.outputText;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL === runtimeUrl)
      return nextResolve(specifier, { ...context, parentURL: runtimeUrl });
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url !== runtimeUrl) return nextLoad(url, context);
    return { format: "module", source: runtimeSource, shortCircuit: true };
  },
});

process.emitWarning(
  `P4_MUTATION_ACTIVE:${config.mutation.id}:${sourceUrl}=>${runtimeUrl}`,
  { code: "VERIFACTU_P4_MUTATION" },
);
