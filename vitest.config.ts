import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    projects: [
      // Convex server-function tests (convex-test runs handlers in an
      // edge-runtime VM per the Convex testing guidelines).
      {
        test: {
          name: "convex",
          environment: "edge-runtime",
          include: ["convex/**/*.test.ts"],
        },
      },
      // Pure domain-logic and React component tests.
      {
        test: {
          name: "app",
          environment: "jsdom",
          setupFiles: ["./tests/setup.ts"],
          include: ["tests/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
});
