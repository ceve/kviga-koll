export default [
  {
    files: ["**/*.js", "**/*.mjs"],
    ignores: ["node_modules/**", ".husky/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-undef": "error"
    }
  }
];
