<<<<<<< HEAD
/**
 * Vitest configuration for the Snake / Next.js 15 project.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • environment: "jsdom"   – Browser-like DOM for React component tests.
 * • globals: true          – Injects describe/it/expect/vi globally so test
 *                            files don't need explicit imports (matches Jest DX).
 * • setupFiles             – Loads @testing-library/jest-dom matchers (toBeInTheDocument, etc.)
 *                            before every test file.
 * • resolve.alias          – Mirrors the `@/*` path alias in tsconfig.json so
 *                            imports like `import { foo } from "@/lib/foo"` resolve
 *                            correctly inside Vitest (Vite does not read tsconfig paths
 *                            automatically).
 * • @vitejs/plugin-react   – Transforms JSX/TSX and enables React Fast-Refresh
 *                            (needed for React 19 + RSC compatibility shim).
 * • include                – Only picks up *.test.{ts,tsx} and *.spec.{ts,tsx}
 *                            under src/ to keep test discovery fast.
 * • coverage               – v8 provider, excludes config/type files.
 *
 * Scaling note
 * ─────────────────────────────────────────────────────────────────────────────
 * Test parallelism is handled automatically by Vitest's worker pool. If the
 * suite grows large, add `pool: "vmForks"` and tune `poolOptions.vmForks.maxForks`
 * to match available CI cores rather than spawning unlimited workers.
 */

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],

  test: {
    // Use jsdom to simulate a browser environment for RTL component tests.
    environment: "jsdom",

    // Inject Vitest globals (describe, it, expect, vi, beforeEach, …) globally
    // so test files are terse and consistent with Jest conventions.
    globals: true,

    // Run @testing-library/jest-dom setup before every test file so custom
    // matchers (toBeInTheDocument, toHaveTextContent, etc.) are always available.
    setupFiles: ["./src/test/setup.ts"],

    // Scope discovery to src/ to avoid accidentally picking up e2e or fixture files.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],

    // Exclude Playwright / e2e tests and Next.js build artefacts.
    exclude: ["node_modules", ".next", "e2e/**"],

    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.config.{ts,js}",
        "src/test/**",
        "src/app/layout.tsx", // shell layout — hard to unit-test meaningfully
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },

  resolve: {
    alias: {
      // Mirror tsconfig.json "paths": { "@/*": ["./src/*"] }
      "@": resolve(__dirname, "./src"),
    },
=======
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/__tests__/**/*.test.ts"],
>>>>>>> 5ac5530 (feat(qa): add next.config.ts with CSP/security headers + Vitest setup (ticket 48626cf9))
  },
});
