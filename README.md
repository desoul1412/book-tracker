# 🐍 Snake

A classic Snake game built with **Next.js 15**, **React 19**, and **TypeScript** — featuring a clean three-layer architecture that keeps game logic, state management, and rendering completely decoupled.

---

## Table of Contents

- [Live Demo](#live-demo)
- [Architecture Overview](#architecture-overview)
  - [Layer 1 — Engine (`src/lib/game-engine/`)](#layer-1--engine-srclibgame-engine)
  - [Layer 2 — Hook (`src/hooks/`)](#layer-2--hook-srchooks)
  - [Layer 3 — UI (`src/components/game/`)](#layer-3--ui-srccomponentsgame)
  - [Data flow diagram](#data-flow-diagram)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Development Commands](#development-commands)
- [Game Controls](#game-controls)
- [Configuration](#configuration)
- [Testing](#testing)
- [Tech Stack](#tech-stack)

---

## Live Demo

> Start the dev server and open [http://localhost:3000](http://localhost:3000).

---

## Architecture Overview

The codebase enforces a **strict three-layer separation** so that each concern can be understood, tested, and replaced independently.

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 3 — UI                              │
│           src/components/game/  +  src/app/                 │
│   GameBoard · GameOverlay · ScoreBoard (pure presentational) │
└───────────────────────┬─────────────────────────────────────┘
                        │  props + callbacks (no actions)
┌───────────────────────▼─────────────────────────────────────┐
│                    Layer 2 — Hook                            │
│                    src/hooks/                                │
│   useGameEngine  (game loop, timers, dispatch)               │
│   useKeyboardControls  (input → actions)                     │
└───────────────────────┬─────────────────────────────────────┘
                        │  pure function calls
┌───────────────────────▼─────────────────────────────────────┐
│                    Layer 1 — Engine                          │
│               src/lib/game-engine/                           │
│   gameReducer · buildInitialState · utils                    │
│   (no React, no timers, no side effects)                     │
└─────────────────────────────────────────────────────────────┘
```

### Layer 1 — Engine (`src/lib/game-engine/`)

The **pure functional core**. No React imports, no `setTimeout`, no randomness that can't be seeded.

| File | Responsibility |
|---|---|
| `reducer.ts` | `gameReducer(state, action, config) → GameState` — all state transitions as a discriminated union switch. Returns a new immutable snapshot every tick. |
| `utils.ts` | Stateless helpers: `coordinatesEqual`, `moveCoordinate`, `wrapCoordinate`, `isOppositeDirection`, `randomFreeCoordinate`. |
| `index.ts` | Public barrel — consumers import from `@/lib/game-engine`, never from internal paths. |

**Key design decisions:**
- Immutable snapshots: every action returns a brand-new `GameState` — the previous state is never mutated.
- No React dependency: the engine can be lifted into a Web Worker for large boards without any refactoring.
- Exhaustive action handling: TypeScript discriminated unions cause a compile error if a new action type is added without a matching `case`.

### Layer 2 — Hook (`src/hooks/`)

The **stateful glue** between the pure engine and React.

| File | Responsibility |
|---|---|
| `useGameEngine.ts` | Wraps `gameReducer` in `useReducer`. Drives the game loop via `setInterval`. Dynamically adjusts tick speed as score increases. Exposes stable callbacks (`start`, `pause`, `resume`, `reset`, `changeDirection`). |
| `useKeyboardControls.ts` | Attaches global `keydown` listeners. Maps Arrow keys + WASD → `changeDirection`; `Space` → pause/resume. One direction change per animation frame (prevents diagonal movement from key-mashing). |

**Key design decisions:**
- The hook is the **only** place aware of time (`setInterval`). The reducer stays pure and testable without fake timers.
- `useCallback` on all dispatch wrappers stabilises references for dependency arrays.
- `useRef` for the interval ID prevents stale-closure bugs.

### Layer 3 — UI (`src/components/game/`)

**Purely presentational** — receives pre-computed data as props and dispatches no actions directly.

| Component | Responsibility |
|---|---|
| `GameBoard.tsx` | CSS-grid board. Classifies each cell (`head` / `body` / `food` / `empty`) and applies Tailwind classes. Keyed by `x-y` string to minimise DOM diffing. |
| `GameOverlay.tsx` | Semi-transparent overlay shown when status is `IDLE`, `PAUSED`, or `GAME_OVER`. Hidden (`null`) while `RUNNING`. |
| `ScoreBoard.tsx` | Displays current score and session high score. |

**Key design decisions:**
- CSS Grid (not `<canvas>`) for an accessible DOM tree and Tailwind-compatible styling.
- `role="grid"` + `aria-label` for screen-reader support.
- `role="dialog"` + `aria-modal` on the overlay while the game is inactive.

### Data flow diagram

```
Keyboard / Timer
      │
      ▼
useKeyboardControls  ──────────────────────────────────┐
useGameEngine (setInterval → TICK)                     │
      │  dispatch(action)                               │
      ▼                                                 │
gameReducer(state, action) ──► new GameState            │
      │                                                 │
      ▼                                                 │
React re-render                                         │
      │  props                                          │
      ▼                                                 │
GameBoard / GameOverlay / ScoreBoard ◄──────────────────┘
```

---

## Project Structure

```
snake/
├── src/
│   ├── app/                    # Next.js App Router entry points
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── game/               # Layer 3 — UI (presentational)
│   │       ├── GameBoard.tsx
│   │       ├── GameOverlay.tsx
│   │       ├── ScoreBoard.tsx
│   │       └── index.ts
│   ├── hooks/                  # Layer 2 — Hook (stateful glue)
│   │   ├── useGameEngine.ts
│   │   ├── useKeyboardControls.ts
│   │   └── index.ts
│   ├── lib/
│   │   └── game-engine/        # Layer 1 — Engine (pure functions)
│   │       ├── reducer.ts
│   │       ├── utils.ts
│   │       └── index.ts
│   ├── types/
│   │   ├── game.ts             # GameState, GameAction, GameConfig, Coordinate, Direction
│   │   └── index.ts
│   ├── constants/
│   │   └── game.ts             # GRID_SIZE, tick timings, score constants
│   ├── __tests__/              # Unit tests (Vitest)
│   │   ├── game-engine-reducer.test.ts
│   │   └── game-engine-utils.test.ts
│   └── test/
│       └── setup.ts            # @testing-library/jest-dom setup
├── brain/                      # Agent memory / ADR notes
├── next.config.ts              # CSP headers (production only)
├── tailwind.config.ts
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | `>= 20.x` |
| npm | `>= 10.x` (bundled with Node 20) |

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd snake

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server with Fast Refresh |
| `npm run build` | Compile a production-optimised build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |
| `npm test` | Run all unit tests with Vitest (watch mode) |
| `npm run test:ui` | Open the Vitest browser UI |
| `npm run test:coverage` | Run tests once and generate coverage report |

> **Coverage thresholds:** Lines / Functions / Branches / Statements must all be ≥ 60 % or the CI run fails.

---

## Game Controls

| Key | Action |
|---|---|
| `↑` / `W` | Move up |
| `↓` / `S` | Move down |
| `←` / `A` | Move left |
| `→` / `D` | Move right |
| `Space` | Pause / Resume |

---

## Configuration

Game parameters are tunable via `GameConfig` — pass them to `useGameEngine`:

```ts
const { state, start } = useGameEngine({
  boardWidth: 30,       // columns (default: 20)
  boardHeight: 30,      // rows    (default: 20)
  initialTickMs: 200,   // starting tick interval in ms (default: 150)
  minTickMs: 80,        // fastest possible tick (default: 60)
  scorePerPellet: 5,    // points per food pellet (default: 10)
});
```

Constants used across the project live in `src/constants/game.ts`.

---

## Testing

Tests live in `src/__tests__/` and use **Vitest** + **React Testing Library**.

```bash
# Run once
npm run test:coverage

# Watch mode
npm test

# Interactive browser UI
npm run test:ui
```

The engine layer (`reducer.ts`, `utils.ts`) is the primary test target — pure functions with no React dependency make unit testing straightforward and fast.

---

## Tech Stack

| Technology | Role |
|---|---|
| [Next.js 15](https://nextjs.org) | App Router, SSR, security headers |
| [React 19](https://react.dev) | UI rendering, hooks |
| [TypeScript 5](https://www.typescriptlang.org) | Static typing, discriminated unions |
| [Tailwind CSS 4](https://tailwindcss.com) | Utility-first styling |
| [Vitest 4](https://vitest.dev) | Unit testing |
| [React Testing Library](https://testing-library.com) | Component testing |

## Recent Changes

- 2026-04-28: Create GitHub Actions CI workflow: lint → type-check → test → build on every push and PR (MR #64a9508)
- 2026-04-28: Remove legacy Python files (`app.py`, `requirements.txt`) and document the decision in a commit message (MR #9a84541)

