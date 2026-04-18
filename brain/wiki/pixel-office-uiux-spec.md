---
tags: [ui, canvas, pixel-art, spec, office, cyberpunk, splash-screen]
date: 2026-04-18
status: active
---

# Pixel Office UI/UX Specification
## "Cyberpunk War Room — Make the Office Come Alive"

> Hand this document to a dedicated **Canvas/Frontend Agent** equipped with
> `Read`, `Edit`, `Write`, `Glob`, `Grep`, and `Bash` (for running `tsc --noEmit`).
> The agent should read this spec top-to-bottom before touching any file.

---

## 0. Vision & Goals

### 0.1 Splash Screen — Game-Style Boot Sequence

On first load, the app does NOT jump straight to the dashboard. Instead it shows
a **full-screen pixel-art splash screen** — think classic SNES/GBA title screen:

- **Title:** "CEO-SIM" rendered in large blocky pixel font (custom sprite or
  canvas-drawn, NOT a web font). Glowing neon cyan/magenta with CRT flicker.
- **Subtitle:** `"Zero-Human Software Factory"` in smaller pixel font, typewriter
  reveal, below the title.
- **Background:** Dark grid / matrix rain / subtle animated circuit-board pattern.
- **Boot sequence text:** Before the title appears, show rapid scrolling terminal
  lines (`[OK] Loading agents...`, `[OK] Connecting to Supabase...`, etc.) for
  1-2 seconds — then the title slams in with a screen-shake effect.
- **"PRESS START" / "BEGIN"** button pulses at the bottom. Click or keypress
  transitions to the dashboard with a CRT power-on wipe effect.
- Implemented as a React component (`SplashScreen.tsx`) with its own canvas or
  CSS animation. Shown once per session (use `sessionStorage` flag).

### 0.2 Office Overhaul — Cyberpunk War Room

The current office is **too flat and lifeless**. Agents walk through objects with
no personality. The new direction is a **cyberpunk war room / command center**:

- **Environment:** Dark room with neon accent lighting, holographic displays,
  server racks with blinking LEDs, cables on the floor, glowing circuit-board
  floor tiles. Think Blade Runner ops center, not a generic corporate office.
- **New Agent Models/Sprites:** Agents need distinct cyberpunk-styled character
  sprites — hoodies, visors, cybernetic limbs, glowing eyes. Each role
  (CEO, PM, DevOps, Frontend, Backend, QA) should be visually distinguishable
  at a glance by silhouette alone, not just color labels.
- **Animations:** Agents should NOT just walk boringly through objects:
  - Proper collision / pathfinding that respects furniture
  - Sitting animations when at desks (not just standing on desk tiles)
  - Typing animations with visible keystroke effects
  - Idle animations: stretching, looking at phone, drinking coffee
  - Interaction animations: two agents meeting = speech bubbles + gestures
- **Room Effects:** Ambient fog/haze layer, floating holographic data displays,
  neon light reflections on floor tiles, occasional sparking wires, wall-mounted
  monitors showing code/graphs.
- **Sound design hooks:** Prepare data attributes or event emitters for future
  ambient sound (keyboard clicks, server hum, alert chimes). No audio impl yet.

### 0.3 Original Goal (Preserved)

The pixel office (`/company/:id`) currently renders agents as sprites that walk
to desks, display speech bubbles, and show alert icons. It is functional but
visually flat. The goal of this work is to make the office feel **alive, reactive,
and information-dense** — the feeling that a real software factory is humming.

No new data fetching is needed. All enhancements read from the `company` prop
(already contains `employees` with status, `activityDetail`, `heartbeat`). The
**CANVAS-AS-VIEW INVARIANT** must be preserved: zero API calls, zero Supabase,
zero direct fetch inside `PixelOfficeCanvas.tsx`.

---

## 1. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Renderer | Browser Canvas 2D API (`CanvasRenderingContext2D`) | No WebGL — must stay Canvas 2D for Tauri WebView2 compat |
| Game loop | `requestAnimationFrame` with `dt` time-step | Existing loop in `PixelOfficeCanvas.tsx` |
| Pathfinding | BFS (`src/engine/pathfinding.ts`) | A* upgrade out of scope for this sprint |
| Assets | PNG sprite sheets + JSON layout | `public/assets/` — 16px tile grid |
| Scaling | Integer 2× render, CSS contain-fit | `SCALE = 2`, `imageRendering: pixelated` |
| Types | TypeScript strict | `CharacterRenderState`, `AgentState`, `OfficeLayout` |
| Framework | React 19 hook lifecycle | `useRef` game loop, `useEffect` asset loading |

---

## 2. File Map

```
src/
  engine/
    canvasRenderer.ts       ← MAIN render functions (renderFrame, renderCharacter, etc.)
    assetLoader.ts          ← loads floors, walls, chars, furniture as HTMLImageElements
    pathfinding.ts          ← BFS grid — do not modify
  components/
    PixelOfficeCanvas.tsx   ← React component, game loop, agent sync

public/assets/
  characters/char_0..5.png ← 16×32 per frame, 7 frames wide, 3 rows (down/up/right)
  floors/floor_0..8.png    ← 16×16 tiles
  furniture/*/             ← named PNGs (DESK_FRONT, PC_FRONT_ON_1/2/3, etc.)
  walls/wall_0.png
  default-layout-1.json    ← tile grid, furniture placement, tileColors
```

### Constants (do not change without reading side effects)

```typescript
// canvasRenderer.ts
TILE_SIZE = 16          // px per tile (native/unscaled)
CHAR_FRAME_W = 16       // character sprite width
CHAR_FRAME_H = 32       // character sprite height
CHAR_FRAMES_PER_ROW = 7

// PixelOfficeCanvas.tsx
SCALE = 2               // render upscale (canvas is 2× native tile grid)
WALK_SPEED = 30         // px/sec at native resolution
ANIM_FPS = 6            // sprite walk animation rate
```

---

## 3. Current Rendering Pipeline

```
requestAnimationFrame loop (PixelOfficeCanvas.tsx)
  │
  ├─ syncAgents(employees)        ← updates AgentState from Employee prop
  ├─ move agents along BFS paths  ← pixel interpolation, direction, frame advance
  │
  └─ renderFrame(ctx, layout, charStates, assets, tileColors, frameCount)
       │
       ├─ ctx.clearRect + fillRect('#05080f')
       ├─ renderTiles(ctx, layout, assets, tileColors)
       │    └─ floor PNGs + optional HSB color overlay (multiply blend)
       ├─ renderFurniture(ctx, furniture, assets)
       ├─ [characters sorted by pixelY — painter's algorithm]
       │    └─ renderCharacter(ctx, char, assets)
       │         ├─ sprite sheet slice (dirRow × frameIndex)
       │         ├─ role label (bold 6px monospace, neon color, shadow)
       │         └─ status dot (green=alive+walking, orange=stale, red=dead, grey=idle)
       ├─ renderSpeechBubble(ctx, char)   ← cyan border box, truncated to 16 chars
       └─ renderAlertIcon(ctx, char, frameCount)   ← bouncing !/? /~ box
```

---

## 4. Improvements — Prioritized Task List

### TASK 1 — Animated PC Monitors (High Impact, Low Effort)
**File:** `src/engine/canvasRenderer.ts`, `src/engine/assetLoader.ts`,
`src/components/PixelOfficeCanvas.tsx`

**What:** PC_FRONT_ON_1/2/3 already exist as three frames. Currently the layout
places `PC_FRONT_OFF` statically regardless of agent status. Make PCs animate when
their agent is working.

**How:**
1. Add `workingAgentIds: Set<string>` as a parameter to `renderFrame` (or compute
   it from `characters` array — agents with `heartbeat === 'alive'` and
   `isWalking === false` after reaching desk = "seated working").
2. Add `pcFrameIndex: number` to `renderFrame` parameters (derived from
   `frameCount % (ANIM_FPS * 3)` — slow flicker ~2fps).
3. In `renderFurniture`, look up which furniture tile is adjacent to a working
   agent. If it's a `PC_FRONT_*` type, draw `PC_FRONT_ON_{1|2|3}` based on
   `pcFrameIndex` instead of `PC_FRONT_OFF`.
4. Simpler fallback: just cycle ALL PCs through ON_1/2/3 based on `frameCount`.
   Working offices always have PCs on.

**Expected result:** Monitors flicker between three screen-glow states at ~2fps.
Visually suggests active computation.

---

### TASK 2 — Desk Glow / Work Zone Aura (High Impact, Low Effort)
**File:** `src/engine/canvasRenderer.ts`

**What:** When an agent is seated and working (alive heartbeat, not walking),
draw a soft radial gradient glow around their desk tile. Color = agent's
`labelColor`. This makes "who is working" instantly readable.

**How:** Add `renderWorkingAura(ctx, char)` called BEFORE `renderCharacter` (so
it's under the sprite):

```typescript
function renderWorkingAura(ctx: CanvasRenderingContext2D, char: CharacterRenderState) {
  if (char.heartbeat !== 'alive' || char.isWalking) return;
  const cx = Math.round(char.pixelX + CHAR_FRAME_W / 2);
  const cy = Math.round(char.pixelY + CHAR_FRAME_H / 2);
  const radius = 20;
  const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
  grd.addColorStop(0, hexToRgba(char.labelColor, 0.18));
  grd.addColorStop(1, hexToRgba(char.labelColor, 0));
  ctx.fillStyle = grd;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
```

Insert into `renderFrame` loop, before `renderCharacter`:
```typescript
for (const char of sorted) renderWorkingAura(ctx, char);
for (const char of sorted) renderCharacter(ctx, char, assets);
```

---

### TASK 3 — Particle System: Code Particles (Medium Impact, Medium Effort)
**File:** `src/engine/canvasRenderer.ts`, `src/components/PixelOfficeCanvas.tsx`

**What:** Working agents emit tiny floating particles (single pixel or 2×2 dots
with glyphs like `{`, `}`, `0`, `1`, `/`) that drift upward and fade out.
Maximum 5 particles per working agent, 30 total cap.

**Data structure** (add to `PixelOfficeCanvas.tsx`):
```typescript
interface Particle {
  x: number;
  y: number;
  vx: number;  // drift velocity
  vy: number;  // upward velocity (negative)
  life: number; // 0-1 (1=fresh, 0=dead)
  decay: number; // per-second decay rate
  glyph: string;
  color: string;
}
const particlesRef = useRef<Particle[]>([]);
```

**Update in game loop** (inside the `loop` function, after agent movement):
```typescript
const GLYPHS = ['0','1','{','}','/','>','<','*','#'];
// Spawn particles for working agents
for (const agent of agentsRef.current.values()) {
  if (agent.heartbeat === 'alive' && !agent.isWalking && Math.random() < 0.04) {
    if (particlesRef.current.length < 30) {
      particlesRef.current.push({
        x: agent.pixelX + CHAR_FRAME_W / 2 + (Math.random() - 0.5) * 8,
        y: agent.pixelY,
        vx: (Math.random() - 0.5) * 4,
        vy: -8 - Math.random() * 8,
        life: 1,
        decay: 0.4 + Math.random() * 0.4,
        glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        color: agent.labelColor,
      });
    }
  }
}
// Update particles
particlesRef.current = particlesRef.current
  .map(p => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, life: p.life - p.decay * dt }))
  .filter(p => p.life > 0);
```

**Render in canvasRenderer.ts** — new `renderParticles` function:
```typescript
export function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  ctx.save();
  ctx.font = '5px monospace';
  ctx.textAlign = 'center';
  for (const p of particles) {
    ctx.globalAlpha = p.life * 0.8;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 2;
    ctx.fillText(p.glyph, Math.round(p.x), Math.round(p.y));
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.restore();
}
```

Add `Particle[]` param to `renderFrame` signature and call `renderParticles` after
furniture, before characters.

---

### TASK 4 — CRT Scanlines Overlay (Low Effort, High Atmosphere)
**File:** `src/engine/canvasRenderer.ts`

**What:** Subtle horizontal scanlines drawn over the entire canvas as a final pass,
plus a vignette (darkened corners). Makes the whole canvas feel like a monitor.

**How:** Add `renderPostProcess(ctx, w, h, frameCount)` called as the very last
step in `renderFrame`:

```typescript
export function renderPostProcess(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frameCount: number,
) {
  // Scanlines — every 2px row, alpha 0.08
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let y = 0; y < h; y += 2) {
    ctx.fillRect(0, y, w, 1);
  }

  // Vignette — radial gradient from transparent center to dark edges
  const vgrd = ctx.createRadialGradient(w/2, h/2, h*0.3, w/2, h/2, h*0.8);
  vgrd.addColorStop(0, 'rgba(0,0,0,0)');
  vgrd.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vgrd;
  ctx.fillRect(0, 0, w, h);

  // Subtle phosphor flicker — every ~3s a very faint flash
  if (frameCount % 180 < 3) {
    ctx.fillStyle = 'rgba(0,255,136,0.015)';
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();
}
```

Call this at the end of `renderFrame`, after all alert icons:
```typescript
renderPostProcess(ctx, w, h, frameCount ?? 0);
```

---

### TASK 5 — Idle "Look Around" Micro-Animation (Medium Impact, Medium Effort)
**File:** `src/components/PixelOfficeCanvas.tsx`

**What:** Idle agents currently stand frozen facing down. Every 3-5 seconds they
should briefly turn in a random direction (up/right/down) and back — simulating
"looking around."

**How:** Add per-agent idle timer fields to `AgentState`:
```typescript
idleLookTimer: number;   // countdown in seconds
idleLookDir: CharDirection | null;
idleLookDuration: number;
```

Initialize with `idleLookTimer: 3 + Math.random() * 4`.

In the game loop, for agents that are NOT walking:
```typescript
if (!agent.isWalking) {
  agent.idleLookTimer -= dt;
  if (agent.idleLookTimer <= 0) {
    if (agent.idleLookDir === null) {
      // Start look
      const dirs: CharDirection[] = ['up', 'right', 'down'];
      agent.idleLookDir = dirs[Math.floor(Math.random() * dirs.length)];
      agent.idleLookDuration = 0.4 + Math.random() * 0.6;
    } else {
      agent.idleLookDuration -= dt;
      if (agent.idleLookDuration <= 0) {
        agent.idleLookDir = null;
        agent.idleLookTimer = 3 + Math.random() * 4;
      }
    }
  }
  if (agent.idleLookDir) agent.direction = agent.idleLookDir;
}
```

---

### TASK 6 — Typing Animation at Desk (High Impact, Medium Effort)
**File:** `src/engine/canvasRenderer.ts`

**What:** Working agents at their desk should show a "typing" visual — a small
blinking cursor or hand-movement effect above the keyboard area of their desk.
Since we only have walk frames, simulate with a small `▮` cursor blinking at the
desk surface.

**How:** In `renderCharacter`, if `char.heartbeat === 'alive' && !char.isWalking`,
draw a blinking cursor below the sprite (at desk height):

```typescript
// Typing cursor at desk surface
if (char.heartbeat === 'alive' && !char.isWalking) {
  const blink = Math.floor(frameCount / 15) % 2 === 0; // ~2fps at 30fps loop
  if (blink) {
    ctx.save();
    ctx.fillStyle = char.labelColor;
    ctx.shadowColor = char.labelColor;
    ctx.shadowBlur = 2;
    ctx.fillRect(drawX + 4, drawY + CHAR_FRAME_H - 4, 4, 2); // small cursor
    ctx.restore();
  }
}
```

Note: `renderCharacter` doesn't currently receive `frameCount`. Pass it through:
- Update signature: `renderCharacter(ctx, char, assets, frameCount: number)`
- Update `renderFrame` to pass `frameCount` when calling `renderCharacter`

---

### TASK 7 — Clickable Agents (High UX Impact, Low Effort)
**File:** `src/components/PixelOfficeCanvas.tsx`

**What:** Clicking on an agent sprite in the canvas should navigate to their
Agent Detail page (`/company/:id/agents/:agentId`).

**How:** Add a `onClick` handler to the `<canvas>` element that translates the
mouse event to canvas-space coordinates, then checks hit-boxes against all
agent positions.

```typescript
import { useNavigate } from 'react-router-dom';

// Inside PixelOfficeCanvas component:
const navigate = useNavigate();
const { companyId } = useParams<{ companyId: string }>();

const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  // Translate to canvas native coords
  const cssX = e.clientX - rect.left;
  const cssY = e.clientY - rect.top;
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const nativeX = cssX * scaleX / SCALE;  // unscale to tile coords
  const nativeY = cssY * scaleY / SCALE;

  for (const agent of agentsRef.current.values()) {
    const drawY = agent.pixelY - (CHAR_FRAME_H - TILE_SIZE);
    if (
      nativeX >= agent.pixelX && nativeX <= agent.pixelX + CHAR_FRAME_W &&
      nativeY >= drawY && nativeY <= drawY + CHAR_FRAME_H
    ) {
      navigate(`/company/${companyId}/agents/${agent.id}`);
      return;
    }
  }
}, [companyId, navigate]);
```

Add to `<canvas>`:
```tsx
<canvas
  ref={canvasRef}
  width={canvasW}
  height={canvasH}
  onClick={handleCanvasClick}
  style={{ ... cursor: 'default' }}
/>
```

Also add hover cursor: on `mousemove`, check hit-boxes and set
`canvas.style.cursor = 'pointer'` when hovering an agent.

---

### TASK 8 — Status Bar HUD Overlay (Medium Impact, Medium Effort)
**File:** `src/engine/canvasRenderer.ts`

**What:** A small always-visible overlay in the bottom-left of the canvas showing:
- Active agent count
- Total tickets in-progress
- Sprint burndown %

This is diegetic (drawn onto the canvas, not HTML overlay) so it never goes
out of sync with canvas scaling.

**How:** Add `renderStatusHud(ctx, data)` called after post-process:

```typescript
export interface HudData {
  workingCount: number;
  totalAgents: number;
  burndownPct: number;
  sprintName: string;
}

export function renderStatusHud(
  ctx: CanvasRenderingContext2D,
  data: HudData,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.font = '5px monospace';
  ctx.textAlign = 'left';

  const lines = [
    `AGENTS: ${data.workingCount}/${data.totalAgents} WORKING`,
    `SPRINT: ${data.sprintName?.slice(0, 14) ?? 'N/A'}`,
    `BURN: ${data.burndownPct}%`,
  ];

  const lineH = 8;
  const padX = 4;
  const padY = h - lines.length * lineH - 4;

  // Background
  ctx.fillStyle = 'rgba(5,8,15,0.75)';
  ctx.fillRect(2, padY - 2, 90, lines.length * lineH + 4);
  ctx.strokeStyle = '#1b2a3a';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(2.5, padY - 1.5, 89, lines.length * lineH + 3);

  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? '#00ff88' : '#4a7a9a';
    ctx.fillText(line, padX, padY + i * lineH + 6);
  });

  ctx.restore();
}
```

`PixelOfficeCanvas.tsx` needs to pass `HudData` from the `company` prop to
`renderFrame`. Compute it from `company.employees` and pass as a new optional param.

---

### TASK 9 — Speech Bubble: Typewriter Effect (Low Effort, High Polish)
**File:** `src/engine/canvasRenderer.ts`, `src/components/PixelOfficeCanvas.tsx`

**What:** When `speechBubble` changes, animate the text appearing character by
character (typewriter), rather than snapping to full text instantly.

**How:** Add `speechBubbleRaw: string | null` and `speechBubbleDisplayed: string`
to `AgentState`. In `syncAgents`, when `speechBubble` changes, start a reveal:

```typescript
// When speech changes
if (emp.activityDetail !== agent.speechBubbleRaw) {
  agent.speechBubbleRaw = emp.activityDetail;
  agent.speechBubbleDisplayed = '';
  agent.speechBubbleRevealIdx = 0;
  agent.speechBubbleRevealTimer = 0;
}
```

In game loop, advance display text:
```typescript
if (agent.speechBubbleRevealIdx < (agent.speechBubbleRaw?.length ?? 0)) {
  agent.speechBubbleRevealTimer += dt;
  if (agent.speechBubbleRevealTimer >= 0.05) { // 20 chars/sec
    agent.speechBubbleRevealTimer = 0;
    agent.speechBubbleRevealIdx++;
    agent.speechBubbleDisplayed = (agent.speechBubbleRaw ?? '').slice(0, agent.speechBubbleRevealIdx);
  }
}
```

Pass `speechBubbleDisplayed` (instead of `speechBubble`) into `CharacterRenderState`.

---

### TASK 10 — Agent Name Tooltip on Hover (Low Effort, High UX)
**File:** `src/components/PixelOfficeCanvas.tsx`

**What:** When hovering over an agent, show a small HTML tooltip (NOT drawn on
canvas — use absolute-positioned `<div>`) with:
- Agent name
- Role
- Current status
- Activity detail

This is an HTML overlay, not canvas, so it supports readable font sizes.

**How:**
```typescript
const [hoveredAgent, setHoveredAgent] = useState<{
  id: string; name: string; role: string; status: string; activity: string | null;
  x: number; y: number;
} | null>(null);
```

On `mousemove`, do the same hit-test as click (Task 7). If hit:
```typescript
setHoveredAgent({
  id: agent.id,
  name: emp.name,
  role: emp.role,
  status: emp.status,
  activity: emp.activityDetail ?? null,
  x: e.clientX - rect.left,
  y: e.clientY - rect.top,
});
```

Render alongside `<canvas>`:
```tsx
<div ref={containerRef} style={{ position: 'relative', ... }}>
  <canvas ... />
  {hoveredAgent && (
    <div style={{
      position: 'absolute',
      left: hoveredAgent.x + 12,
      top: hoveredAgent.y - 10,
      background: '#050810',
      border: '1px solid #00ffff40',
      padding: '4px 8px',
      fontSize: 10,
      fontFamily: 'var(--font-hud)',
      color: 'var(--hud-text)',
      pointerEvents: 'none',
      zIndex: 10,
      minWidth: 120,
    }}>
      <div style={{ color: 'var(--neon-cyan)', textTransform: 'uppercase' }}>{hoveredAgent.role}</div>
      <div style={{ color: '#8090a8' }}>{hoveredAgent.name}</div>
      <div style={{ color: 'var(--hud-text-dim)', fontSize: 9, marginTop: 2 }}>{hoveredAgent.status}</div>
      {hoveredAgent.activity && (
        <div style={{ color: '#a0b4c8', fontSize: 9, marginTop: 2 }}>{hoveredAgent.activity}</div>
      )}
    </div>
  )}
</div>
```

---

## 5. Implementation Order

Do tasks in this order (each builds on the previous and has minimal risk):

| # | Task | Effort | Files |
|---|------|--------|-------|
| 1 | Animated PC Monitors | 30 min | `canvasRenderer.ts`, `PixelOfficeCanvas.tsx` |
| 2 | Desk Glow Aura | 20 min | `canvasRenderer.ts` |
| 3 | CRT Scanlines + Vignette | 15 min | `canvasRenderer.ts` |
| 4 | Typing Cursor at Desk | 20 min | `canvasRenderer.ts` |
| 5 | Idle Look-Around | 30 min | `PixelOfficeCanvas.tsx` |
| 6 | Clickable Agents | 20 min | `PixelOfficeCanvas.tsx` |
| 7 | Hover Tooltip | 20 min | `PixelOfficeCanvas.tsx` |
| 8 | Particle System | 45 min | `canvasRenderer.ts`, `PixelOfficeCanvas.tsx` |
| 9 | Speech Typewriter | 30 min | `PixelOfficeCanvas.tsx`, `canvasRenderer.ts` |
| 10 | Status HUD | 30 min | `canvasRenderer.ts`, `PixelOfficeCanvas.tsx` |

---

## 6. Performance Budget

| Budget | Limit |
|--------|-------|
| Canvas clearRect + fills per frame | ≤ 3 full-canvas fills |
| Particles in flight | ≤ 30 total, despawn at `life ≤ 0` |
| `ctx.save/restore` pairs per frame | ≤ 20 |
| New `HTMLImageElement` loads | 0 — all assets loaded once in `loadAllAssets()` |
| `requestAnimationFrame` callbacks | Exactly 1 (existing loop — do not add a second) |
| Memory allocations per frame | Minimize — prefer in-place mutation of `AgentState` fields |

---

## 7. TypeScript Validation

After each task, run:
```bash
npx tsc --noEmit --project tsconfig.app.json
```

Expected: **0 errors**. Do not commit with TS errors.

Do NOT:
- Call `fetch()` inside `PixelOfficeCanvas.tsx` (CANVAS-AS-VIEW invariant)
- Import from `server/` anywhere in `src/`
- Add `any` casts unless unavoidable and commented
- Break the `SCALE` constant or `imageRendering: pixelated` style

---

## 8. Asset Reference

### Characters (`public/assets/characters/char_N.png`)
- Sheet: 7 frames × 3 rows
- Row 0 = walking down, Row 1 = up, Row 2 = right (mirror for left)
- Each frame: 16×32px
- `char_0` = CEO, `char_1` = PM, `char_2` = DevOps, `char_3` = Frontend,
  `char_4` = Backend, `char_5` = QA

### PC Frames (for TASK 1)
```
PC_FRONT_OFF    → agent idle / no agent
PC_FRONT_ON_1   → monitor frame 1 (use when frameCount % 3 === 0)
PC_FRONT_ON_2   → monitor frame 2 (use when frameCount % 3 === 1)
PC_FRONT_ON_3   → monitor frame 3 (use when frameCount % 3 === 2)
```
Cycle rate: `Math.floor(frameCount / 10) % 3` ≈ 2fps at 60fps loop.

### Furniture Type Keys (for TASK 1)
Check `default-layout-1.json` `.furniture` array. PC tiles have `type` starting
with `PC_`. Cycle all `PC_*` tiles to ON frames when any agent is working.

---

## 9. What NOT to Change

- `src/engine/pathfinding.ts` — BFS grid, do not touch
- `src/store/dashboardStore.ts` — no new state fields needed
- `src/components/CompanyDetail.tsx` — only the canvas receives the `company` prop
- `public/assets/default-layout-1.json` — read-only for this sprint
- The existing `renderAlertIcon` / alert icon system — do not refactor, only extend
- `SCALE = 2` constant — changing this breaks the CSS contain-fit display size math

---

## 10. Acceptance Criteria

1. **PC monitors animate** — working agents' desk PCs cycle through ON_1/2/3 frames
2. **Working agents glow** — soft radial aura in role color beneath seated working agents
3. **Scanlines visible** — faint horizontal lines over entire canvas
4. **Vignette visible** — corners are noticeably darker than center
5. **Particles appear** — small glowing code glyphs rise from working agents, fade out
6. **Idle agents look around** — non-working agents briefly face different directions
7. **Click navigates** — clicking an agent sprite navigates to `/company/:id/agents/:id`
8. **Hover tooltip** — hovering an agent shows name/role/status/activity in HTML overlay
9. **No TS errors** — `tsc --noEmit` exits 0
10. **60fps maintained** — `requestAnimationFrame` loop stays under 16ms budget

---

---

## 11. Sandbox Prototyping Strategy — book-tracker Repo

### Why

The `ceo-simulator` codebase is complex (Supabase, server agents, Zustand stores,
multi-route SPA). Iterating on pixel art UI/canvas rendering inside it is slow and
risky — a broken import can block the entire app. Instead, we use a **separate
sandbox repo** to prototype and test all visual/UIUX work in isolation.

### Sandbox Repo

**Repository:** `https://github.com/desoul1412/book-tracker`

Clone this repo into a new workspace. It will serve as the **UIUX prototyping
playground** for CEO-SIM's pixel office and splash screen.

### What Gets Ported to the Sandbox

The following artifacts from `ceo-simulator` must be copied or referenced in the
sandbox so that all prototyping stays compatible:

| Artifact | Source | Purpose |
|----------|--------|---------|
| Pixel assets | `public/assets/` (characters, floors, furniture, walls) | Render with real sprites |
| Tech stack config | `vite.config.ts`, `tsconfig.json`, `tailwind` setup | Same build pipeline |
| Canvas engine | `src/engine/canvasRenderer.ts`, `assetLoader.ts`, `pathfinding.ts` | Prototype against real renderer |
| UIUX spec | `brain/wiki/pixel-office-uiux-spec.md` (this file) | Source of truth for requirements |
| Layout JSON | `public/assets/default-layout-1.json` | Test with real office layouts |
| Type definitions | `CharacterRenderState`, `AgentState`, `OfficeLayout`, etc. | Maintain type compatibility |
| CSS / Tailwind theme | `src/index.css` (CSS variables, CRT theme tokens) | Consistent styling |

### Sandbox Rules

1. **Same stack:** React 19 + TypeScript + Vite + Tailwind v4. No deviations.
2. **Same canvas API:** Browser Canvas 2D only. No WebGL, no Pixi.js, no Phaser.
3. **Modular exports:** Every component/function built in the sandbox must be
   exportable as a standalone module — no sandbox-specific imports that would
   break when moved to `ceo-simulator`.
4. **Mock data only:** The sandbox uses hardcoded mock `company`/`employees` data.
   No Supabase, no real API calls.
5. **Test first:** Each visual feature should have a dedicated route/page in the
   sandbox (e.g., `/splash`, `/office`, `/sprites`) for isolated testing.
6. **Import path:** When a feature is ready, it gets PR'd back to `ceo-simulator`
   by copying the files into the correct `src/` paths. The sandbox is disposable;
   `ceo-simulator` is the source of truth.

### Sandbox Development Workflow

```
1. Clone book-tracker → new workspace
2. Copy tech stack config + pixel assets + engine files from ceo-simulator
3. Set up isolated test routes: /splash, /office, /sprite-viewer
4. Prototype splash screen, new agent sprites, cyberpunk office
5. Validate: same Canvas 2D API, same TypeScript types, same Tailwind theme
6. When ready → copy finished modules back to ceo-simulator, PR to main
```

### What Claude Code Should Do in the Sandbox

- Build the splash screen component (`SplashScreen.tsx`) with full animation
- Prototype new cyberpunk agent sprite rendering
- Test new office environment (neon lighting, holographic effects, fog layers)
- Create a sprite viewer page to preview all character models/animations
- Validate that all code compiles with the same `tsconfig` as `ceo-simulator`
- Ensure zero coupling to sandbox-specific code before importing back

---

*Spec written by CEO. Last updated 2026-04-18.*
*Related: [[Factory-Operations-Manual]], [[Architecture]]*
