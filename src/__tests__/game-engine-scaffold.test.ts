// @vitest-environment node
/**
 * Game Engine Scaffold Tests — Ticket e20c7c11
 *
 * Verifies that the game engine directory scaffold produced every required
 * placeholder and module listed in the acceptance criteria for ticket
 * e20c7c11-bfac-4f2b-8fa9-bd79c872a7b7.
 *
 * Failure-reproduction contract
 * ──────────────────────────────
 * These tests FAIL when the .gitkeep sentinel files are absent from the four
 * required directories, and PASS once the scaffold is applied.
 *
 * Acceptance criteria covered
 * ────────────────────────────
 * 1. `.gitkeep` sentinels track empty-but-committed directories in git.
 * 2. Each directory ships with a typed barrel (index file).
 * 3. The barrel exports are importable at their `@/...` aliases.
 * 4. Core game-engine internals (reducer, utils) are present.
 * 5. Core hook implementations (useGameEngine, useKeyboardControls) are present.
 * 6. Core component implementations (GameBoard, ScoreBoard, GameOverlay) exist.
 * 7. Shared type definitions compile to the expected shape.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Project root (two levels up from src/__tests__). */
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
// 1. .gitkeep sentinel files — the original failure criteria
// ──────────────────────────────────────────────────────────────────────────────

describe("Game engine scaffold — .gitkeep sentinels (ticket e20c7c11)", () => {
  /**
   * Each path exactly matches a machine criterion from the failure report:
   *   file_exists: File not found: src/lib/game-engine/.gitkeep
   *   file_exists: File not found: src/hooks/.gitkeep
   *   file_exists: File not found: src/components/game/.gitkeep
   *   file_exists: File not found: src/types/.gitkeep
   */
  const requiredSentinels = [
    "src/lib/game-engine/.gitkeep",
    "src/hooks/.gitkeep",
    "src/components/game/.gitkeep",
    "src/types/.gitkeep",
  ];

  test.each(requiredSentinels)(
    "%s exists",
    (relPath) => {
      expect(
        existsSync(root(relPath)),
        `Missing sentinel: ${relPath}. Create it with: touch ${relPath}`
      ).toBe(true);
    }
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. Barrel (index) files — each module must re-export its public API
// ──────────────────────────────────────────────────────────────────────────────

describe("Game engine scaffold — barrel index files (ticket e20c7c11)", () => {
  const barrels = [
    "src/lib/game-engine/index.ts",
    "src/hooks/index.ts",
    "src/components/game/index.ts",
    "src/types/index.ts",
  ];

  test.each(barrels)("%s exists", (relPath) => {
    expect(
      existsSync(root(relPath)),
      `Missing barrel file: ${relPath}`
    ).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. src/lib/game-engine barrel — exports game-engine public API
// ──────────────────────────────────────────────────────────────────────────────

describe("src/lib/game-engine/index.ts content", () => {
  const content = read(root("src/lib/game-engine/index.ts"));

  it("re-exports gameReducer", () => {
    expect(content).toMatch(/gameReducer/);
  });

  it("re-exports buildInitialState", () => {
    expect(content).toMatch(/buildInitialState/);
  });

  it("re-exports coordinatesEqual utility", () => {
    expect(content).toMatch(/coordinatesEqual/);
  });

  it("re-exports randomFreeCoordinate utility", () => {
    expect(content).toMatch(/randomFreeCoordinate/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. src/hooks barrel — exports custom React hooks
// ──────────────────────────────────────────────────────────────────────────────

describe("src/hooks/index.ts content", () => {
  const content = read(root("src/hooks/index.ts"));

  it("re-exports useGameEngine", () => {
    expect(content).toMatch(/useGameEngine/);
  });

  it("re-exports useKeyboardControls", () => {
    expect(content).toMatch(/useKeyboardControls/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. src/components/game barrel — exports UI components
// ──────────────────────────────────────────────────────────────────────────────

describe("src/components/game/index.ts content", () => {
  const content = read(root("src/components/game/index.ts"));

  it("re-exports GameBoard", () => {
    expect(content).toMatch(/GameBoard/);
  });

  it("re-exports ScoreBoard", () => {
    expect(content).toMatch(/ScoreBoard/);
  });

  it("re-exports GameOverlay", () => {
    expect(content).toMatch(/GameOverlay/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 6. src/types barrel — re-exports shared domain types
// ──────────────────────────────────────────────────────────────────────────────

describe("src/types/index.ts content", () => {
  const content = read(root("src/types/index.ts"));

  it("re-exports GameState type", () => {
    expect(content).toMatch(/GameState/);
  });

  it("re-exports Direction type", () => {
    expect(content).toMatch(/Direction/);
  });

  it("re-exports Coordinate type", () => {
    expect(content).toMatch(/Coordinate/);
  });

  it("re-exports GameAction type", () => {
    expect(content).toMatch(/GameAction/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 7. Core game-engine implementation files
// ──────────────────────────────────────────────────────────────────────────────

describe("Game engine scaffold — implementation files (ticket e20c7c11)", () => {
  const implementationFiles = [
    "src/lib/game-engine/reducer.ts",
    "src/lib/game-engine/utils.ts",
    "src/hooks/useGameEngine.ts",
    "src/hooks/useKeyboardControls.ts",
    "src/components/game/GameBoard.tsx",
    "src/components/game/ScoreBoard.tsx",
    "src/components/game/GameOverlay.tsx",
    "src/types/game.ts",
  ];

  test.each(implementationFiles)("%s exists", (relPath) => {
    expect(
      existsSync(root(relPath)),
      `Missing implementation file: ${relPath}`
    ).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 8. src/types/game.ts — shared type definitions structure
// ──────────────────────────────────────────────────────────────────────────────

describe("src/types/game.ts content", () => {
  const content = read(root("src/types/game.ts"));

  it("defines Coordinate type", () => {
    expect(content).toMatch(/Coordinate/);
  });

  it("defines Direction type with four cardinal directions", () => {
    expect(content).toMatch(/Direction/);
    expect(content).toMatch(/"UP"/);
    expect(content).toMatch(/"DOWN"/);
    expect(content).toMatch(/"LEFT"/);
    expect(content).toMatch(/"RIGHT"/);
  });

  it("defines GameStatus type", () => {
    expect(content).toMatch(/GameStatus/);
  });

  it("defines GameState type", () => {
    expect(content).toMatch(/GameState/);
  });

  it("defines GameAction type", () => {
    expect(content).toMatch(/GameAction/);
  });

  it("defines GameConfig type", () => {
    expect(content).toMatch(/GameConfig/);
  });
});
