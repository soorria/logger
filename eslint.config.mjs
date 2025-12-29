import js from "@eslint/js";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";

export default tseslint.config(
  { ignores: ["**/node_modules", "**/build", "**/coverage", "**/dist"] },
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: { "unused-imports": unusedImports },
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { project: "./tsconfig.json" },
    },
    rules: {
      semi: ["error", "always"],
      "unused-imports/no-unused-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],
      "no-console": ["error", { allow: ["warn", "error"] }],
      curly: "error",
    },
  }
);

