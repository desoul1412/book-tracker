/**
 * @file src/hooks/useSwipeControls.ts
 * @description Attaches touch-event swipe detection to a DOM element ref and
 * translates swipe gestures into Snake `Direction` commands.
 *
 * Algorithm
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Record the `(x, y)` of the first touch on `touchstart`.
 * 2. On `touchend`, compute `(deltaX, deltaY)`.
 * 3. If the gesture is shorter than `minSwipeDistance`, ignore it (tap noise).
 * 4. Determine the dominant axis (whichever delta is larger in absolute value).
 * 5. Map the dominant axis + sign to UP / DOWN / LEFT / RIGHT.
 * 6. Call `onSwipe(direction)`.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • `passive: false` on `touchstart` so we can `preventDefault()` and suppress
 *   scroll hijack while the game is active.
 * • Listeners are added/removed inside `useEffect` so they track the element
 *   ref correctly (null on first render) and clean up on unmount.
 * • No state is kept in React — raw mutable refs hold the origin coords to
 *   avoid triggering renders on every touch event.
 * • The hook is intentionally decoupled from `useGameEngine`; callers wire them
 *   together by passing `changeDirection` as `onSwipe`.
 *
 * @example
 *   const boardRef = useRef<HTMLDivElement>(null);
 *   useSwipeControls(boardRef, changeDirection);
 */

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Direction } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum pixel distance to classify a touch gesture as a swipe. */
const MIN_SWIPE_DISTANCE = 10;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Attaches `touchstart`/`touchend` listeners to the element referenced by
 * `elementRef` and invokes `onSwipe` with the resolved `Direction` whenever a
 * valid swipe is detected.
 *
 * @param elementRef - Ref pointing to the DOM element to observe.
 * @param onSwipe    - Callback invoked with the detected direction.
 */
export function useSwipeControls(
  elementRef: RefObject<HTMLElement | null>,
  onSwipe: (direction: Direction) => void
): void {
  // Store touch-origin coords in a mutable ref to avoid triggering renders.
  const originRef = useRef<{ x: number; y: number } | null>(null);

  // Keep onSwipe in a ref so the effect never needs to re-run when the caller
  // passes a new inline function reference on each render.
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent): void => {
      const touch = e.touches[0];
      if (!touch) return;
      originRef.current = { x: touch.clientX, y: touch.clientY };
      // Prevent scroll while a touch is in progress over the game board.
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent): void => {
      const origin = originRef.current;
      if (!origin) return;
      originRef.current = null;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - origin.x;
      const deltaY = touch.clientY - origin.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Ignore taps / micro-gestures.
      if (absX < MIN_SWIPE_DISTANCE && absY < MIN_SWIPE_DISTANCE) return;

      let direction: Direction;
      if (absX >= absY) {
        // Horizontal dominates.
        direction = deltaX > 0 ? "RIGHT" : "LEFT";
      } else {
        // Vertical dominates.
        direction = deltaY > 0 ? "DOWN" : "UP";
      }

      onSwipeRef.current(direction);
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [elementRef]);
}
