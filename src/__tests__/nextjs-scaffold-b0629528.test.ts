// @vitest-environment node
/**
 * Next.js 15 Scaffold Tests — Ticket b0629528
 *
 * Reproduces the machine-criteria failures reported in QA review:
 *   - file_exists: next.config.ts
 *   - file_exists: tsconfig.json
 *   - file_exists: tailwind.config.ts
 *   - file_exists: src/app/layout.tsx
 *   - file_exists: src/app/page.tsx
 *
 * These tests FAIL on the pre-fix branch (Python-only) and PASS once
 * the Next.js 15 scaffold is applied.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

/** Resolve relative to project root (two levels up from src/__tests__). */
const root = (...segments: string[]) =>
  resolve(__dirname, "../../", ...segments);

/** Read file as UTF-8; returns "" when absent (so content tests don't throw). */
const read = (relPath: string): string => {
  try {
    return readFileSync(root(relPath), "utf-8");
  } catch {
    return "";
  }
};

// ─────────────────────────────────────────────────────────
// 1. Required files must exist
// ─────────────────────────────────────────────────────────

describe("ticket b0629528 — required files exist", () => {
  const files = [
    "next.config.ts",
    "tsconfig.json",
    "tailwind.config.ts",
    "src/app/layout.tsx",
    "src/app/page.tsx",
  ];

  test.each(files)("%s is present", (file) => {
    expect(
      existsSync(root(file)),
      `File not found: ${file}. The Next.js 15 scaffold must be applied.`
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────
// 2. next.config.ts — valid TypeScript module
// ─────────────────────────────────────────────────────────

describe("next.config.ts", () => {
  const content = read("next.config.ts");

  it("imports from 'next'", () => {
    expect(content).toMatch(/from\s+['"]next['"]/);
  });

  it("has a default export", () => {
    expect(content).toMatch(/export\s+default\s+\w+/);
  });
});

// ─────────────────────────────────────────────────────────
// 3. tsconfig.json — TypeScript configuration
// ─────────────────────────────────────────────────────────

describe("tsconfig.json", () => {
  const raw = read("tsconfig.json");

  it("is valid JSON", () => {
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it("enables strict mode", () => {
    const cfg = JSON.parse(raw || "{}");
    expect(cfg?.compilerOptions?.strict).toBe(true);
  });

  it("targets ES2017 or later", () => {
    const cfg = JSON.parse(raw || "{}");
    expect(cfg?.compilerOptions?.target).toMatch(
      /^(ES201[7-9]|ES202\d|ESNext)$/i
    );
  });

  it("includes @/* path alias pointing to ./src/*", () => {
    const cfg = JSON.parse(raw || "{}");
    const paths: Record<string, string[]> = cfg?.compilerOptions?.paths ?? {};
    expect(paths["@/*"]).toContain("./src/*");
  });
});

// ─────────────────────────────────────────────────────────
// 4. tailwind.config.ts — Tailwind CSS configuration
// ─────────────────────────────────────────────────────────

describe("tailwind.config.ts", () => {
  const content = read("tailwind.config.ts");

  it("has a default export", () => {
    expect(content).toMatch(/export\s+default\s+\w+/);
  });

  it("includes src/app in content glob", () => {
    expect(content).toMatch(/src\/app/);
  });
});

// ─────────────────────────────────────────────────────────
// 5. src/app/layout.tsx — Root layout
// ─────────────────────────────────────────────────────────

describe("src/app/layout.tsx", () => {
  const content = read("src/app/layout.tsx");

  it("exports a default function component", () => {
    expect(content).toMatch(/export\s+default\s+function/);
  });

  it("renders <html> with a lang attribute", () => {
    expect(content).toMatch(/<html\s[^>]*lang=/);
  });

  it("renders a <body> element", () => {
    expect(content).toMatch(/<body/);
  });

  it("exports Metadata with title and description", () => {
    expect(content).toMatch(/Metadata/);
    expect(content).toMatch(/title:/);
    expect(content).toMatch(/description:/);
  });
});

// ─────────────────────────────────────────────────────────
// 6. src/app/page.tsx — Home page
// ─────────────────────────────────────────────────────────

describe("src/app/page.tsx", () => {
  const content = read("src/app/page.tsx");

  it("exports a default function component", () => {
    expect(content).toMatch(/export\s+default\s+function/);
  });

  it("renders a meaningful HTML element", () => {
    expect(content).toMatch(/<(main|div|h1|section)/);
  });
});
