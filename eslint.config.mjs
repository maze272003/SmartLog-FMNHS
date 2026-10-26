import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import convexPlugin from "@convex-dev/eslint-plugin";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...convexPlugin.configs.recommended,
  {
    // Convex server functions stay fully strict (no `any`).
    files: ["convex/**/*.ts"],
    ignores: ["convex/_generated/**", "convex/**/*.test.ts", "convex/testHelpers.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    // Browser code interacts with untyped Convex results and error objects in
    // catch blocks; keep the signal as a warning instead of an error.
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // Tests and test helpers legitimately cast mock payloads and Convex ids.
    files: [
      "tests/**/*.{ts,tsx}",
      "convex/**/*.test.ts",
      "convex/testHelpers.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);
