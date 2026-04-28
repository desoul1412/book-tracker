/**
 * Smoke test — verifies the Vitest + jsdom + jest-dom + path-alias stack works.
 *
 * This is NOT a meaningful unit test of application logic; its sole purpose
 * is to be a canary that fails loudly if the test infrastructure is broken.
 * Delete or move it once real tests exist.
 */

describe("Vitest infrastructure smoke test", () => {
  it("runs in a jsdom environment", () => {
    expect(typeof window).toBe("object");
    expect(typeof document).toBe("object");
  });

  it("has jest-dom matchers available", () => {
    const el = document.createElement("p");
    el.textContent = "hello";
    document.body.appendChild(el);

    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent("hello");

    el.remove();
  });

  it("resolves @/* path alias correctly", async () => {
    // Dynamically import something from src/ via the @/ alias.
    // Imports src/constants/game.ts — update path if the file moves.
    const mod = await import("@/constants/game");
    expect(mod).toBeDefined();
    // Spot-check a known export to confirm the module loaded correctly.
    expect(typeof mod.GRID_SIZE).toBe("number");
  });
});
