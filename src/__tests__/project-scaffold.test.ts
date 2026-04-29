// @vitest-environment node
/**
 * Project Scaffold Tests — Ticket b0629528
 *
 * Verifies that the Next.js 15 project initialisation produced every required
 * file listed in the acceptance criteria for ticket b0629528-4b35-4e13-839c-1c58e9db1e19.
 *
 * Failure-reproduction contract
 * ──────────────────────────────
 * These tests FAIL on the pre-fix branch (which contains only app.py /
 * requirements.txt) and PASS once the Next.js 15 scaffold is applied.
 *
 * Coverage areas
 * ──────────────
 * 1. Required config files exist at the project root.
 * 2. App-router entry files (layout.tsx, page.tsx) exist under src/app/.
 * 3. Key files export valid TypeScript (duck-typed via file content).
 * 4. The root layout carries essential HTML boilerplate & metadata.
 * 5. The home page renders a Snake-game landing component.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Resolve a path relative to the project root (two levels up from src/__tests__). */
const root = (...segments: string[]) =>
  resolve(__dirname, "../../", ...segments);

/** Read a file as UTF-8 text; returns empty string when the file is absent. */
const read = (path: string): string => {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return "";
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// 1. Required config files must exist at the project root
// ──────────────────────────────────────────────────────────────────────────────

describe("Next.js 15 scaffold — required config files (ticket b0629528)", () => {
  const requiredRootFiles = [
    "next.config.ts",
    "tsconfig.json",
    "tailwind.config.ts",
  ];

  test.each(requiredRootFiles)(
    "%s exists at the project root",
    (filename) => {
      expect(
        existsSync(root(filename)),
        `Missing required file: ${filename}. Run 'npx create-next-app' or restore the scaffold.`
      ).toBe(true);
    }
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. App-router entry files must exist under src/app/
// ──────────────────────────────────────────────────────────────────────────────

describe("Next.js 15 scaffold — App Router entry files (ticket b0629528)", () => {
  const requiredAppFiles = ["src/app/layout.tsx", "src/app/page.tsx"];

  test.each(requiredAppFiles)(
    "%s exists",
    (relPath) => {
      expect(
        existsSync(root(relPath)),
        `Missing required file: ${relPath}.`
      ).toBe(true);
    }
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. next.config.ts — content validity
// ──────────────────────────────────────────────────────────────────────────────

describe("next.config.ts content", () => {
  const filePath = root("next.config.ts");
  const content = read(filePath);

  it("exports a NextConfig default export", () => {
    expect(content).toMatch(/export\s+default\s+\w+/);
  });

  it("imports NextConfig type from 'next'", () => {
    expect(content).toMatch(/from\s+['"]next['"]/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. tsconfig.json — TypeScript configuration
// ──────────────────────────────────────────────────────────────────────────────

describe("tsconfig.json content", () => {
  const filePath = root("tsconfig.json");
  const content = read(filePath);

  it("is valid JSON", () => {
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it("targets a modern ECMAScript version", () => {
    const tsconfig = JSON.parse(content || "{}");
    const target: string = tsconfig?.compilerOptions?.target ?? "";
    // Next.js 15 default targets ES2017 or later
    expect(target).toMatch(/^ES(201[7-9]|202\d|Next|es201[7-9]|es202\d|esnext)$/i);
  });

  it("enables strict mode", () => {
    const tsconfig = JSON.parse(content || "{}");
    expect(tsconfig?.compilerOptions?.strict).toBe(true);
  });

  it("includes path alias @/* → ./src/*", () => {
    const tsconfig = JSON.parse(content || "{}");
    const paths = tsconfig?.compilerOptions?.paths ?? {};
    expect(paths).toHaveProperty("@/*");
    expect(paths["@/*"]).toContain("./src/*");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. tailwind.config.ts — Tailwind CSS configuration
// ──────────────────────────────────────────────────────────────────────────────

describe("tailwind.config.ts content", () => {
  const filePath = root("tailwind.config.ts");
  const content = read(filePath);

  it("exports a default Tailwind config", () => {
    expect(content).toMatch(/export\s+default\s+\w+/);
  });

  it("includes src/app in the content paths", () => {
    expect(content).toMatch(/src\/app/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 6. src/app/layout.tsx — Root layout
// ──────────────────────────────────────────────────────────────────────────────

describe("src/app/layout.tsx content", () => {
  const filePath = root("src/app/layout.tsx");
  const content = read(filePath);

  it("exports a default RootLayout component", () => {
    expect(content).toMatch(/export\s+default\s+function/);
  });

  it("renders an <html> element with a lang attribute", () => {
    expect(content).toMatch(/<html\s[^>]*lang=/);
  });

  it("renders a <body> element", () => {
    expect(content).toMatch(/<body/);
  });

  it("exports a Metadata object (title + description)", () => {
    expect(content).toMatch(/Metadata/);
    expect(content).toMatch(/title:/);
    expect(content).toMatch(/description:/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 7. src/app/page.tsx — Home page
// ──────────────────────────────────────────────────────────────────────────────

describe("src/app/page.tsx content", () => {
  const filePath = root("src/app/page.tsx");
  const content = read(filePath);

  it("exports a default Home component", () => {
    expect(content).toMatch(/export\s+default\s+function/);
  });

  it("renders meaningful content (not an empty shell)", () => {
    // At minimum a <main>, <div>, or <h1> should be present.
    expect(content).toMatch(/<(main|div|h1|section)/);
  });
});
