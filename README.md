# 🐍 Snake

A classic Snake game built with **Next.js 15**, **React 19**, and **TypeScript** — featuring a clean three-layer architecture that keeps game logic, state management, and rendering completely decoupled.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development Commands](#development-commands)
- [Game Controls](#game-controls)
- [Configuration](#configuration)

---

## Architecture Overview

The project follows a strict **three-layer separation** that flows one way:

```
Engine (pure logic) → Hook (state + game loop) → UI (rendering)
```

### Layer 1 — Engine (`src/lib/game-engine/`)

Framework-agnostic, pure TypeScript. Zero React imports.

| File | Responsibility |
|------|---------------|
| `reducer.ts` | Pure reducer: all game-state transitions via discriminated-union actions (`START`, `PAUSE`, `RESUME`, `RESET`, `CHANGE_DIRECTION`, `TICK`). Returns a new immutable snapshot on every action — input state is never mutated. |
| `utils.ts` | Stateless helpers: coordinate math, collision detection, food placement, direction validation. |
| `index.ts` | Public barrel export. |

**Key design properties:**
- Pure function — no side effects, no framework dependencies.
- Fully unit-testable without a browser or React runtime.
- Can be lifted into a Web Worker for large boards without any refactoring.

### Layer 2 — Hook (`src/hooks/`)

React boundary. Owns time and state.

| File | Responsibility |
|------|---------------|
| `useGameEngine.ts` | Wires the pure reducer into `useReducer`. Drives the game loop via `setInterval`. Adjusts tick speed as score rises (difficulty scaling). Provides stable `dispatch` wrappers via `useCallback`. |
| `useKeyboardControls.ts` | Attaches `keydown` listeners and maps arrow/WASD keys to `CHANGE_DIRECTION` dispatches. |
| `index.ts` | Public barrel export. |

**Key design properties:**
- The only layer that knows about time (`setInterval`).
- Child components never import the reducer or raw action types directly.

### Layer 3 — UI (`src/components/game/`, `src/app/`)

React components. Read state, render pixels.

| File | Responsibility |
|------|---------------|
| `GameBoard.tsx` | Renders the grid, snake segments, and food pellet via CSS. |
| `ScoreBoard.tsx` | Displays current score and high score. |
| `GameOverlay.tsx` | Shows IDLE / PAUSED / GAME_OVER overlays with action prompts. |
| `app/page.tsx` | Root page — composes all components using the hooks. |

**Key design property:**
- No business logic. Components receive props or call hook-provided handlers only.

---

## Project Structure

```
snake/
├── src/
│   ├── app/                        # Next.js App Router root
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Game entry point
│   │   └── globals.css
│   ├── components/
│   │   └── game/                   # UI layer
│   │       ├── GameBoard.tsx
│   │       ├── GameOverlay.tsx
│   │       ├── ScoreBoard.tsx
│   │       └── index.ts
│   ├── hooks/                      # Hook layer
│   │   ├── useGameEngine.ts
│   │   ├── useKeyboardControls.ts
│   │   └── index.ts
│   ├── lib/
│   │   └── game-engine/            # Engine layer
│   │       ├── reducer.ts
│   │       ├── utils.ts
│   │       └── index.ts
│   ├── types/                      # Shared TypeScript types
│   │   ├── game.ts
│   │   └── index.ts
│   ├── constants/
│   │   └── game.ts
│   └── __tests__/                  # Unit tests (Vitest)
│       ├── game-engine-reducer.test.ts
│       └── game-engine-utils.test.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** 18.17 or later
- **npm** 9+ (or pnpm / yarn)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd snake

# Install dependencies
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js development server with hot reload |
| `npm run build` | Compile a production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint across the codebase |
| `npm test` | Run the Vitest unit test suite in watch mode |
| `npm run test:ui` | Open the Vitest browser UI |
| `npm run test:coverage` | Generate a test coverage report |

---

## Game Controls

| Key | Action |
|-----|--------|
| `Arrow Up` / `W` | Move up |
| `Arrow Down` / `S` | Move down |
| `Arrow Left` / `A` | Move left |
| `Arrow Right` / `D` | Move right |
| `Space` / `Enter` | Start / Resume / Restart |
| `P` | Pause |

---

## Configuration

Default game parameters are defined in `src/lib/game-engine/reducer.ts`:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `boardWidth` | `20` | Number of cells wide |
| `boardHeight` | `20` | Number of cells tall |
| `initialTickMs` | `150` | Starting game-loop interval (ms) |
| `minTickMs` | `60` | Fastest possible tick (ms) |
| `scorePerPellet` | `10` | Points awarded per food pellet |

Speed scales automatically: every 50 points the tick interval decreases by 10 ms, down to the `minTickMs` floor.
