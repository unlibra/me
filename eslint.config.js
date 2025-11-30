import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default [
  // TypeScript files
  ...tseslint.configs.recommended,

  // Astro files
  ...eslintPluginAstro.configs.recommended,

  {
    rules: {
      // Add your custom rules here
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },

  {
    ignores: ["dist/", ".astro/", "node_modules/"],
  },
];
