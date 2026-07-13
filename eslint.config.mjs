import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/.dart_tool/**",
      "**/android/**",
      "**/ios/**",
      "**/linux/**",
      "**/macos/**",
      "**/windows/**",
      "**/web/**",
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  prettier,

  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],

    plugins: {
      import: importPlugin,
      "simple-import-sort": simpleImportSort,
    },

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },

    rules: {
      "no-console": "warn",

      "no-debugger": "error",

      "no-unused-vars": "off",

      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
        },
      ],

      "simple-import-sort/imports": "error",

      "simple-import-sort/exports": "error",

      "import/first": "error",

      "import/newline-after-import": "error",

      "import/no-duplicates": "error",
    },
  },
];