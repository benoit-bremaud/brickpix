import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * The image domain (quantisation, palette, build plan, bill of materials) is pure TypeScript over
 * typed arrays: it imports only its own relative modules, never a package, the DOM or React.
 * That is what keeps it testable in Node and reusable outside the browser.
 */
const domainForbidden = [
  { regex: "^[^.]", message: "src/domain is pure: no package or Node import." },
  { group: ["**/web", "**/web/**"], message: "src/domain never imports the web layer." },
];

const config = tseslint.config(
  { ignores: ["dist", "coverage"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "no-restricted-exports": [
        "error",
        { restrictDefaultExports: { direct: true, named: true, defaultFrom: true, namedFrom: true, namespaceFrom: true } },
      ],
    },
  },
  {
    files: ["vite.config.ts", "eslint.config.js"],
    rules: { "no-restricted-exports": "off" },
  },
  {
    files: ["src/web/**/*.tsx"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: domainForbidden }],
      "no-restricted-globals": ["error", "process", "Buffer", "document", "window"],
    },
  },
);

// ESLint loads the flat config from the default export; the framework imposes it.
export default config;
