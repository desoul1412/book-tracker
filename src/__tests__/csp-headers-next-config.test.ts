// @vitest-environment node
/**
 * CSP Headers in next.config.ts — Ticket 48626cf9
 *
 * Acceptance criteria
 * ───────────────────
 * The project must contain a `next.config.ts` at the project root that:
 *   1. Exists as a file.
 *   2. Exports a valid NextConfig default export.
 *   3. Defines a Content-Security-Policy (CSP) header.
 *   4. Restricts `script-src` to `'self'` (no `unsafe-inline` / `unsafe-eval`).
 *   5. Applies the headers only in production (development is excluded so that
 *      Next.js Fast Refresh continues to work without errors).
 *   6. Includes defensive security headers: X-Content-Type-Options, X-Frame-Options,
 *      Referrer-Policy, and Permissions-Policy.
 *
 * Failure-reproduction contract
 * ──────────────────────────────
 * These tests FAIL on any branch where `next.config.ts` is absent or where
 * the CSP / security-header implementation is missing, and PASS once the
 * DevOps ticket (48626cf9) implementation is applied.
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

/**
 * Extract the lines from `content` that contain `keyword` and return them
 * as a single string. This lets us assert about a specific directive without
 * false-matching adjacent directives.
 */
const linesContaining = (content: string, keyword: string): string =>
  content
    .split("\n")
    .filter((line) => line.includes(keyword))
    .join("\n");

// ──────────────────────────────────────────────────────────────────────────────
// 1. next.config.ts must exist at the project root
// ──────────────────────────────────────────────────────────────────────────────

describe("next.config.ts — file existence (ticket 48626cf9)", () => {
  it("next.config.ts exists at the project root", () => {
    expect(
      existsSync(root("next.config.ts")),
      "Missing next.config.ts — the CSP-headers ticket requires this file to be present at the project root."
    ).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. next.config.ts — TypeScript module structure
// ──────────────────────────────────────────────────────────────────────────────

describe("next.config.ts — module structure (ticket 48626cf9)", () => {
  const content = read(root("next.config.ts"));

  it("imports NextConfig type from 'next'", () => {
    expect(content).toMatch(/from\s+['"]next['"]/);
  });

  it("exports a NextConfig default export", () => {
    expect(content).toMatch(/export\s+default\s+\w+/);
  });

  it("the exported config is typed as NextConfig", () => {
    expect(content).toMatch(/NextConfig/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. Content-Security-Policy header
// ──────────────────────────────────────────────────────────────────────────────

describe("next.config.ts — Content-Security-Policy header (ticket 48626cf9)", () => {
  const content = read(root("next.config.ts"));

  it("defines a Content-Security-Policy header", () => {
    expect(content).toMatch(/Content-Security-Policy/);
  });

  it("sets script-src to 'self' only", () => {
    expect(content).toMatch(/script-src\s+'self'/);
  });

  it("does NOT allow script-src 'unsafe-inline'", () => {
    // Inspect only the lines that mention "script-src" to avoid false
    // matches from other directives (e.g. style-src which legitimately
    // allows unsafe-inline for CSS-in-JS / Tailwind).
    const scriptSrcLines = linesContaining(content, "script-src");
    expect(scriptSrcLines).not.toMatch(/'unsafe-inline'/);
  });

  it("does NOT allow script-src 'unsafe-eval'", () => {
    const scriptSrcLines = linesContaining(content, "script-src");
    expect(scriptSrcLines).not.toMatch(/'unsafe-eval'/);
  });

  it("sets default-src to 'self'", () => {
    expect(content).toMatch(/default-src\s+'self'/);
  });

  it("disables frame-ancestors (clickjacking protection)", () => {
    expect(content).toMatch(/frame-ancestors\s+'none'/);
  });

  it("disables object-src (Flash / plugin protection)", () => {
    expect(content).toMatch(/object-src\s+'none'/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. Additional defensive security headers
// ──────────────────────────────────────────────────────────────────────────────

describe("next.config.ts — additional security headers (ticket 48626cf9)", () => {
  const content = read(root("next.config.ts"));

  it("includes X-Content-Type-Options: nosniff", () => {
    expect(content).toMatch(/X-Content-Type-Options/);
    expect(content).toMatch(/nosniff/);
  });

  it("includes X-Frame-Options: DENY", () => {
    expect(content).toMatch(/X-Frame-Options/);
    expect(content).toMatch(/DENY/);
  });

  it("includes Referrer-Policy", () => {
    expect(content).toMatch(/Referrer-Policy/);
  });

  it("includes Permissions-Policy disabling camera, microphone, geolocation", () => {
    expect(content).toMatch(/Permissions-Policy/);
    expect(content).toMatch(/camera/);
    expect(content).toMatch(/microphone/);
    expect(content).toMatch(/geolocation/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. Production-only header application
// ──────────────────────────────────────────────────────────────────────────────

describe("next.config.ts — production-only header gate (ticket 48626cf9)", () => {
  const content = read(root("next.config.ts"));

  it("checks NODE_ENV before applying headers", () => {
    expect(content).toMatch(/NODE_ENV/);
  });

  it("applies headers via the async headers() function", () => {
    expect(content).toMatch(/async\s+headers\s*\(\s*\)/);
  });

  it("applies headers to all routes using a catch-all source pattern", () => {
    expect(content).toMatch(/source:\s*["'`]\/\(.*\)["'`]/);
  });
});
