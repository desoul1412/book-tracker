/**
 * @file src/components/game/KeyboardHints.tsx
 * @description Keyboard shortcut hints overlay shown on the idle screen.
 *
 * Renders a row of keyboard shortcut badges when `status === "IDLE"`,
 * giving first-time players an immediate visual cue without cluttering the
 * in-game experience. Returns `null` for all other statuses so there is no
 * hidden DOM cost while playing.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * - Pure presentational component — no internal state, no hook calls.
 * - Each shortcut is rendered as a `<kbd>` element for semantic correctness
 *   and screen-reader discoverability.
 * - The separator bullet (•) is hidden from assistive tech via
 *   `aria-hidden="true"` so screen readers read the hints as a clean list.
 * - The container uses `role="note"` so assistive technology announces it
 *   as supplemental information rather than main content.
 */

import type { FC } from "react";
import type { GameStatus } from "@/types/game";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface KeyboardHintsProps {
  /** Current game lifecycle status — hints only render when IDLE. */
  status: GameStatus;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Renders a single shortcut line: a `<kbd>` label + description text. */
const Hint: FC<{ keys: string; description: string }> = ({
  keys,
  description,
}) => (
  <span className="flex items-center gap-1.5">
    <kbd
      className="
        inline-flex items-center rounded border border-gray-600
        bg-gray-800 px-1.5 py-0.5 font-mono text-[0.65rem]
        font-semibold leading-none text-gray-300
        shadow-[inset_0_-1px_0_rgba(0,0,0,0.4)]
      "
    >
      {keys}
    </kbd>
    <span className="text-gray-400">{description}</span>
  </span>
);

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------

const Bullet: FC = () => (
  <span aria-hidden="true" className="text-gray-600 select-none">
    •
  </span>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * KeyboardHints — shows shortcut badges on the idle screen.
 *
 * Displays: "Arrow keys or WASD to move • Space to pause • Enter to start"
 *
 * @example
 * ```tsx
 * <KeyboardHints status={state.status} />
 * ```
 */
export const KeyboardHints: FC<KeyboardHintsProps> = ({ status }) => {
  if (status !== "IDLE") {
    return null;
  }

  return (
    <p
      role="note"
      aria-label="Keyboard shortcuts"
      data-testid="keyboard-hints"
      className="
        flex flex-wrap items-center justify-center gap-x-3 gap-y-2
        select-none text-xs
      "
    >
      <Hint keys="↑ ↓ ← →" description="or WASD to move" />
      <Bullet />
      <Hint keys="Space" description="to pause" />
      <Bullet />
      <Hint keys="Enter" description="to start" />
    </p>
  );
};

export default KeyboardHints;
