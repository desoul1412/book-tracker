// @vitest-environment node
/**
 * Legacy Python cleanup tests — Ticket e0085b66
 *
 * Acceptance criteria
 * ───────────────────
 * The project has been fully migrated to Next.js 15.  The legacy Python
 * artefacts (app.py, requirements.txt) must be absent from the project root.
 *
 * Failure-reproduction contract
 * ──────────────────────────────
 * These tests FAIL on any branch that still contains app.py /
 * requirements.txt and PASS once those files are deleted.
 *
 * Coverage areas
 * ──────────────
 * 1. app.py must NOT exist at the project root.
 * 2. requirements.txt must NOT exist at the project root.
 * 3. package.json exists (Node.js project is active runtime).
 * 4. next.config.ts exists (Next.js 15 is configured).
 * 5. package.json contains no Python-only package indicators.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

/** Resolve a path relative to the project root (two levels up from src/__tests__). */
const root = (...segments: string[]) =>
  resolve(__dirname, "../../", ...segments);

// ──────────────────────────────────────────────────────────────────────────────
// 1 & 2. Legacy Python files must be absent
// ──────────────────────────────────────────────────────────────────────────────

describe("Legacy Python file removal (ticket e0085b66)", () => {
  it("app.py must NOT exist at the project root", () => {
    expect(
      existsSync(root("app.py")),
      "app.py still exists — delete it as part of the Next.js 15 migration"
    ).toBe(false);
  });

  it("requirements.txt must NOT exist at the project root", () => {
    expect(
      existsSync(root("requirements.txt")),
      "requirements.txt still exists — delete it as part of the Next.js 15 migration"
    ).toBe(false);
  });

  it("app.py must NOT exist in the current working directory", () => {
    expect(
      existsSync(resolve(process.cwd(), "app.py")),
      "app.py found in cwd — remove all Python entry-point files"
    ).toBe(false);
  });

  it("requirements.txt must NOT exist in the current working directory", () => {
    expect(
      existsSync(resolve(process.cwd(), "requirements.txt")),
      "requirements.txt found in cwd — remove all Python dependency files"
    ).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3 & 4. Next.js 15 migration integrity
// ──────────────────────────────────────────────────────────────────────────────

describe("Next.js 15 migration integrity (ticket e0085b66)", () => {
  it("package.json exists — confirming Node.js project is the active runtime", () => {
    expect(
      existsSync(root("package.json")),
      "package.json is missing — the Next.js project may not be set up"
    ).toBe(true);
  });

  it("next.config.ts exists — confirming Next.js 15 configuration is present", () => {
    expect(
      existsSync(root("next.config.ts")),
      "next.config.ts is missing — run 'npx create-next-app' or restore the scaffold"
    ).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // 5. package.json must not contain Python-only package indicators
  // ──────────────────────────────────────────────────────────────────────────────

  it("package.json does not list Python-only dependencies", () => {
    const pkgPath = root("package.json");
    if (!existsSync(pkgPath)) return; // guarded — sibling test covers this
    const pkg = JSON.parse(
      readFileSync(pkgPath, "utf-8")
    ) as Record<string, unknown>;
    const allDeps = {
      ...((pkg.dependencies as Record<string, string>) ?? {}),
      ...((pkg.devDependencies as Record<string, string>) ?? {}),
    };
    const pythonIndicators = ["streamlit", "gspread", "oauth2client"];
    for (const indicator of pythonIndicators) {
      expect(
        Object.keys(allDeps),
        `Found Python package '${indicator}' in package.json — remove it`
      ).not.toContain(indicator);
    }
  });
});
