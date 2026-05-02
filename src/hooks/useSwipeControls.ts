/**
 * @file src/hooks/useSwipeControls.ts
 * @description Attaches touchstart/touchend listeners to a DOM element and
 * translates swipe gestures into Snake Direction commands.
 *
 * Algorithm:
 * 1. Record (x, y) origin on touchstart.
 * 2. On touchend, compute (deltaX, deltaY).
 * 3. Ignore gestures shorter than MIN_SWIPE_DISTANCE (tap filtering).
 * 4. Determine dominant axis; map axis + sign to Direction.
 * 5. Call onSwipe(direction).
 *
 * Uses native addEventListener with { passive: false } on touchstart so
 * preventDefault() can suppress scroll hijack. React's synthetic onTouchStart
 * does not support passive: false, which is why native listeners are used.
 */

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Direction } from "@/types";

/** Minimum pixel distance to classify a touch gesture as a swipe. */
const MIN_SWIPE_DISTANCE = 10;

/**
 * Attaches touch event listeners (touchstart/touchend) to the referenced
 * element and invokes `onSwipe` with the detected Direction on valid swipes.
 *
 * @param elementRef - Ref to the DOM element to observe for touch events.
 * @param onSwipe    - Callback invoked with the swipe direction.
 */
export function useSwipeControls(
  elementRef: RefObject<HTMLElement | null>,
  onSwipe: (direction: Direction) => void,
): void {
  // Mutable ref for touch origin — avoids triggering renders on every touch.
  const originRef = useRef<{ x: number; y: number } | null>(null);

  // Keep onSwipe in a ref so the effect never re-runs when the caller
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

      // Ignore taps / micro-gestures below the minimum swipe threshold.
      if (absX < MIN_SWIPE_DISTANCE && absY < MIN_SWIPE_DISTANCE) return;

      let direction: Direction;
      if (absX >= absY) {
        // Horizontal axis dominates (ties go to horizontal).
        direction = deltaX > 0 ? "RIGHT" : "LEFT";
      } else {
        // Vertical axis dominates.
        direction = deltaY > 0 ? "DOWN" : "UP";
      }

      onSwipeRef.current(direction);
    };

    // Native addEventListener required for { passive: false } — React's
    // synthetic onTouchStart does not support this option.
    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [elementRef]);
}
