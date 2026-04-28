/**
 * @file src/components/game/ScoreBoard.tsx
 * @description Displays the current score and all-time high score for the session.
 *
 * Purely presentational — receives values as props and emits no events.
 */

interface ScoreBoardProps {
  score: number;
  highScore: number;
}

export function ScoreBoard({ score, highScore }: ScoreBoardProps) {
  return (
    <div className="flex w-full justify-between px-1 text-sm font-mono text-gray-300">
      <span>
        SCORE:{" "}
        <span className="text-emerald-400 font-bold">{score}</span>
      </span>
      <span>
        BEST:{" "}
        <span className="text-yellow-400 font-bold">{highScore}</span>
      </span>
    </div>
  );
}
