import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * The image domain (quantisation, palette, build plan, bill of materials) is pure TypeScript over
 * typed arrays: it imports only its own relative modules, never a package, the DOM or React.
 * That is what keeps it testable in Node and reusable outside the browser. The compiler enforces
 * the same rule through tsconfig.domain.json (no DOM lib, no Node types); this lint catches it early.
 */
const domainForbidden = [
  { regex: "^[^.]", message: "src/domain is pure: no package or Node import." },
  { group: ["**/web", "**/web/**"], message: "src/domain never imports the web layer." },
];

// Vite, Vitest and ESLint load their config from a default export; the framework imposes it.
const configFiles = ["vite.config.ts", "eslint.config.js"];

// Early, deterministic smell detection; SonarQube refines it after the push.
const complexityRules = {
  complexity: ["error", 10],
  "max-depth": ["error", 3],
  "max-params": ["error", 4],
  "max-lines-per-function": ["error", { max: 40, skipBlankLines: true, skipComments: true }],
};

export default tseslint.config(
  { ignores: ["dist", "coverage"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: globals.browser },
    rules: {
      ...complexityRules,
      "no-restricted-exports": [
        "error",
        { restrictDefaultExports: { direct: true, named: true, defaultFrom: true, namedFrom: true, namespaceFrom: true } },
      ],
    },
  },
  {
    files: [...configFiles, "scripts/**/*"],
    languageOptions: { globals: globals.node },
    rules: { "no-restricted-exports": "off" },
  },
  {
    files: ["src/web/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    // Tests import vitest; the purity rule guards production domain code only.
    ignores: ["src/domain/**/*.test.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: domainForbidden }] },
  },
);
