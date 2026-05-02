# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cross-browser-rendering.spec.ts >> 9 — localStorage high-score persistence >> localStorage persists across page reloads in all browsers
- Location: e2e/cross-browser-rendering.spec.ts:734:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  637 |     const directions = ["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"];
  638 |     let i = 0;
  639 |     const interval = setInterval(async () => {
  640 |       try {
  641 |         await page.keyboard.press(directions[i % 4]);
  642 |         i++;
  643 |       } catch { /* page may navigate */ }
  644 |     }, 180);
  645 | 
  646 |     try {
  647 |       await waitForStatus(page, "Game Over", 30_000);
  648 |     } finally {
  649 |       clearInterval(interval);
  650 |     }
  651 | 
  652 |     await page.locator('[data-testid="btn-play-again"]').click();
  653 |     await waitForStatus(page, "Playing");
  654 |     await expect(
  655 |       page.locator('[data-testid="game-over-overlay"]')
  656 |     ).not.toBeVisible();
  657 |   });
  658 | });
  659 | 
  660 | // ---------------------------------------------------------------------------
  661 | // 8. requestAnimationFrame / food-pulse stability
  662 | // ---------------------------------------------------------------------------
  663 | 
  664 | test.describe("8 — requestAnimationFrame stability", () => {
  665 |   test("no JS errors thrown on initial load", async ({ page }) => {
  666 |     const errors: string[] = [];
  667 |     page.on("pageerror", (err) => errors.push(err.message));
  668 |     await gotoGame(page);
  669 |     // Allow one rAF cycle.
  670 |     await page.waitForTimeout(200);
  671 |     expect(errors).toHaveLength(0);
  672 |   });
  673 | 
  674 |   test("no JS errors after starting and pausing the game", async ({ page }) => {
  675 |     const errors: string[] = [];
  676 |     page.on("pageerror", (err) => errors.push(err.message));
  677 |     await gotoGame(page);
  678 |     await pressKey(page, "Enter");
  679 |     await waitForStatus(page, "Playing");
  680 |     await pressKey(page, "Space");
  681 |     await waitForStatus(page, "Paused");
  682 |     expect(errors).toHaveLength(0);
  683 |   });
  684 | 
  685 |   test(
  686 |     "canvas pixel dimensions remain non-zero after window resize",
  687 |     async ({ page }) => {
  688 |       await gotoGame(page);
  689 |       // Resize viewport — ResizeObserver must re-sync canvas dimensions.
  690 |       await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
  691 |       await page.waitForFunction(
  692 |         () => {
  693 |           const c = document.querySelector(
  694 |             '[data-testid="game-board"] canvas'
  695 |           ) as HTMLCanvasElement | null;
  696 |           return c !== null && c.width > 0 && c.height > 0;
  697 |         },
  698 |         { timeout: 5_000 }
  699 |       );
  700 |       const ok = await page.evaluate(() => {
  701 |         const canvas = document.querySelector(
  702 |           '[data-testid="game-board"] canvas'
  703 |         ) as HTMLCanvasElement | null;
  704 |         return canvas !== null && canvas.width > 0 && canvas.height > 0;
  705 |       });
  706 |       expect(ok).toBe(true);
  707 |     }
  708 |   );
  709 | });
  710 | 
  711 | // ---------------------------------------------------------------------------
  712 | // 9. localStorage — high-score persistence
  713 | // ---------------------------------------------------------------------------
  714 | 
  715 | test.describe("9 — localStorage high-score persistence", () => {
  716 |   test("high score loaded from localStorage on page open", async ({
  717 |     page,
  718 |   }) => {
  719 |     // Navigate first (real origin), seed localStorage, then reload.
  720 |     await page.goto("/");
  721 |     await page.evaluate(() =>
  722 |       localStorage.setItem("snake_high_score", "150")
  723 |     );
  724 |     await page.reload();
  725 |     await page.waitForSelector('[data-testid="high-score"]', {
  726 |       state: "visible",
  727 |     });
  728 |     // All three browsers support localStorage — expect the value to load.
  729 |     await expect(
  730 |       page.locator('[data-testid="high-score"]')
  731 |     ).toHaveText("150");
  732 |   });
  733 | 
  734 |   test("localStorage persists across page reloads in all browsers", async ({
  735 |     page,
  736 |   }) => {
> 737 |     await page.goto("/");
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  738 |     await page.evaluate(() =>
  739 |       localStorage.setItem("snake_high_score", "999")
  740 |     );
  741 |     await page.reload();
  742 |     await page.waitForSelector('[data-testid="high-score"]');
  743 |     await expect(
  744 |       page.locator('[data-testid="high-score"]')
  745 |     ).toHaveText("999");
  746 |   });
  747 | });
  748 | 
  749 | // ---------------------------------------------------------------------------
  750 | // 10. Mobile layout & responsive canvas
  751 | // ---------------------------------------------------------------------------
  752 | 
  753 | test.describe("10 — mobile layout and responsive canvas", () => {
  754 |   test("game board fills available width on narrow viewport (375 px)", async ({
  755 |     page,
  756 |   }) => {
  757 |     await page.setViewportSize({ width: 375, height: 812 });
  758 |     await gotoGame(page);
  759 |     const boardBox = await page
  760 |       .locator('[data-testid="game-board"]')
  761 |       .boundingBox();
  762 |     expect(boardBox).not.toBeNull();
  763 |     // On narrow viewport the board should fill most of the viewport width
  764 |     // (minus padding — max-w-[600px] clamps, but 375 is under 600).
  765 |     expect(boardBox!.width).toBeGreaterThan(300);
  766 |   });
  767 | 
  768 |   test(
  769 |     "heading remains visible without horizontal scroll on 375 px viewport",
  770 |     async ({ page }) => {
  771 |       await page.setViewportSize({ width: 375, height: 812 });
  772 |       await gotoGame(page);
  773 |       const heading = page.getByRole("heading", { level: 1 });
  774 |       await expect(heading).toBeVisible();
  775 |       // Verify no horizontal overflow.
  776 |       const scrollWidth = await page.evaluate(
  777 |         () => document.body.scrollWidth
  778 |       );
  779 |       const clientWidth = await page.evaluate(
  780 |         () => document.body.clientWidth
  781 |       );
  782 |       expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2 px rounding
  783 |     }
  784 |   );
  785 | 
  786 |   test(
  787 |     "game controls are visible on mobile viewport without overflow",
  788 |     async ({ page }) => {
  789 |       await page.setViewportSize({ width: 375, height: 812 });
  790 |       await gotoGame(page);
  791 |       await expect(page.locator('[data-testid="btn-start"]')).toBeVisible();
  792 |       await expect(page.locator('[data-testid="btn-reset"]')).toBeVisible();
  793 |     }
  794 |   );
  795 | });
  796 | 
  797 | // ---------------------------------------------------------------------------
  798 | // 11. Cross-browser rendering difference documentation
  799 | //     (informational — tests assert documented baseline behaviour)
  800 | // ---------------------------------------------------------------------------
  801 | 
  802 | test.describe("11 — documented cross-browser rendering differences", () => {
  803 |   /**
  804 |    * FINDING: overscroll-behavior shorthand serialisation
  805 |    *
  806 |    * Browser   | Computed value
  807 |    * ──────────┼────────────────
  808 |    * Chrome    | "none"
  809 |    * Firefox   | "none none"   (expands x/y axes separately)
  810 |    * Safari    | "none"
  811 |    *
  812 |    * Impact: None — both values prevent pull-to-refresh.
  813 |    * Mitigation: Regex match /^none/ absorbs both serialisations.
  814 |    */
  815 |   test(
  816 |     "overscroll-behavior serialisation varies by engine but effect is consistent",
  817 |     async ({ page, browserName }) => {
  818 |       await gotoGame(page);
  819 |       const val = await page.evaluate(() =>
  820 |         window.getComputedStyle(document.body).overscrollBehavior
  821 |       );
  822 |       if (browserName === "firefox") {
  823 |         // Firefox expands shorthand → "none none"
  824 |         expect(val).toMatch(/^none(\s+none)?$/);
  825 |       } else {
  826 |         // Chromium and WebKit → "none"
  827 |         expect(val).toBe("none");
  828 |       }
  829 |     }
  830 |   );
  831 | 
  832 |   /**
  833 |    * FINDING: Canvas shadowBlur rendering intensity
  834 |    *
  835 |    * Browser        | shadowBlur behaviour
  836 |    * ───────────────┼──────────────────────────────────────────────────────
  837 |    * Chrome (Blink) | Renders at face value; hardware-accelerated.
```