// @vitest-environment node
/**
 * GitHub Actions CI workflow tests — Ticket e2c0c918
 *
 * Acceptance criteria
 * ───────────────────
 * A GitHub Actions CI pipeline has been added that automatically runs lint,
 * type-checking, tests, and build on every push and pull request.
 *
 * Failure-reproduction contract
 * ──────────────────────────────
 * These tests FAIL when .github/workflows/ci.yml is absent or incomplete,
 * and PASS once the CI workflow is correctly configured.
 *
 * Coverage areas
 * ──────────────
 * 1. The workflow file exists at .github/workflows/ci.yml.
 * 2. The workflow triggers on push (all branches) and pull_request (main).
 * 3. The job runs on ubuntu-latest.
 * 4. Required CI steps are present: checkout, setup-node, install, lint,
 *    typecheck, test, build.
 * 5. Node.js version is pinned to 20 (LTS).
 * 6. Dependencies are installed with `npm ci` (reproducible installs).
 * 7. npm caching is enabled to speed up runs.
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

const CI_WORKFLOW_PATH = root(".github/workflows/ci.yml");

// ──────────────────────────────────────────────────────────────────────────────
// 1. File existence
// ──────────────────────────────────────────────────────────────────────────────

describe("GitHub Actions CI — file existence (ticket e2c0c918)", () => {
  it(".github/workflows/ci.yml exists", () => {
    expect(
      existsSync(CI_WORKFLOW_PATH),
      "Missing .github/workflows/ci.yml — create the GitHub Actions CI workflow"
    ).toBe(true);
  });

  it(".github/workflows/ directory exists", () => {
    expect(
      existsSync(root(".github/workflows")),
      "Missing .github/workflows/ directory"
    ).toBe(true);
  });

  it(".github/ directory exists", () => {
    expect(
      existsSync(root(".github")),
      "Missing .github/ directory"
    ).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. Workflow triggers
// ──────────────────────────────────────────────────────────────────────────────

describe("GitHub Actions CI — triggers (ticket e2c0c918)", () => {
  const content = read(CI_WORKFLOW_PATH);

  it("workflow triggers on push events", () => {
    expect(content).toMatch(/\bpush\b/);
  });

  it("workflow triggers on pull_request events", () => {
    expect(content).toMatch(/\bpull_request\b/);
  });

  it("pull_request trigger targets the main branch", () => {
    expect(content).toMatch(/\bmain\b/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. Runner configuration
// ──────────────────────────────────────────────────────────────────────────────

describe("GitHub Actions CI — runner (ticket e2c0c918)", () => {
  const content = read(CI_WORKFLOW_PATH);

  it("job runs on ubuntu-latest", () => {
    expect(content).toMatch(/ubuntu-latest/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. Required CI steps
// ──────────────────────────────────────────────────────────────────────────────

describe("GitHub Actions CI — required steps (ticket e2c0c918)", () => {
  const content = read(CI_WORKFLOW_PATH);

  it("includes actions/checkout step", () => {
    expect(content).toMatch(/actions\/checkout/);
  });

  it("includes actions/setup-node step", () => {
    expect(content).toMatch(/actions\/setup-node/);
  });

  it("includes a dependency installation step", () => {
    // Either npm ci (preferred) or npm install
    expect(content).toMatch(/npm ci|npm install/);
  });

  it("includes a lint step", () => {
    expect(content).toMatch(/lint/i);
  });

  it("includes a type-check step", () => {
    // typecheck, type-check, tsc, or similar
    expect(content).toMatch(/typecheck|type.check|tsc/i);
  });

  it("includes a test step", () => {
    expect(content).toMatch(/vitest|npm.*test|npx.*vitest/i);
  });

  it("includes a build step", () => {
    expect(content).toMatch(/build/i);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. Node.js version pinning
// ──────────────────────────────────────────────────────────────────────────────

describe("GitHub Actions CI — Node.js version (ticket e2c0c918)", () => {
  const content = read(CI_WORKFLOW_PATH);

  it("pins Node.js to version 20 (LTS)", () => {
    expect(content).toMatch(/node-version.*['":].*20|20.*node-version/i);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 6. Reproducible installs
// ──────────────────────────────────────────────────────────────────────────────

describe("GitHub Actions CI — reproducible installs (ticket e2c0c918)", () => {
  const content = read(CI_WORKFLOW_PATH);

  it("uses `npm ci` for clean, reproducible dependency installs", () => {
    expect(
      content,
      "Use `npm ci` instead of `npm install` for reproducible CI builds"
    ).toMatch(/\bnpm ci\b/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 7. npm caching
// ──────────────────────────────────────────────────────────────────────────────

describe("GitHub Actions CI — caching (ticket e2c0c918)", () => {
  const content = read(CI_WORKFLOW_PATH);

  it("enables npm dependency caching to speed up CI runs", () => {
    expect(content).toMatch(/cache.*npm|npm.*cache/i);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 8. Workflow structure validity
// ──────────────────────────────────────────────────────────────────────────────

describe("GitHub Actions CI — structural validity (ticket e2c0c918)", () => {
  const content = read(CI_WORKFLOW_PATH);

  it("workflow has a name field", () => {
    expect(content).toMatch(/^name:/m);
  });

  it("workflow defines at least one job", () => {
    expect(content).toMatch(/^jobs:/m);
  });

  it("workflow has steps defined", () => {
    expect(content).toMatch(/steps:/);
  });

  it("workflow file is non-empty", () => {
    expect(content.length).toBeGreaterThan(0);
  });
});
