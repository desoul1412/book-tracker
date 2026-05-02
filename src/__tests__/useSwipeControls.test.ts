/**
 * @file src/__tests__/useSwipeControls.test.ts
 * @description Unit tests for the `useSwipeControls` hook.
 *
 * Strategy
 * ─────────────────────────────────────────────────────────────────────────────
 * Each test:
 *  1. Creates a real DOM element (HTMLDivElement) and attaches it to `document`
 *     so JSDOM reflects it in the event target chain.
 *  2. Builds a ref object pointing at that element and passes it to the hook
 *     via `renderHook`.
 *  3. Dispatches synthetic `TouchEvent` objects to simulate user swipes.
 *  4. Asserts that `onDirection` was (or was not) called with the expected
 *     Direction value.
 *
 * JSDOM does not support `TouchEvent` natively — we polyfill it with a minimal
 * class stub that satisfies the interface the hook reads.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSwipeControls } from "@/hooks/useSwipeControls";
import type { Direction } from "@/types/game";

// ---------------------------------------------------------------------------
// TouchEvent polyfill for JSDOM
// ---------------------------------------------------------------------------

/**
 * JSDOM doesn't implement `TouchEvent`. We create a minimal stand-in that
 * the hook can dispatch and receive via addEventListener.
 */
class FakeTouchEvent extends Event {
  readonly touches: TouchList;
  readonly changedTouches: TouchList;

  constructor(
    type: string,
    init: { touches?: Touch[]; changedTouches?: Touch[] } = {},
  ) {
    super(type, { bubbles: true, cancelable: true });
    this.touches = init.touches as unknown as TouchList ?? [] as unknown as TouchList;
    this.changedTouches = init.changedTouches as unknown as TouchList ?? [] as unknown as TouchList;
  }
}

/** Minimal Touch object — only the fields the hook reads. */
function makeTouch(x: number, y: number): Touch {
  return { clientX: x, clientY: y } as Touch;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Dispatch a touchstart then a touchend at the given coordinates. */
function swipe(
  el: HTMLElement,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): void {
  const startTouch = makeTouch(startX, startY);
  const endTouch = makeTouch(endX, endY);

  el.dispatchEvent(
    new FakeTouchEvent("touchstart", { touches: [startTouch] }),
  );
  el.dispatchEvent(
    new FakeTouchEvent("touchend", { changedTouches: [endTouch] }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useSwipeControls", () => {
  let el: HTMLDivElement;
  let onDirection: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    el = document.createElement("div");
    document.body.appendChild(el);
    onDirection = vi.fn();
  });

  afterEach(() => {
    document.body.removeChild(el);
    vi.clearAllMocks();
  });

  it("calls onDirection('RIGHT') for a rightward swipe", () => {
    const ref = { current: el };
    renderHook(() => useSwipeControls(ref, { onDirection }));

    swipe(el, 100, 200, 160, 205);

    expect(onDirection).toHaveBeenCalledOnce();
    expect(onDirection).toHaveBeenCalledWith("RIGHT" satisfies Direction);
  });

  it("calls onDirection('LEFT') for a leftward swipe", () => {
    const ref = { current: el };
    renderHook(() => useSwipeControls(ref, { onDirection }));

    swipe(el, 160, 200, 100, 202);

    expect(onDirection).toHaveBeenCalledOnce();
    expect(onDirection).toHaveBeenCalledWith("LEFT" satisfies Direction);
  });

  it("calls onDirection('DOWN') for a downward swipe", () => {
    const ref = { current: el };
    renderHook(() => useSwipeControls(ref, { onDirection }));

    swipe(el, 200, 100, 204, 160);

    expect(onDirection).toHaveBeenCalledOnce();
    expect(onDirection).toHaveBeenCalledWith("DOWN" satisfies Direction);
  });

  it("calls onDirection('UP') for an upward swipe", () => {
    const ref = { current: el };
    renderHook(() => useSwipeControls(ref, { onDirection }));

    swipe(el, 200, 160, 205, 100);

    expect(onDirection).toHaveBeenCalledOnce();
    expect(onDirection).toHaveBeenCalledWith("UP" satisfies Direction);
  });

  it("does not fire for a tap (delta below MIN_SWIPE_PX threshold)", () => {
    const ref = { current: el };
    renderHook(() => useSwipeControls(ref, { onDirection }));

    // 8 px — below the 10 px minimum
    swipe(el, 200, 200, 208, 200);

    expect(onDirection).not.toHaveBeenCalled();
  });

  it("does not fire when enabled=false", () => {
    const ref = { current: el };
    renderHook(() =>
      useSwipeControls(ref, { onDirection, enabled: false }),
    );

    swipe(el, 100, 200, 200, 200);

    expect(onDirection).not.toHaveBeenCalled();
  });

  it("removes event listeners on unmount", () => {
    const ref = { current: el };
    const removeSpy = vi.spyOn(el, "removeEventListener");

    const { unmount } = renderHook(() =>
      useSwipeControls(ref, { onDirection }),
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith(
      "touchstart",
      expect.any(Function),
    );
    expect(removeSpy).toHaveBeenCalledWith(
      "touchend",
      expect.any(Function),
    );
  });

  it("uses the latest onDirection callback without re-attaching listeners", () => {
    const ref = { current: el };
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();

    const { rerender } = renderHook(
      ({ cb }: { cb: (d: Direction) => void }) =>
        useSwipeControls(ref, { onDirection: cb }),
      { initialProps: { cb: firstCallback } },
    );

    // Rerender with a different callback — listeners should NOT be re-attached
    // (effect only re-runs when `elementRef` changes, not the callback).
    rerender({ cb: secondCallback });

    // The second swipe after the rerender should use the new callback.
    swipe(el, 100, 200, 200, 200);

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledOnce();
    expect(secondCallback).toHaveBeenCalledWith("RIGHT");
  });

  it("picks the dominant axis — diagonal swipe takes horizontal axis", () => {
    const ref = { current: el };
    renderHook(() => useSwipeControls(ref, { onDirection }));

    // dx=80, dy=40 — horizontal dominates → RIGHT
    swipe(el, 100, 200, 180, 240);

    expect(onDirection).toHaveBeenCalledWith("RIGHT");
  });

  it("picks the dominant axis — diagonal swipe takes vertical axis", () => {
    const ref = { current: el };
    renderHook(() => useSwipeControls(ref, { onDirection }));

    // dx=30, dy=70 — vertical dominates → DOWN
    swipe(el, 100, 100, 130, 170);

    expect(onDirection).toHaveBeenCalledWith("DOWN");
  });
});
