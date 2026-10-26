import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// React 19 + Testing Library act() environment flag
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom keeps the document between tests without globals:true — clean up.
afterEach(() => {
  cleanup();
});
