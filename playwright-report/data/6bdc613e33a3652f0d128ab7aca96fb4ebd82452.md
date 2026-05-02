# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cross-browser-rendering.spec.ts >> 2 — score board rendering >> score board has backdrop-blur-sm Tailwind class
- Location: e2e/cross-browser-rendering.spec.ts:195:7

# Error details

```
Error: page.goto: NS_ERROR_CONNECTION_REFUSED
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - heading [level=1] [ref=e5]
  - paragraph
  - paragraph
```

# Test source

```ts
  1   | /**
  2   |  * @file e2e/cross-browser-rendering.spec.ts
  3   |  * @description Cross-browser rendering verification for the Snake game.
  4   |  *
  5   |  * Purpose
  6   |  * ─────────────────────────────────────────────────────────────────────────────
  7   |  * This spec verifies that the Snake game renders and behaves identically (or
  8   |  * within documented acceptable differences) across Chromium, Firefox, and
  9   |  * WebKit (Safari). It is the canonical record of cross-browser QA findings.
  10  |  *
  11  |  * Browsers tested
  12  |  * ─────────────────────────────────────────────────────────────────────────────
  13  |  * • chromium   — Blink renderer, V8 JS engine
  14  |  * • firefox    — Gecko renderer, SpiderMonkey JS engine
  15  |  * • webkit     — WebKit renderer, JavaScriptCore
  16  |  * • mobile-chrome  — Pixel 5 viewport (393 × 851)
  17  |  * • mobile-safari  — iPhone 13 viewport (390 × 844)
  18  |  *
  19  |  * Test areas
  20  |  * ─────────────────────────────────────────────────────────────────────────────
  21  |  * 1. Page structure & dark background
  22  |  * 2. Score board — typography, Tailwind classes, status badge colours
  23  |  * 3. Game board canvas — sizing, aspect-ratio CSS, ResizeObserver, aria role
  24  |  * 4. CSS animations — score-flash (@keyframes), backdrop-blur, aspect-ratio
  25  |  * 5. Game controls — button rendering, disabled state
  26  |  * 6. Keyboard hints — idle-only visibility
  27  |  * 7. Game lifecycle — start / tick / pause / game-over via keyboard input
  28  |  * 8. requestAnimationFrame / food-pulse animation stability
  29  |  * 9. localStorage high-score persistence
  30  |  * 10. Mobile layout — responsive canvas sizing, touch target dimensions
  31  |  * 11. Documented cross-browser rendering differences
  32  |  *
  33  |  * Known cross-browser differences (documented in each test)
  34  |  * ─────────────────────────────────────────────────────────────────────────────
  35  |  * • backdrop-blur: WebKit requires -webkit-backdrop-filter; Chromium/Firefox
  36  |  *   support the un-prefixed property. Tailwind's `backdrop-blur-sm` emits
  37  |  *   both prefixes — visual effect is identical.
  38  |  * • overscroll-behavior: Firefox serialises the shorthand as "none none"
  39  |  *   (x y axes); Chromium/Safari return "none".
  40  |  * • Canvas 2D shadowBlur: intensity differs slightly across engines. Pixel-
  41  |  *   diff tests are intentionally omitted to avoid brittle cross-OS failures.
  42  |  * • ResizeObserver callback timing: Chromium fires synchronously; Firefox/
  43  |  *   WebKit fire asynchronously. All tests use waitForFunction to poll.
  44  |  * • Pause button touch target: actual rendered height is ~21 px on desktop
  45  |  *   (Tailwind py-1). This is below WCAG 2.5.5 (44 px). Documented as a
  46  |  *   WCAG deficiency — see test "Pause button touch target measurement".
  47  |  * • fontVariantNumeric computed style: Chrome/Firefox return "tabular-nums",
  48  |  *   some WebKit builds return "normal" even when the class is applied.
  49  |  *   Assertion uses className check as the authoritative source of truth.
  50  |  */
  51  | 
  52  | import { test, expect, type Page } from "@playwright/test";
  53  | 
  54  | // ---------------------------------------------------------------------------
  55  | // Helpers
  56  | // ---------------------------------------------------------------------------
  57  | 
  58  | /** Navigate to the game root and wait for the score board to be visible. */
  59  | async function gotoGame(page: Page): Promise<void> {
> 60  |   await page.goto("/");
      |              ^ Error: page.goto: NS_ERROR_CONNECTION_REFUSED
  61  |   await page.waitForSelector('[data-testid="game-status"]', {
  62  |     state: "visible",
  63  |     timeout: 10_000,
  64  |   });
  65  | }
  66  | 
  67  | /** Press a keyboard key via page.keyboard. */
  68  | async function pressKey(page: Page, key: string): Promise<void> {
  69  |   await page.keyboard.press(key);
  70  | }
  71  | 
  72  | /** Wait up to `ms` for the game-status badge to show a given label. */
  73  | async function waitForStatus(
  74  |   page: Page,
  75  |   label: string,
  76  |   ms = 5_000
  77  | ): Promise<void> {
  78  |   await expect(page.locator('[data-testid="game-status"]')).toHaveText(label, {
  79  |     timeout: ms,
  80  |   });
  81  | }
  82  | 
  83  | /** Clear localStorage by navigating first, then clearing before reload. */
  84  | async function clearStorageAndReload(page: Page): Promise<void> {
  85  |   await page.goto("/");
  86  |   await page.evaluate(() => localStorage.clear());
  87  |   await page.reload();
  88  |   await page.waitForSelector('[data-testid="game-status"]', {
  89  |     state: "visible",
  90  |     timeout: 10_000,
  91  |   });
  92  | }
  93  | 
  94  | // ---------------------------------------------------------------------------
  95  | // 1. Page structure & dark background
  96  | // ---------------------------------------------------------------------------
  97  | 
  98  | test.describe("1 — page structure and dark background", () => {
  99  |   test("page title is 'Snake'", async ({ page }) => {
  100 |     await gotoGame(page);
  101 |     await expect(page).toHaveTitle(/snake/i);
  102 |   });
  103 | 
  104 |   test("html element has color-scheme: dark", async ({ page }) => {
  105 |     await gotoGame(page);
  106 |     const colorScheme = await page.evaluate(() =>
  107 |       window.getComputedStyle(document.documentElement).colorScheme
  108 |     );
  109 |     // All three engines must honour the CSS `color-scheme: dark` declaration.
  110 |     expect(colorScheme).toBe("dark");
  111 |   });
  112 | 
  113 |   test("body background is gray-950 (#030712)", async ({ page }) => {
  114 |     await gotoGame(page);
  115 |     const bg = await page.evaluate(() =>
  116 |       window.getComputedStyle(document.body).backgroundColor
  117 |     );
  118 |     // Engines serialise colour differently — compare against rgb() equivalent.
  119 |     // #030712 = rgb(3, 7, 18)
  120 |     expect(bg).toBe("rgb(3, 7, 18)");
  121 |   });
  122 | 
  123 |   test("main element contains the game heading", async ({ page }) => {
  124 |     await gotoGame(page);
  125 |     const heading = page.getByRole("heading", { level: 1 });
  126 |     await expect(heading).toBeVisible();
  127 |     await expect(heading).toContainText("Snake");
  128 |   });
  129 | 
  130 |   test(
  131 |     "body has overscroll-behavior: none (prevent pull-to-refresh on mobile)",
  132 |     async ({ page }) => {
  133 |       await gotoGame(page);
  134 |       const overscroll = await page.evaluate(() =>
  135 |         window.getComputedStyle(document.body).overscrollBehavior
  136 |       );
  137 |       // Firefox expands shorthand to "<x> <y>" → "none none".
  138 |       // Chrome/Safari return "none".
  139 |       // Both are acceptable — assert that the value starts with "none".
  140 |       // NOTE: Known difference — Firefox serialises the shorthand differently.
  141 |       expect(overscroll).toMatch(/^none/);
  142 |     }
  143 |   );
  144 | });
  145 | 
  146 | // ---------------------------------------------------------------------------
  147 | // 2. Score board
  148 | // ---------------------------------------------------------------------------
  149 | 
  150 | test.describe("2 — score board rendering", () => {
  151 |   test("score board is visible with role=status", async ({ page }) => {
  152 |     await gotoGame(page);
  153 |     const board = page.getByRole("status", { name: /score board/i });
  154 |     await expect(board).toBeVisible();
  155 |   });
  156 | 
  157 |   test("initial score is 0", async ({ page }) => {
  158 |     await gotoGame(page);
  159 |     await expect(page.locator('[data-testid="current-score"]')).toHaveText("0");
  160 |   });
```