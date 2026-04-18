# Phase 1: PixelLab Asset Generation — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate all isometric pixel-art assets for the CEO-SIM cyberpunk office sandbox using the PixelLab MCP — 6 chibi characters, walk/idle animations, 6 floor tile types, and 14 interactive props.

**Architecture:** All assets are generated via PixelLab MCP tool calls (create → poll get → save PNG). Assets land in `public/assets/iso/` organized by type. A manifest JSON `public/assets/iso/manifest.json` indexes every generated asset with its path, dimensions, and PixelLab job ID for reference. Each task updates the manifest immediately after saving so recovery from partial failure is always possible.

**Tech Stack:** PixelLab MCP (`create_character`, `animate_character`, `create_isometric_tile`, `create_map_object`, `get_character`, `get_isometric_tile`, `get_map_object`), Bash for directory setup + `.gitkeep` files, Python 3 for manifest validation.

**Spec reference:** `docs/superpowers/specs/2026-04-18-isometric-diegetic-office-design.md` §5

**Animation scope note:** Phase 1 generates only `walking` and `idle` animations per character. The spec §5.1 lists additional custom animations (`typing`, `pointing`, `carrying_box`, `drinking_coffee`). These are explicitly **deferred to Phase 4** (Agent Animation System) and are out of scope here.

---

## Token Budget

3 API tokens available (40 credits each = 120 credits total):
- Token 1: `5f022ee5-b728-453d-8e6d-ca29b688a8d9` — currently active in `.mcp.json`
- Token 2: `a1492141-93b0-429f-897c-ffa03a7214fb` — standby
- Token 3: `ea741d04-fedf-4f53-98f5-3e9013a10024` — standby

**Rotate tokens:** When a token runs out of credits, update `.mcp.json` to use the next standby token and restart the MCP server if needed.

**Credit cost estimate:**
- 6 characters × ~2 credits each = ~12 credits
- 12 animations × ~3 credits each = ~36 credits
- 6 floor tiles × ~1 credit each = ~6 credits
- 14 props × ~2 credits each = ~28 credits
- **Total: ~82 credits** (well within 120 budget)

---

## Output Directory Structure

```
public/assets/iso/
  characters/
    ceo/          char.png (static sheet), walk.png, idle.png
    pm/           char.png, walk.png, idle.png
    frontend/     char.png, walk.png, idle.png
    backend/      char.png, walk.png, idle.png
    devops/       char.png, walk.png, idle.png
    qa/           char.png, walk.png, idle.png
  tiles/
    floor-tech.png       dark cyberpunk tech floor
    floor-server.png     metal grating + green LED
    floor-meeting.png    dark checkered
    floor-ceo.png        premium dark + gold accent
    floor-kitchen.png    lighter grey
    floor-lobby.png      dark + glowing blue guides
  props/
    server-rack.png
    kanban-board.png
    desk-pc.png
    telepad.png
    projector-screen.png
    coffee-machine.png
    sofa.png
    plant.png
    qa-terminal.png
    vending-machine.png
    clipboard-display.png
    heart-display.png
    neon-sign-brain.png
    bookshelf.png
  manifest.json
```

---

## Chunk 1: Directory Setup + Character Generation

### Task 1: Create ISO asset directory structure

**Files:**
- Create: `public/assets/iso/` (full directory tree with `.gitkeep` placeholders)
- Create: `public/assets/iso/manifest.json` (empty seed)

- [ ] **Step 1: Create directories with .gitkeep files**

```bash
mkdir -p public/assets/iso/characters/ceo
mkdir -p public/assets/iso/characters/pm
mkdir -p public/assets/iso/characters/frontend
mkdir -p public/assets/iso/characters/backend
mkdir -p public/assets/iso/characters/devops
mkdir -p public/assets/iso/characters/qa
mkdir -p public/assets/iso/tiles
mkdir -p public/assets/iso/props

# Add .gitkeep so empty dirs are tracked
touch public/assets/iso/characters/ceo/.gitkeep
touch public/assets/iso/characters/pm/.gitkeep
touch public/assets/iso/characters/frontend/.gitkeep
touch public/assets/iso/characters/backend/.gitkeep
touch public/assets/iso/characters/devops/.gitkeep
touch public/assets/iso/characters/qa/.gitkeep
touch public/assets/iso/tiles/.gitkeep
touch public/assets/iso/props/.gitkeep
```

- [ ] **Step 2: Seed manifest**

Create `public/assets/iso/manifest.json`:
```json
{
  "version": "1.0.0",
  "generated": "2026-04-18",
  "characters": {},
  "tiles": {},
  "props": {}
}
```

- [ ] **Step 3: Commit directory scaffold**

```bash
git add public/assets/iso/
git commit -m "chore: scaffold iso asset directory structure with .gitkeep files"
```

---

### Task 2: Generate CEO chibi character

**PixelLab tool:** `mcp__pixellab__create_character`

- [ ] **Step 1: Call create_character for CEO**

```
Tool: mcp__pixellab__create_character
Parameters:
  description: "chibi pixel art CEO in dark suit with gold tie, confident posture, cyberpunk office style, neon cyan highlights"
  proportions: {"type": "preset", "name": "chibi"}
  n_directions: 8
  size: 48
  view: "low top-down"
  outline: "single color outline"
```

Note the returned `character_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <id from step 1>
```

Repeat until `status === "completed"`. The result contains image data.

- [ ] **Step 3: Save CEO character sheet**

Save the returned image data as `public/assets/iso/characters/ceo/char.png`.
Remove `.gitkeep` from `public/assets/iso/characters/ceo/` after first file is saved.

- [ ] **Step 4: Update manifest**

Add to `manifest.json` under `characters.ceo`:
```json
{
  "char": "iso/characters/ceo/char.png",
  "pixellab_id": "<character_id>",
  "size": 48,
  "directions": 8
}
```

---

### Task 3: Generate PM chibi character

- [ ] **Step 1: Call create_character for PM**

```
Tool: mcp__pixellab__create_character
Parameters:
  description: "chibi pixel art project manager with clipboard and wireless headset, smart casual blazer, cyberpunk office style, purple accent"
  proportions: {"type": "preset", "name": "chibi"}
  n_directions: 8
  size: 48
  view: "low top-down"
  outline: "single color outline"
```

Note the returned `character_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save**

Save image data → `public/assets/iso/characters/pm/char.png`
Remove `.gitkeep` from `public/assets/iso/characters/pm/` after saving.

- [ ] **Step 4: Update manifest** under `characters.pm`

```json
{
  "char": "iso/characters/pm/char.png",
  "pixellab_id": "<character_id>",
  "size": 48,
  "directions": 8
}
```

---

### Task 4: Generate Frontend Developer chibi character

- [ ] **Step 1: Call create_character for Frontend**

```
Tool: mcp__pixellab__create_character
Parameters:
  description: "chibi pixel art frontend developer with hoodie and oversized cyan headphones, cyberpunk style, bright cyan accents on dark hoodie"
  proportions: {"type": "preset", "name": "chibi"}
  n_directions: 8
  size: 48
  view: "low top-down"
  outline: "single color outline"
```

Note the returned `character_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save** → `public/assets/iso/characters/frontend/char.png`

Remove `.gitkeep` from `public/assets/iso/characters/frontend/` after saving.

- [ ] **Step 4: Update manifest** under `characters.frontend`

```json
{
  "char": "iso/characters/frontend/char.png",
  "pixellab_id": "<character_id>",
  "size": 48,
  "directions": 8
}
```

---

### Task 5: Generate Backend Developer chibi character

- [ ] **Step 1: Call create_character for Backend**

```
Tool: mcp__pixellab__create_character
Parameters:
  description: "chibi pixel art backend developer with dark hoodie and terminal-style green glasses, cyberpunk style, green matrix-rain accent, laptop under arm"
  proportions: {"type": "preset", "name": "chibi"}
  n_directions: 8
  size: 48
  view: "low top-down"
  outline: "single color outline"
```

Note the returned `character_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save** → `public/assets/iso/characters/backend/char.png`

Remove `.gitkeep` from `public/assets/iso/characters/backend/` after saving.

- [ ] **Step 4: Update manifest** under `characters.backend`

```json
{
  "char": "iso/characters/backend/char.png",
  "pixellab_id": "<character_id>",
  "size": 48,
  "directions": 8
}
```

---

### Task 6: Generate DevOps Engineer chibi character

- [ ] **Step 1: Call create_character for DevOps**

```
Tool: mcp__pixellab__create_character
Parameters:
  description: "chibi pixel art devops engineer with utility vest and red visor, cyberpunk style, red and orange tech accents, wrench holstered on belt"
  proportions: {"type": "preset", "name": "chibi"}
  n_directions: 8
  size: 48
  view: "low top-down"
  outline: "single color outline"
```

Note the returned `character_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save** → `public/assets/iso/characters/devops/char.png`

Remove `.gitkeep` from `public/assets/iso/characters/devops/` after saving.

- [ ] **Step 4: Update manifest** under `characters.devops`

```json
{
  "char": "iso/characters/devops/char.png",
  "pixellab_id": "<character_id>",
  "size": 48,
  "directions": 8
}
```

---

### Task 7: Generate QA Engineer chibi character

- [ ] **Step 1: Call create_character for QA**

```
Tool: mcp__pixellab__create_character
Parameters:
  description: "chibi pixel art QA tester with tablet computer and orange-tinted bug-hunting glasses, cyberpunk style, orange accent, magnifying glass in hand"
  proportions: {"type": "preset", "name": "chibi"}
  n_directions: 8
  size: 48
  view: "low top-down"
  outline: "single color outline"
```

Note the returned `character_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save** → `public/assets/iso/characters/qa/char.png`

Remove `.gitkeep` from `public/assets/iso/characters/qa/` after saving.

- [ ] **Step 4: Update manifest** under `characters.qa`

```json
{
  "char": "iso/characters/qa/char.png",
  "pixellab_id": "<character_id>",
  "size": 48,
  "directions": 8
}
```

- [ ] **Step 5: Verify all 6 character sheets exist**

```bash
for role in ceo pm frontend backend devops qa; do
  [ -f "public/assets/iso/characters/$role/char.png" ] && echo "OK: $role/char.png" || echo "MISSING: $role/char.png"
done
```

Expected: 6 lines all starting with `OK:`.

- [ ] **Step 6: Commit all 6 characters**

```bash
git add public/assets/iso/characters/ public/assets/iso/manifest.json
git commit -m "feat: generate 6 chibi characters via PixelLab MCP (CEO, PM, Frontend, Backend, DevOps, QA)"
```

---

## Chunk 2: Character Animations

**Animation scope:** Only `walking` and `idle` animations are generated in Phase 1. Custom animations (`typing`, `pointing`, `carrying_box`, `drinking_coffee`) are deferred to Phase 4 (Agent Animation System).

**PixelLab tool:** `mcp__pixellab__animate_character`

For each character, generate:
1. `walking` — 8-directional walk cycle
2. `idle` — breathing/fidget loop

The `animate_character` tool takes a `character_id` (from Chunk 1) and returns a new job id for that animation. Poll the animation job using `get_character` with the returned job id (the parameter name in the tool is still `character_id` — pass the animation job id value there). Repeat until `status === "completed"`.

---

### Task 8: Animate CEO (walk + idle)

- [ ] **Step 1: Animate CEO walking**

```
Tool: mcp__pixellab__animate_character
Parameters:
  character_id: <ceo_character_id from manifest.json characters.ceo.pixellab_id>
  animation: "walking"
```

Note the returned job id.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <job id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save** → `public/assets/iso/characters/ceo/walk.png`

- [ ] **Step 4: Animate CEO idle**

```
Tool: mcp__pixellab__animate_character
Parameters:
  character_id: <ceo_character_id>
  animation: "idle"
```

- [ ] **Step 5: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <job id from step 4>
```

Repeat until `status === "completed"`.

- [ ] **Step 6: Save** → `public/assets/iso/characters/ceo/idle.png`

- [ ] **Step 7: Update manifest** — add `walk` and `idle` paths under `characters.ceo`

```json
"walk": "iso/characters/ceo/walk.png",
"idle": "iso/characters/ceo/idle.png"
```

---

### Task 9: Animate PM (walk + idle)

- [ ] **Step 1: Animate PM walking**

```
Tool: mcp__pixellab__animate_character
Parameters:
  character_id: <pm_character_id from manifest.json characters.pm.pixellab_id>
  animation: "walking"
```

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <job id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save** → `public/assets/iso/characters/pm/walk.png`

- [ ] **Step 4: Animate PM idle**

```
Tool: mcp__pixellab__animate_character
Parameters:
  character_id: <pm_character_id>
  animation: "idle"
```

- [ ] **Step 5: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <job id from step 4>
```

Repeat until `status === "completed"`.

- [ ] **Step 6: Save** → `public/assets/iso/characters/pm/idle.png`

- [ ] **Step 7: Update manifest** under `characters.pm`

```json
"walk": "iso/characters/pm/walk.png",
"idle": "iso/characters/pm/idle.png"
```

---

### Task 10: Animate Frontend Developer (walk + idle)

- [ ] **Step 1: Animate Frontend walking**

```
Tool: mcp__pixellab__animate_character
Parameters:
  character_id: <frontend_character_id from manifest.json characters.frontend.pixellab_id>
  animation: "walking"
```

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <job id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save** → `public/assets/iso/characters/frontend/walk.png`

- [ ] **Step 4: Animate Frontend idle**

```
Tool: mcp__pixellab__animate_character
Parameters:
  character_id: <frontend_character_id>
  animation: "idle"
```

- [ ] **Step 5: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <job id from step 4>
```

Repeat until `status === "completed"`.

- [ ] **Step 6: Save** → `public/assets/iso/characters/frontend/idle.png`

- [ ] **Step 7: Update manifest** under `characters.frontend`

```json
"walk": "iso/characters/frontend/walk.png",
"idle": "iso/characters/frontend/idle.png"
```

---

### Task 11: Animate Backend Developer (walk + idle)

- [ ] **Step 1: Animate Backend walking**

```
Tool: mcp__pixellab__animate_character
Parameters:
  character_id: <backend_character_id from manifest.json characters.backend.pixellab_id>
  animation: "walking"
```

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <job id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save** → `public/assets/iso/characters/backend/walk.png`

- [ ] **Step 4: Animate Backend idle**

```
Tool: mcp__pixellab__animate_character
Parameters:
  character_id: <backend_character_id>
  animation: "idle"
```

- [ ] **Step 5: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <job id from step 4>
```

Repeat until `status === "completed"`.

- [ ] **Step 6: Save** → `public/assets/iso/characters/backend/idle.png`

- [ ] **Step 7: Update manifest** under `characters.backend`

```json
"walk": "iso/characters/backend/walk.png",
"idle": "iso/characters/backend/idle.png"
```

---

### Task 12: Animate DevOps Engineer (walk + idle)

- [ ] **Step 1: Animate DevOps walking**

```
Tool: mcp__pixellab__animate_character
Parameters:
  character_id: <devops_character_id from manifest.json characters.devops.pixellab_id>
  animation: "walking"
```

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <job id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save** → `public/assets/iso/characters/devops/walk.png`

- [ ] **Step 4: Animate DevOps idle**

```
Tool: mcp__pixellab__animate_character
Parameters:
  character_id: <devops_character_id>
  animation: "idle"
```

- [ ] **Step 5: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <job id from step 4>
```

Repeat until `status === "completed"`.

- [ ] **Step 6: Save** → `public/assets/iso/characters/devops/idle.png`

- [ ] **Step 7: Update manifest** under `characters.devops`

```json
"walk": "iso/characters/devops/walk.png",
"idle": "iso/characters/devops/idle.png"
```

---

### Task 13: Animate QA Engineer (walk + idle)

- [ ] **Step 1: Animate QA walking**

```
Tool: mcp__pixellab__animate_character
Parameters:
  character_id: <qa_character_id from manifest.json characters.qa.pixellab_id>
  animation: "walking"
```

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <job id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save** → `public/assets/iso/characters/qa/walk.png`

- [ ] **Step 4: Animate QA idle**

```
Tool: mcp__pixellab__animate_character
Parameters:
  character_id: <qa_character_id>
  animation: "idle"
```

- [ ] **Step 5: Poll until complete**

```
Tool: mcp__pixellab__get_character
Parameters:
  character_id: <job id from step 4>
```

Repeat until `status === "completed"`.

- [ ] **Step 6: Save** → `public/assets/iso/characters/qa/idle.png`

- [ ] **Step 7: Update manifest** under `characters.qa`

```json
"walk": "iso/characters/qa/walk.png",
"idle": "iso/characters/qa/idle.png"
```

- [ ] **Verify all 12 animation files exist before committing**

```bash
for role in ceo pm frontend backend devops qa; do
  for anim in walk idle; do
    [ -f "public/assets/iso/characters/$role/$anim.png" ] && echo "OK: $role/$anim.png" || echo "MISSING: $role/$anim.png"
  done
done
```

Expected: 12 lines all starting with `OK:`.

- [ ] **Commit all animations**

```bash
git add public/assets/iso/characters/ public/assets/iso/manifest.json
git commit -m "feat: generate walk and idle animations for all 6 agents via PixelLab MCP"
```

---

## Chunk 3: Isometric Floor Tiles

**PixelLab tool:** `mcp__pixellab__create_isometric_tile`

Common parameters for all tiles:
- `size`: 64 (64x32 isometric diamond)
- `tile_shape`: `"thin"` (floor tile shape)
- `outline`: `"lineless"` (modern look, no harsh edges)

---

### Task 14: Generate dark tech floor tile (Dev Room)

- [ ] **Step 1: Create tile**

```
Tool: mcp__pixellab__create_isometric_tile
Parameters:
  description: "dark cyberpunk office floor tile with subtle circuit board trace pattern, dark navy blue with faint cyan lines, isometric"
  size: 64
  tile_shape: "thin"
  outline: "lineless"
```

Note the returned `tile_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_isometric_tile
Parameters:
  tile_id: <tile_id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save** → `public/assets/iso/tiles/floor-tech.png`

Remove `.gitkeep` from `public/assets/iso/tiles/` after this first tile is saved.

- [ ] **Step 4: Update manifest** under `tiles.floor-tech`

```json
"floor-tech": { "path": "iso/tiles/floor-tech.png", "pixellab_id": "<tile_id>" }
```

---

### Task 15: Generate server room floor tile

- [ ] **Step 1: Create tile**

```
Tool: mcp__pixellab__create_isometric_tile
Parameters:
  description: "metal grating floor tile with green LED underglow along edges, dark steel surface, cyberpunk server room, isometric"
  size: 64
  tile_shape: "thin"
  outline: "lineless"
```

Note the returned `tile_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_isometric_tile
Parameters:
  tile_id: <tile_id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save** → `public/assets/iso/tiles/floor-server.png`

- [ ] **Step 4: Update manifest** under `tiles.floor-server`

```json
"floor-server": { "path": "iso/tiles/floor-server.png", "pixellab_id": "<tile_id>" }
```

---

### Task 16: Generate meeting room floor tile

- [ ] **Step 1: Create tile**

```
Tool: mcp__pixellab__create_isometric_tile
Parameters:
  description: "dark checkered floor tile, alternating black and very dark grey squares, sleek office meeting room, isometric"
  size: 64
  tile_shape: "thin"
  outline: "lineless"
```

Note the returned `tile_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_isometric_tile
Parameters:
  tile_id: <tile_id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save** → `public/assets/iso/tiles/floor-meeting.png`

- [ ] **Step 4: Update manifest** under `tiles.floor-meeting`

```json
"floor-meeting": { "path": "iso/tiles/floor-meeting.png", "pixellab_id": "<tile_id>" }
```

---

### Task 17: Generate CEO office floor tile

- [ ] **Step 1: Create tile**

```
Tool: mcp__pixellab__create_isometric_tile
Parameters:
  description: "premium dark polished floor tile with thin gold accent stripe, executive office, luxurious cyberpunk, isometric"
  size: 64
  tile_shape: "thin"
  outline: "lineless"
```

Note the returned `tile_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_isometric_tile
Parameters:
  tile_id: <tile_id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save** → `public/assets/iso/tiles/floor-ceo.png`

- [ ] **Step 4: Update manifest** under `tiles.floor-ceo`

```json
"floor-ceo": { "path": "iso/tiles/floor-ceo.png", "pixellab_id": "<tile_id>" }
```

---

### Task 18: Generate kitchen floor tile

- [ ] **Step 1: Create tile**

```
Tool: mcp__pixellab__create_isometric_tile
Parameters:
  description: "lighter grey office floor tile with subtle hexagonal texture, clean breakroom kitchen, isometric"
  size: 64
  tile_shape: "thin"
  outline: "lineless"
```

Note the returned `tile_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_isometric_tile
Parameters:
  tile_id: <tile_id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save** → `public/assets/iso/tiles/floor-kitchen.png`

- [ ] **Step 4: Update manifest** under `tiles.floor-kitchen`

```json
"floor-kitchen": { "path": "iso/tiles/floor-kitchen.png", "pixellab_id": "<tile_id>" }
```

---

### Task 19: Generate lobby floor tile

- [ ] **Step 1: Create tile**

```
Tool: mcp__pixellab__create_isometric_tile
Parameters:
  description: "dark entry floor tile with glowing blue guide lines and directional arrow markings, cyberpunk lobby entrance, isometric"
  size: 64
  tile_shape: "thin"
  outline: "lineless"
```

Note the returned `tile_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_isometric_tile
Parameters:
  tile_id: <tile_id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save** → `public/assets/iso/tiles/floor-lobby.png`

- [ ] **Step 4: Update manifest** under `tiles.floor-lobby`

```json
"floor-lobby": { "path": "iso/tiles/floor-lobby.png", "pixellab_id": "<tile_id>" }
```

- [ ] **Verify all 6 tiles exist before committing**

```bash
for tile in floor-tech floor-server floor-meeting floor-ceo floor-kitchen floor-lobby; do
  [ -f "public/assets/iso/tiles/$tile.png" ] && echo "OK: $tile.png" || echo "MISSING: $tile.png"
done
```

Expected: 6 lines all starting with `OK:`.

- [ ] **Commit all tiles**

```bash
git add public/assets/iso/tiles/ public/assets/iso/manifest.json
git commit -m "feat: generate 6 isometric floor tiles (tech, server, meeting, CEO, kitchen, lobby)"
```

---

## Chunk 4: Key Interactive Props

**PixelLab tool:** `mcp__pixellab__create_map_object`

Common parameters for all props:
- `view`: `"low top-down"` (isometric-compatible perspective)
- `outline`: `"single color outline"` (crisp edges for interactivity clarity)
- `detail`: `"high detail"` for key interactive objects

---

### Task 20: Generate server rack "The Brain"

- [ ] **Step 1: Create map object**

```
Tool: mcp__pixellab__create_map_object
Parameters:
  description: "pixel art server rack tower with blinking green and blue LED indicator lights, dark metal chassis, cyberpunk data center style, top-down low angle"
  view: "low top-down"
  outline: "single color outline"
  detail: "high detail"
```

Note the returned `object_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_map_object
Parameters:
  object_id: <object_id from step 1>
```

Repeat until `status === "completed"`.

- [ ] **Step 3: Save** → `public/assets/iso/props/server-rack.png`

- [ ] **Step 4: Update manifest** under `props.server-rack`

```json
"server-rack": { "path": "iso/props/server-rack.png", "pixellab_id": "<object_id>" }
```

---

### Task 21: Generate kanban whiteboard

- [ ] **Step 1: Create map object**

```
Tool: mcp__pixellab__create_map_object
Parameters:
  description: "pixel art wall-mounted kanban board with colored sticky notes in three columns (Todo/In Progress/Done), red yellow green blue sticky notes, office whiteboard, top-down low angle"
  view: "low top-down"
  outline: "single color outline"
  detail: "high detail"
```

Note the returned `object_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_map_object
Parameters:
  object_id: <object_id from step 1>
```

- [ ] **Step 3: Save** → `public/assets/iso/props/kanban-board.png`

- [ ] **Step 4: Update manifest** under `props.kanban-board`

```json
"kanban-board": { "path": "iso/props/kanban-board.png", "pixellab_id": "<object_id>" }
```

---

### Task 22: Generate desk with PC

- [ ] **Step 1: Create map object**

```
Tool: mcp__pixellab__create_map_object
Parameters:
  description: "pixel art office desk with dual monitors displaying code editor, dark cyberpunk theme, keyboard and mouse, neon screen glow, top-down low angle"
  view: "low top-down"
  outline: "single color outline"
  detail: "high detail"
```

Note the returned `object_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_map_object
Parameters:
  object_id: <object_id from step 1>
```

- [ ] **Step 3: Save** → `public/assets/iso/props/desk-pc.png`

- [ ] **Step 4: Update manifest** under `props.desk-pc`

```json
"desk-pc": { "path": "iso/props/desk-pc.png", "pixellab_id": "<object_id>" }
```

---

### Task 23: Generate recruitment telepad

- [ ] **Step 1: Create map object**

```
Tool: mcp__pixellab__create_map_object
Parameters:
  description: "pixel art circular teleportation platform with pulsing cyan energy rings and holographic shimmer, sci-fi recruitment portal, glowing floor pad, top-down low angle"
  view: "low top-down"
  outline: "single color outline"
  detail: "high detail"
```

Note the returned `object_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_map_object
Parameters:
  object_id: <object_id from step 1>
```

- [ ] **Step 3: Save** → `public/assets/iso/props/telepad.png`

- [ ] **Step 4: Update manifest** under `props.telepad`

```json
"telepad": { "path": "iso/props/telepad.png", "pixellab_id": "<object_id>" }
```

---

### Task 24: Generate war room projector screen

- [ ] **Step 1: Create map object**

```
Tool: mcp__pixellab__create_map_object
Parameters:
  description: "pixel art wall-mounted projector screen showing bar charts and graphs in cyan and green, meeting room projection display, dark border frame, top-down low angle"
  view: "low top-down"
  outline: "single color outline"
  detail: "high detail"
```

Note the returned `object_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_map_object
Parameters:
  object_id: <object_id from step 1>
```

- [ ] **Step 3: Save** → `public/assets/iso/props/projector-screen.png`

- [ ] **Step 4: Update manifest** under `props.projector-screen`

```json
"projector-screen": { "path": "iso/props/projector-screen.png", "pixellab_id": "<object_id>" }
```

- [ ] **Commit key props**

```bash
git add public/assets/iso/props/ public/assets/iso/manifest.json
git commit -m "feat: generate 5 key interactive props (server rack, kanban, desk+PC, telepad, projector)"
```

---

## Chunk 5: Secondary Props + Neon Sign

**PixelLab tool:** `mcp__pixellab__create_map_object`

Common parameters for secondary props:
- `view`: `"low top-down"`
- `outline`: `"single color outline"`
- `detail`: `"medium detail"` (except neon sign which uses `"high detail"`)

---

### Task 25: Generate coffee machine

- [ ] **Step 1: Create map object**

```
Tool: mcp__pixellab__create_map_object
Parameters:
  description: "pixel art modern espresso coffee machine with steam rising from spout, dark matte body with orange indicator light, office kitchen, top-down low angle"
  view: "low top-down"
  outline: "single color outline"
  detail: "medium detail"
```

Note the returned `object_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_map_object
Parameters:
  object_id: <object_id from step 1>
```

- [ ] **Step 3: Save** → `public/assets/iso/props/coffee-machine.png`

- [ ] **Step 4: Update manifest** under `props.coffee-machine`

```json
"coffee-machine": { "path": "iso/props/coffee-machine.png", "pixellab_id": "<object_id>" }
```

---

### Task 26: Generate cyberpunk sofa

- [ ] **Step 1: Create map object**

```
Tool: mcp__pixellab__create_map_object
Parameters:
  description: "pixel art dark office lounge sofa with purple neon accent stitching along edges, cyberpunk break room furniture, cushioned, top-down low angle"
  view: "low top-down"
  outline: "single color outline"
  detail: "medium detail"
```

Note the returned `object_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_map_object
Parameters:
  object_id: <object_id from step 1>
```

- [ ] **Step 3: Save** → `public/assets/iso/props/sofa.png`

- [ ] **Step 4: Update manifest** under `props.sofa`

```json
"sofa": { "path": "iso/props/sofa.png", "pixellab_id": "<object_id>" }
```

---

### Task 27: Generate office plant

- [ ] **Step 1: Create map object**

```
Tool: mcp__pixellab__create_map_object
Parameters:
  description: "pixel art small desk succulent plant in a dark geometric concrete pot, modern office accessory, top-down low angle"
  view: "low top-down"
  outline: "single color outline"
  detail: "medium detail"
```

Note the returned `object_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_map_object
Parameters:
  object_id: <object_id from step 1>
```

- [ ] **Step 3: Save** → `public/assets/iso/props/plant.png`

- [ ] **Step 4: Update manifest** under `props.plant`

```json
"plant": { "path": "iso/props/plant.png", "pixellab_id": "<object_id>" }
```

---

### Task 28: Generate QA terminal

- [ ] **Step 1: Create map object**

```
Tool: mcp__pixellab__create_map_object
Parameters:
  description: "pixel art computer terminal desk with large red and orange screen showing warning alerts and bug reports, red warning siren light on top, isolated workstation, top-down low angle"
  view: "low top-down"
  outline: "single color outline"
  detail: "medium detail"
```

Note the returned `object_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_map_object
Parameters:
  object_id: <object_id from step 1>
```

- [ ] **Step 3: Save** → `public/assets/iso/props/qa-terminal.png`

- [ ] **Step 4: Update manifest** under `props.qa-terminal`

```json
"qa-terminal": { "path": "iso/props/qa-terminal.png", "pixellab_id": "<object_id>" }
```

---

### Task 29: Generate vending machine

- [ ] **Step 1: Create map object**

```
Tool: mcp__pixellab__create_map_object
Parameters:
  description: "pixel art tall office vending machine with neon holographic product display, cyberpunk snack dispenser, glowing selection buttons, top-down low angle"
  view: "low top-down"
  outline: "single color outline"
  detail: "medium detail"
```

Note the returned `object_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_map_object
Parameters:
  object_id: <object_id from step 1>
```

- [ ] **Step 3: Save** → `public/assets/iso/props/vending-machine.png`

- [ ] **Step 4: Update manifest** under `props.vending-machine`

```json
"vending-machine": { "path": "iso/props/vending-machine.png", "pixellab_id": "<object_id>" }
```

---

### Task 30: Generate clipboard task display

- [ ] **Step 1: Create map object**

```
Tool: mcp__pixellab__create_map_object
Parameters:
  description: "pixel art wall-mounted clipboard display panel showing a task checklist with checkboxes, glowing cyan border frame, office wall unit, top-down low angle"
  view: "low top-down"
  outline: "single color outline"
  detail: "medium detail"
```

Note the returned `object_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_map_object
Parameters:
  object_id: <object_id from step 1>
```

- [ ] **Step 3: Save** → `public/assets/iso/props/clipboard-display.png`

- [ ] **Step 4: Update manifest** under `props.clipboard-display`

```json
"clipboard-display": { "path": "iso/props/clipboard-display.png", "pixellab_id": "<object_id>" }
```

---

### Task 31: Generate heart org chart display

- [ ] **Step 1: Create map object**

```
Tool: mcp__pixellab__create_map_object
Parameters:
  description: "pixel art wall-mounted LED heart icon display panel showing org status metrics, pulsing red glow, compact wall unit with digital readout, top-down low angle"
  view: "low top-down"
  outline: "single color outline"
  detail: "medium detail"
```

Note the returned `object_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_map_object
Parameters:
  object_id: <object_id from step 1>
```

- [ ] **Step 3: Save** → `public/assets/iso/props/heart-display.png`

- [ ] **Step 4: Update manifest** under `props.heart-display`

```json
"heart-display": { "path": "iso/props/heart-display.png", "pixellab_id": "<object_id>" }
```

---

### Task 32: Generate bookshelf

- [ ] **Step 1: Create map object**

```
Tool: mcp__pixellab__create_map_object
Parameters:
  description: "pixel art office bookshelf with rows of technical books and binders in various dark colors, some glowing data-tablet spines, cyberpunk office library, top-down low angle"
  view: "low top-down"
  outline: "single color outline"
  detail: "medium detail"
```

Note the returned `object_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_map_object
Parameters:
  object_id: <object_id from step 1>
```

- [ ] **Step 3: Save** → `public/assets/iso/props/bookshelf.png`

- [ ] **Step 4: Update manifest** under `props.bookshelf`

```json
"bookshelf": { "path": "iso/props/bookshelf.png", "pixellab_id": "<object_id>" }
```

---

### Task 33: Generate neon sign "The Brain"

This is the signature interactive element — small, wall-mounted on top of the server rack.

- [ ] **Step 1: Create map object**

```
Tool: mcp__pixellab__create_map_object
Parameters:
  description: "small pixel art neon sign reading THE BRAIN in glowing cyan neon tube letters, compact wall-mounted sign with visible neon tube backing plate, dark background, cyberpunk aesthetic, top-down low angle"
  view: "low top-down"
  outline: "single color outline"
  detail: "high detail"
```

Note the returned `object_id`.

- [ ] **Step 2: Poll until complete**

```
Tool: mcp__pixellab__get_map_object
Parameters:
  object_id: <object_id from step 1>
```

- [ ] **Step 3: Save** → `public/assets/iso/props/neon-sign-brain.png`

- [ ] **Step 4: Update manifest** under `props.neon-sign-brain`

```json
"neon-sign-brain": { "path": "iso/props/neon-sign-brain.png", "pixellab_id": "<object_id>" }
```

- [ ] **Commit secondary props + neon sign**

```bash
git add public/assets/iso/props/ public/assets/iso/manifest.json
git commit -m "feat: generate 9 secondary props + neon Brain sign via PixelLab MCP"
```

---

## Chunk 6: Finalize Manifest + Asset Index

### Task 34: Complete and validate manifest.json

The final `manifest.json` should have this structure:

```json
{
  "version": "1.0.0",
  "generated": "2026-04-18",
  "characters": {
    "ceo":      { "char": "iso/characters/ceo/char.png", "walk": "iso/characters/ceo/walk.png", "idle": "iso/characters/ceo/idle.png", "pixellab_id": "...", "size": 48, "directions": 8 },
    "pm":       { "char": "iso/characters/pm/char.png", "walk": "iso/characters/pm/walk.png", "idle": "iso/characters/pm/idle.png", "pixellab_id": "...", "size": 48, "directions": 8 },
    "frontend": { "char": "iso/characters/frontend/char.png", "walk": "iso/characters/frontend/walk.png", "idle": "iso/characters/frontend/idle.png", "pixellab_id": "...", "size": 48, "directions": 8 },
    "backend":  { "char": "iso/characters/backend/char.png", "walk": "iso/characters/backend/walk.png", "idle": "iso/characters/backend/idle.png", "pixellab_id": "...", "size": 48, "directions": 8 },
    "devops":   { "char": "iso/characters/devops/char.png", "walk": "iso/characters/devops/walk.png", "idle": "iso/characters/devops/idle.png", "pixellab_id": "...", "size": 48, "directions": 8 },
    "qa":       { "char": "iso/characters/qa/char.png", "walk": "iso/characters/qa/walk.png", "idle": "iso/characters/qa/idle.png", "pixellab_id": "...", "size": 48, "directions": 8 }
  },
  "tiles": {
    "floor-tech":    { "path": "iso/tiles/floor-tech.png", "pixellab_id": "..." },
    "floor-server":  { "path": "iso/tiles/floor-server.png", "pixellab_id": "..." },
    "floor-meeting": { "path": "iso/tiles/floor-meeting.png", "pixellab_id": "..." },
    "floor-ceo":     { "path": "iso/tiles/floor-ceo.png", "pixellab_id": "..." },
    "floor-kitchen": { "path": "iso/tiles/floor-kitchen.png", "pixellab_id": "..." },
    "floor-lobby":   { "path": "iso/tiles/floor-lobby.png", "pixellab_id": "..." }
  },
  "props": {
    "server-rack":       { "path": "iso/props/server-rack.png", "pixellab_id": "..." },
    "kanban-board":      { "path": "iso/props/kanban-board.png", "pixellab_id": "..." },
    "desk-pc":           { "path": "iso/props/desk-pc.png", "pixellab_id": "..." },
    "telepad":           { "path": "iso/props/telepad.png", "pixellab_id": "..." },
    "projector-screen":  { "path": "iso/props/projector-screen.png", "pixellab_id": "..." },
    "coffee-machine":    { "path": "iso/props/coffee-machine.png", "pixellab_id": "..." },
    "sofa":              { "path": "iso/props/sofa.png", "pixellab_id": "..." },
    "plant":             { "path": "iso/props/plant.png", "pixellab_id": "..." },
    "qa-terminal":       { "path": "iso/props/qa-terminal.png", "pixellab_id": "..." },
    "vending-machine":   { "path": "iso/props/vending-machine.png", "pixellab_id": "..." },
    "clipboard-display": { "path": "iso/props/clipboard-display.png", "pixellab_id": "..." },
    "heart-display":     { "path": "iso/props/heart-display.png", "pixellab_id": "..." },
    "bookshelf":         { "path": "iso/props/bookshelf.png", "pixellab_id": "..." },
    "neon-sign-brain":   { "path": "iso/props/neon-sign-brain.png", "pixellab_id": "..." }
  }
}
```

- [ ] **Step 1: Assert all expected files exist**

```bash
python3 - <<'EOF'
import os, sys

EXPECTED = {
    "characters": [
        "public/assets/iso/characters/ceo/char.png",
        "public/assets/iso/characters/ceo/walk.png",
        "public/assets/iso/characters/ceo/idle.png",
        "public/assets/iso/characters/pm/char.png",
        "public/assets/iso/characters/pm/walk.png",
        "public/assets/iso/characters/pm/idle.png",
        "public/assets/iso/characters/frontend/char.png",
        "public/assets/iso/characters/frontend/walk.png",
        "public/assets/iso/characters/frontend/idle.png",
        "public/assets/iso/characters/backend/char.png",
        "public/assets/iso/characters/backend/walk.png",
        "public/assets/iso/characters/backend/idle.png",
        "public/assets/iso/characters/devops/char.png",
        "public/assets/iso/characters/devops/walk.png",
        "public/assets/iso/characters/devops/idle.png",
        "public/assets/iso/characters/qa/char.png",
        "public/assets/iso/characters/qa/walk.png",
        "public/assets/iso/characters/qa/idle.png",
    ],
    "tiles": [
        "public/assets/iso/tiles/floor-tech.png",
        "public/assets/iso/tiles/floor-server.png",
        "public/assets/iso/tiles/floor-meeting.png",
        "public/assets/iso/tiles/floor-ceo.png",
        "public/assets/iso/tiles/floor-kitchen.png",
        "public/assets/iso/tiles/floor-lobby.png",
    ],
    "props": [
        "public/assets/iso/props/server-rack.png",
        "public/assets/iso/props/kanban-board.png",
        "public/assets/iso/props/desk-pc.png",
        "public/assets/iso/props/telepad.png",
        "public/assets/iso/props/projector-screen.png",
        "public/assets/iso/props/coffee-machine.png",
        "public/assets/iso/props/sofa.png",
        "public/assets/iso/props/plant.png",
        "public/assets/iso/props/qa-terminal.png",
        "public/assets/iso/props/vending-machine.png",
        "public/assets/iso/props/clipboard-display.png",
        "public/assets/iso/props/heart-display.png",
        "public/assets/iso/props/bookshelf.png",
        "public/assets/iso/props/neon-sign-brain.png",
    ],
}

missing = []
for category, paths in EXPECTED.items():
    for p in paths:
        if not os.path.isfile(p):
            missing.append(p)

if missing:
    print("MISSING FILES:")
    for m in missing:
        print(f"  {m}")
    sys.exit(1)
else:
    chars = len(EXPECTED["characters"])
    tiles = len(EXPECTED["tiles"])
    props = len(EXPECTED["props"])
    print(f"All files present: {chars} character frames, {tiles} tiles, {props} props")
EOF
```

Expected output:
```
All files present: 18 character frames, 6 tiles, 14 props
```

- [ ] **Step 2: Validate manifest counts**

```bash
python3 - <<'EOF'
import json, sys

with open("public/assets/iso/manifest.json") as f:
    m = json.load(f)

chars = len(m["characters"])
tiles = len(m["tiles"])
props = len(m["props"])

# Check each character has all 3 keys
missing_anim = [k for k, v in m["characters"].items() if not all(key in v for key in ("char", "walk", "idle"))]

errors = []
if chars != 6:   errors.append(f"Expected 6 characters, got {chars}")
if tiles != 6:   errors.append(f"Expected 6 tiles, got {tiles}")
if props != 14:  errors.append(f"Expected 14 props, got {props}")
if missing_anim: errors.append(f"Characters missing walk/idle: {missing_anim}")

if errors:
    for e in errors: print(f"ERROR: {e}")
    sys.exit(1)
else:
    print(f"Manifest valid — {chars} characters, {tiles} tiles, {props} props")
EOF
```

Expected output:
```
Manifest valid — 6 characters, 6 tiles, 14 props
```

- [ ] **Step 3: Final commit**

```bash
git add public/assets/iso/manifest.json
git commit -m "feat: complete Phase 1 asset generation manifest — 6 chars, 6 tiles, 14 props"
```

---

## Phase 1 Completion Checklist

- [ ] 6 chibi character sheets generated and saved
- [ ] 12 animations (walk + idle × 6 characters) — custom animations deferred to Phase 4
- [ ] 6 isometric floor tiles
- [ ] 5 key interactive props (server rack, kanban, desk+PC, telepad, projector)
- [ ] 9 secondary props + neon Brain sign
- [ ] `manifest.json` complete and validated (6 chars, 6 tiles, 14 props)
- [ ] All assets committed to `feat/ceo-sim-uiux-sandbox` branch
- [ ] File assertion script exits 0 (18 character frames, 6 tiles, 14 props present)
- [ ] Manifest validation script exits 0

**Next phase:** Phase 2 — Isometric Engine (replace top-down renderer with iso projection, implement depth sorting and A* pathfinding on iso grid).
