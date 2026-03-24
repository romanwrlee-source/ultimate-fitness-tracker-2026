import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        Response: "readonly",
        Request: "readonly",
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },
  {
    ignores: ["node_modules/", "dist/", "*.config.*"],
  },
];
