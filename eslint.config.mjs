import typescriptEslint from "typescript-eslint";

export default [
  {
    files: ["tooling/**/*.mjs", "scripts/**/*.mjs", "packages/**/*.ts"],
    ignores: ["node_modules/**", "evidence/runs/**"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      parser: typescriptEslint.parser,
      globals: {
        AbortSignal: "readonly",
        Buffer: "readonly",
        TextDecoder: "readonly",
        URL: "readonly",
        fetch: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        structuredClone: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint.plugin,
    },
    rules: {
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-undef": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "prefer-const": "error",
    },
  },
];
