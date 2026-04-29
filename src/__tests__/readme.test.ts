// @vitest-environment node
/**
 * README.md Tests — Ticket 0aca89fc
 *
 * Acceptance criteria
 * ───────────────────
 * A project README.md must exist at the repository root and contain:
 *   1. Architecture documentation referencing the three-layer separation
 *      (Engine → Hook → UI).
 *   2. Setup / getting-started instructions (npm install, etc.).
 *   3. Development commands section.
 *
 * Failure-reproduction contract
 * ──────────────────────────────
 * These tests FAIL on a branch that has no README.md (only app.py /
 * requirements.txt) and PASS once README.md is present with the required
 * content.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

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

const readmePath = root("README.md");
const readmeContent = read(readmePath);

// ──────────────────────────────────────────────────────────────────────────────
// 1. File existence
// ──────────────────────────────────────────────────────────────────────────────

describe("README.md existence (ticket 0aca89fc)", () => {
  it("README.md must exist at the project root", () => {
    expect(
      existsSync(readmePath),
      "README.md not found — create it at the repository root with setup instructions and architecture overview"
    ).toBe(true);
  });

  it("README.md must not be empty", () => {
    expect(readmeContent.trim().length).toBeGreaterThan(100);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. Architecture documentation
// ──────────────────────────────────────────────────────────────────────────────

describe("README.md — architecture overview (ticket 0aca89fc)", () => {
  it("mentions the three-layer architecture", () => {
    expect(readmeContent).toMatch(/layer|three.layer|3.layer/i);
  });

  it("references the Engine layer", () => {
    expect(readmeContent).toMatch(/engine/i);
  });

  it("references the Hook layer", () => {
    expect(readmeContent).toMatch(/hook/i);
  });

  it("references the UI layer", () => {
    expect(readmeContent).toMatch(/ui|component/i);
  });

  it("describes the Engine → Hook → UI data flow", () => {
    // The README should document the one-way data flow direction
    const hasFlow =
      /engine.{0,30}hook/i.test(readmeContent) ||
      /hook.{0,30}ui/i.test(readmeContent) ||
      /engine.{0,60}ui/i.test(readmeContent);
    expect(hasFlow).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. Setup instructions
// ──────────────────────────────────────────────────────────────────────────────

describe("README.md — setup instructions (ticket 0aca89fc)", () => {
  it("includes installation instructions", () => {
    expect(readmeContent).toMatch(/install|npm install|yarn install|pnpm install/i);
  });

  it("includes getting started or prerequisites section", () => {
    expect(readmeContent).toMatch(/getting.started|prerequisites|setup/i);
  });

  it("mentions Node.js or npm as a runtime dependency", () => {
    expect(readmeContent).toMatch(/node\.?js|npm|yarn|pnpm/i);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. Development commands
// ──────────────────────────────────────────────────────────────────────────────

describe("README.md — development commands (ticket 0aca89fc)", () => {
  it("documents a dev server command", () => {
    expect(readmeContent).toMatch(/npm run dev|yarn dev|pnpm dev|next dev/i);
  });

  it("documents a build command", () => {
    expect(readmeContent).toMatch(/npm run build|yarn build|pnpm build|next build/i);
  });

  it("documents a test command", () => {
    expect(readmeContent).toMatch(/npm.*test|yarn.*test|pnpm.*test|vitest/i);
  });

  it("has a dedicated section for commands or scripts", () => {
    expect(readmeContent).toMatch(/##.*(command|script|develop)/i);
  });
});
