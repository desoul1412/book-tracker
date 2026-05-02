/**
 * @file src/hooks/useSwipeControls.ts
 * @description Pure React hook that translates touch-swipe gestures on a DOM
 * element into Snake `Direction` values.
 *
 * How it works
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. On `touchstart` we record the (x, y) of the first touch point.
 * 2. On `touchend` we calculate the delta against the stored start position.
 * 3. We take the dominant axis (whichever absolute delta is larger) and map it
 *    to a Direction, then call the `onDirection` callback.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • The hook accepts a `RefObject<HTMLElement | null>` so it is element-agnostic
 *   (canvas, div, etc.) and the component decides what to attach to.
 * • `{ passive: false }` on `touchstart` lets us call `e.preventDefault()` to
 *   stop the browser from scrolling the page while the player is swiping.
 * • A minimum swipe distance threshold (`MIN_SWIPE_PX`) prevents accidental
 *   micro-taps from changing direction.
 * • The hook is intentionally stateless — it never renders anything and has no
 *   internal state, making it trivially testable with a DOM spy.
 */

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Direction } from "@/types/game";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum pixel distance a swipe must travel to count as intentional. */
const MIN_SWIPE_PX = 10;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseSwipeControlsOptions {
  /**
   * Called with the resolved direction whenever a qualifying swipe gesture is
   * detected on the target element.
   */
  onDirection: (direction: Direction) => void;
  /**
   * Disabled when `false` (e.g. game is over or paused). Defaults to `true`.
   * The event listeners are still attached but ignored, so there is no
   * performance difference vs. toggling `addEventListener` on/off.
   */
  enabled?: boolean;
}

/**
 * Attach swipe-gesture recognition to a DOM element via its ref.
 *
 * @param elementRef - Ref to the element to listen on.
 * @param options    - Callback and optional enabled flag.
 *
 * @example
 *   const canvasRef = useRef<HTMLCanvasElement>(null);
 *   useSwipeControls(canvasRef, { onDirection: changeDirection });
 */
export function useSwipeControls(
  elementRef: RefObject<HTMLElement | null>,
  { onDirection, enabled = true }: UseSwipeControlsOptions,
): void {
  // Keep callback stable in the closure without adding it to the effect's dep
  // array — prevents listener re-attachment every render.
  const onDirectionRef = useRef(onDirection);
  onDirectionRef.current = onDirection;

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Stores the touch-start position for delta calculation in touchend.
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (!enabledRef.current) return;
      // Only track the first touch point.
      const touch = e.touches[0];
      if (!touch) return;
      startX = touch.clientX;
      startY = touch.clientY;
      // Prevent page scroll while the player is interacting with the canvas.
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!enabledRef.current) return;
      const touch = e.changedTouches[0];
      if (!touch) return;

      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Reject taps and micro-swipes.
      if (Math.max(absDx, absDy) < MIN_SWIPE_PX) return;

      // Dominant axis determines direction.
      let direction: Direction;
      if (absDx >= absDy) {
        direction = dx > 0 ? "RIGHT" : "LEFT";
      } else {
        direction = dy > 0 ? "DOWN" : "UP";
      }

      onDirectionRef.current(direction);
    };

    // `passive: false` is required on touchstart so we can call preventDefault.
    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [elementRef]);
  // Note: `onDirection` and `enabled` are intentionally excluded — they are
  // read via stable refs so we never need to re-attach listeners.
}
