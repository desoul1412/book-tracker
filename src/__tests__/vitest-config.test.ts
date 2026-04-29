// @vitest-environment node
/**
 * Vitest Configuration Tests — Ticket 2b8af47e
 *
 * Verifies that the Vitest setup produced every required artefact for the
 * "Configure Vitest with jsdom environment, React Testing Library, and path
 * aliases matching tsconfig.json paths" ticket.
 *
 * Failure-reproduction contract
 * ──────────────────────────────
 * These tests FAIL on the pre-fix branch (which contains only app.py /
 * requirements.txt and no vitest.config.ts) and PASS once the Vitest
 * configuration is applied.
 *
 * Coverage areas
 * ──────────────
 * 1. vitest.config.ts exists at the project root.
 * 2. package.json exists and declares vitest as a devDependency.
 * 3. vitest.config.ts uses jsdom environment.
 * 4. vitest.config.ts enables globals.
 * 5. vitest.config.ts references @vitejs/plugin-react.
 * 6. vitest.config.ts mirrors the @/* path alias from tsconfig.json.
 * 7. package.json has a "test" script that invokes vitest.
 * 8. A setup file is configured for jest-dom matchers.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Resolve a path relative to the project root. */
const root = (...segments: string[]) =>
  resolve(__dirname, "../../", ...segments);

/** Read a file as UTF-8 text; returns empty string when absent. */
const read = (path: string): string => {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return "";
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// 1. Required files must exist
// ──────────────────────────────────────────────────────────────────────────────

describe("Vitest configuration — required files exist (ticket 2b8af47e)", () => {
  it("vitest.config.ts exists at the project root", () => {
    expect(
      existsSync(root("vitest.config.ts")),
      "vitest.config.ts is missing. Run the Vitest setup task."
    ).toBe(true);
  });

  it("package.json exists at the project root", () => {
    expect(
      existsSync(root("package.json")),
      "package.json is missing."
    ).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. package.json — vitest dependency and test script
// ──────────────────────────────────────────────────────────────────────────────

describe("package.json content (ticket 2b8af47e)", () => {
  const filePath = root("package.json");
  const content = read(filePath);

  it("is valid JSON", () => {
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it("declares vitest as a devDependency", () => {
    const pkg = JSON.parse(content || "{}");
    const devDeps = pkg?.devDependencies ?? {};
    expect(devDeps).toHaveProperty("vitest");
  });

  it("has a 'test' script that invokes vitest", () => {
    const pkg = JSON.parse(content || "{}");
    const testScript: string = pkg?.scripts?.test ?? "";
    expect(testScript).toMatch(/vitest/);
  });

  it("declares @vitejs/plugin-react as a devDependency", () => {
    const pkg = JSON.parse(content || "{}");
    const devDeps = pkg?.devDependencies ?? {};
    expect(devDeps).toHaveProperty("@vitejs/plugin-react");
  });

  it("declares @testing-library/react as a devDependency", () => {
    const pkg = JSON.parse(content || "{}");
    const devDeps = pkg?.devDependencies ?? {};
    expect(devDeps).toHaveProperty("@testing-library/react");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. vitest.config.ts — environment and globals
// ──────────────────────────────────────────────────────────────────────────────

describe("vitest.config.ts content — environment and globals (ticket 2b8af47e)", () => {
  const filePath = root("vitest.config.ts");
  const content = read(filePath);

  it("sets test environment to jsdom", () => {
    expect(content).toMatch(/environment:\s*['"]jsdom['"]/);
  });

  it("enables globals", () => {
    expect(content).toMatch(/globals:\s*true/);
  });

  it("uses defineConfig from vitest/config", () => {
    expect(content).toMatch(/from\s+['"]vitest\/config['"]/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. vitest.config.ts — React plugin
// ──────────────────────────────────────────────────────────────────────────────

describe("vitest.config.ts content — React plugin (ticket 2b8af47e)", () => {
  const filePath = root("vitest.config.ts");
  const content = read(filePath);

  it("imports @vitejs/plugin-react", () => {
    expect(content).toMatch(/@vitejs\/plugin-react/);
  });

  it("includes the React plugin in the plugins array", () => {
    expect(content).toMatch(/plugins:\s*\[/);
    expect(content).toMatch(/react\(\)/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. vitest.config.ts — path alias mirrors tsconfig.json
// ──────────────────────────────────────────────────────────────────────────────

describe("vitest.config.ts content — @/* path alias (ticket 2b8af47e)", () => {
  const filePath = root("vitest.config.ts");
  const content = read(filePath);

  it("defines a resolve.alias section", () => {
    expect(content).toMatch(/resolve:/);
    expect(content).toMatch(/alias:/);
  });

  it("maps '@' to the src directory", () => {
    // Should reference @/ → src (e.g. resolve(__dirname, './src') or similar)
    expect(content).toMatch(/"@":|'@':|["'`]@\/["'`]/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 6. vitest.config.ts — setup files for jest-dom
// ──────────────────────────────────────────────────────────────────────────────

describe("vitest.config.ts content — jest-dom setup (ticket 2b8af47e)", () => {
  const filePath = root("vitest.config.ts");
  const content = read(filePath);

  it("declares a setupFiles entry", () => {
    expect(content).toMatch(/setupFiles:/);
  });

  it("references a setup file (e.g. src/test/setup.ts)", () => {
    expect(content).toMatch(/setup/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 7. vitest.config.ts — coverage configuration
// ──────────────────────────────────────────────────────────────────────────────

describe("vitest.config.ts content — coverage (ticket 2b8af47e)", () => {
  const filePath = root("vitest.config.ts");
  const content = read(filePath);

  it("configures a coverage provider", () => {
    expect(content).toMatch(/coverage:/);
    expect(content).toMatch(/provider:/);
  });

  it("sets coverage thresholds", () => {
    expect(content).toMatch(/thresholds:/);
  });
});
