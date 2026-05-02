# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cross-browser-rendering.spec.ts >> 1 — page structure and dark background >> html element has color-scheme: dark
- Location: e2e/cross-browser-rendering.spec.ts:104:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="game-status"]') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "VNSIR — Home" [ref=e4] [cursor=pointer]:
        - /url: /
        - generic [ref=e6]: VN-SIR.
      - navigation [ref=e7]:
        - link "Intelligence Hub" [ref=e8] [cursor=pointer]:
          - /url: /
        - link "Custom Advisory" [ref=e9] [cursor=pointer]:
          - /url: /advisory
        - generic [ref=e10]: The Analyst Brief
        - link "About Us" [ref=e11] [cursor=pointer]:
          - /url: /about
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: EN
          - generic [ref=e15]: /
          - button "Vietnamese — coming soon" [disabled] [ref=e16]: VN
        - link "Login" [ref=e17] [cursor=pointer]:
          - /url: /login
  - main [ref=e18]:
    - generic [ref=e19]:
      - paragraph [ref=e20]: The Vietnam Strategic Insight Research
      - heading "Decoding Vietnam's Shadow Market." [level=1] [ref=e21]
      - paragraph [ref=e22]:
        - text: Executive wisdom and surgical insights.
        - strong [ref=e23]: No raw data.
    - generic [ref=e25]:
      - heading "Market Intelligence Reports" [level=2] [ref=e26]
      - generic [ref=e27]:
        - button "All" [ref=e28]
        - button "E-Commerce" [ref=e29]
        - button "Gaming" [ref=e30]
        - button "Entertainment" [ref=e31]
        - button "Macro Economy" [ref=e32]
      - generic [ref=e33]:
        - 'link "Gaming Apr 09, 2026 Vietnam Mobile Gaming 2026: The Next ARPU Frontier Mid-core transition and LTV optimization across the top 5 publishers — direct payment gateways lift net ARPU by 22%. $2,500 View Insight" [ref=e34] [cursor=pointer]':
          - /url: /login?redirect=/reports/vietnam-mobile-gaming-2026
          - generic [ref=e35]:
            - generic [ref=e40]:
              - paragraph [ref=e41]: Gaming
              - paragraph [ref=e42]: Apr 09, 2026
            - 'heading "Vietnam Mobile Gaming 2026: The Next ARPU Frontier" [level=3] [ref=e43]'
            - paragraph [ref=e44]: Mid-core transition and LTV optimization across the top 5 publishers — direct payment gateways lift net ARPU by 22%.
          - generic [ref=e45]:
            - generic [ref=e46]: $2,500
            - generic [ref=e47]:
              - text: View Insight
              - img [ref=e48]
        - 'link "E-Commerce Apr 05, 2026 Shadow Logistics: The Unseen Last-Mile Network Informal supply chains carry 40% of inter-province delivery. Decentralized hubs cut last-mile cost 22%. $1,800 View Insight" [ref=e50] [cursor=pointer]':
          - /url: /login?redirect=/reports/shadow-logistics-vietnam
          - generic [ref=e51]:
            - generic [ref=e56]:
              - paragraph [ref=e57]: E-Commerce
              - paragraph [ref=e58]: Apr 05, 2026
            - 'heading "Shadow Logistics: The Unseen Last-Mile Network" [level=3] [ref=e59]'
            - paragraph [ref=e60]: Informal supply chains carry 40% of inter-province delivery. Decentralized hubs cut last-mile cost 22%.
          - generic [ref=e61]:
            - generic [ref=e62]: $1,800
            - generic [ref=e63]:
              - text: View Insight
              - img [ref=e64]
        - 'link "Macro Economy Mar 28, 2026 Vietnam FDI 2026: The Tier-2 City Capital Pivot Foreign capital is rerouting from HCMC to Bình Dương / Đà Nẵng. Compounding land yields up 14%. $3,200 View Insight" [ref=e66] [cursor=pointer]':
          - /url: /login?redirect=/reports/vietnam-fdi-tier-2-pivot-2026
          - generic [ref=e67]:
            - generic [ref=e72]:
              - paragraph [ref=e73]: Macro Economy
              - paragraph [ref=e74]: Mar 28, 2026
            - 'heading "Vietnam FDI 2026: The Tier-2 City Capital Pivot" [level=3] [ref=e75]'
            - paragraph [ref=e76]: Foreign capital is rerouting from HCMC to Bình Dương / Đà Nẵng. Compounding land yields up 14%.
          - generic [ref=e77]:
            - generic [ref=e78]: $3,200
            - generic [ref=e79]:
              - text: View Insight
              - img [ref=e80]
        - 'link "Entertainment Mar 22, 2026 The Streaming Wars: Vietnam''s $1.5B OTT Showdown Local SVOD wins churn against Netflix; bundling with telcos wins the ARPU war. $2,100 View Insight" [ref=e82] [cursor=pointer]':
          - /url: /login?redirect=/reports/vietnam-ott-streaming-wars
          - generic [ref=e83]:
            - generic [ref=e88]:
              - paragraph [ref=e89]: Entertainment
              - paragraph [ref=e90]: Mar 22, 2026
            - 'heading "The Streaming Wars: Vietnam''s $1.5B OTT Showdown" [level=3] [ref=e91]'
            - paragraph [ref=e92]: Local SVOD wins churn against Netflix; bundling with telcos wins the ARPU war.
          - generic [ref=e93]:
            - generic [ref=e94]: $2,100
            - generic [ref=e95]:
              - text: View Insight
              - img [ref=e96]
        - 'link "E-Commerce Mar 14, 2026 Shadow Payment Rails: How Top Sellers Bypass Fees Direct-billing rails lift net margin 11pp for the top 100 e-commerce sellers — a regulatory tightrope. $2,400 View Insight" [ref=e98] [cursor=pointer]':
          - /url: /login?redirect=/reports/vietnam-ecommerce-shadow-payments
          - generic [ref=e99]:
            - generic [ref=e104]:
              - paragraph [ref=e105]: E-Commerce
              - paragraph [ref=e106]: Mar 14, 2026
            - 'heading "Shadow Payment Rails: How Top Sellers Bypass Fees" [level=3] [ref=e107]'
            - paragraph [ref=e108]: Direct-billing rails lift net margin 11pp for the top 100 e-commerce sellers — a regulatory tightrope.
          - generic [ref=e109]:
            - generic [ref=e110]: $2,400
            - generic [ref=e111]:
              - text: View Insight
              - img [ref=e112]
        - link "Gaming Mar 02, 2026 KOL Economics in Mobile Gaming UA Micro-KOL networks cost 38% less than TikTok Ads at equivalent install volume. The map of who matters. $1,900 View Insight" [ref=e114] [cursor=pointer]:
          - /url: /login?redirect=/reports/vietnam-gaming-kol-economics
          - generic [ref=e115]:
            - generic [ref=e120]:
              - paragraph [ref=e121]: Gaming
              - paragraph [ref=e122]: Mar 02, 2026
            - heading "KOL Economics in Mobile Gaming UA" [level=3] [ref=e123]
            - paragraph [ref=e124]: Micro-KOL networks cost 38% less than TikTok Ads at equivalent install volume. The map of who matters.
          - generic [ref=e125]:
            - generic [ref=e126]: $1,900
            - generic [ref=e127]:
              - text: View Insight
              - img [ref=e128]
    - generic [ref=e131]:
      - generic [ref=e132]: ACME CAPITAL
      - generic [ref=e133]: PACIFIC HOLDINGS
      - generic [ref=e134]: MERIDIAN VC
      - generic [ref=e135]: EAST RIDGE
      - generic [ref=e136]: ARC PARTNERS
  - contentinfo [ref=e137]:
    - generic [ref=e138]:
      - generic [ref=e139]:
        - link "VN-SIR." [ref=e140] [cursor=pointer]:
          - /url: /
          - generic [ref=e142]: VN-SIR.
        - paragraph [ref=e143]: The Vietnam Analyst. Surgical insights for foreign investors.
        - paragraph [ref=e144]: Ho Chi Minh City, Vietnam
      - generic [ref=e145]:
        - paragraph [ref=e146]: Platform
        - list [ref=e147]:
          - listitem [ref=e148]:
            - link "Intelligence Hub" [ref=e149] [cursor=pointer]:
              - /url: /
          - listitem [ref=e150]:
            - link "Custom Advisory" [ref=e151] [cursor=pointer]:
              - /url: /advisory
          - listitem [ref=e152]:
            - link "About" [ref=e153] [cursor=pointer]:
              - /url: /about
      - generic [ref=e154]:
        - paragraph [ref=e155]: Legal
        - list [ref=e156]:
          - listitem [ref=e157]:
            - link "Terms of Service" [ref=e158] [cursor=pointer]:
              - /url: /legal#tos
          - listitem [ref=e159]:
            - link "Privacy Policy" [ref=e160] [cursor=pointer]:
              - /url: /legal#privacy
          - listitem [ref=e161]:
            - link "IP Policy" [ref=e162] [cursor=pointer]:
              - /url: /legal#ip
          - listitem [ref=e163]:
            - link "Payment Security" [ref=e164] [cursor=pointer]:
              - /url: /legal#payment
    - generic [ref=e165]:
      - generic [ref=e166]: © 2026 VN-SIR. All rights reserved.
      - generic [ref=e167]: v1.0.0
  - dialog "Cookie consent" [ref=e168]:
    - generic [ref=e169]:
      - paragraph [ref=e170]:
        - strong [ref=e171]: We use minimal analytics cookies.
        - text: VNSIR complies with GDPR. We collect data only for identity verification and personalized intelligence delivery — no third-party sharing.
      - generic [ref=e172]:
        - button "Decline" [ref=e173]
        - button "Accept" [ref=e174]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e180] [cursor=pointer]:
    - img [ref=e181]
  - alert [ref=e184]
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
  60  |   await page.goto("/");
> 61  |   await page.waitForSelector('[data-testid="game-status"]', {
      |              ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
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
  161 | 
```