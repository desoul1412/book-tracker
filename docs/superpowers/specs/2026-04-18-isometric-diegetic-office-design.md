# Isometric Diegetic Pixel Office — Design Spec

**Date:** 2026-04-18
**Status:** Approved for implementation
**Branch:** `feat/ceo-sim-uiux-sandbox`

---

## 1. Summary

Build a fully interactive isometric pixel-art office for CEO-SIM where **all navigation is diegetic** — users click physical objects in the game world (server racks, whiteboards, agents) instead of using a navbar. Characters are **chibi-style pixel art** generated via PixelLab MCP. The office matches the cyberpunk war-room aesthetic from the reference image.

**Key decisions:**
- **Isometric perspective** (not top-down) — matches reference image, enables richer visual depth
- **Diegetic UI** — no navbar, all interaction through clickable in-world objects
- **PixelLab MCP** for asset generation — chibi characters, isometric tiles, map objects
- **"The Brain" neon sign** — smaller, positioned on top of server racks (not on door)

---

## 2. Architecture: Isometric Engine

### 2.1 Coordinate System

Replace the current top-down renderer with isometric projection:

```
Screen X = (tileCol - tileRow) * (TILE_WIDTH / 2)
Screen Y = (tileCol + tileRow) * (TILE_HEIGHT / 2)
```

- **Tile size:** 64x32 isometric diamond (or 32x16 for smaller maps)
- **Character size:** 48px chibi sprites from PixelLab (8 directional views)
- **Canvas:** Full-screen background layer, CSS `imageRendering: pixelated`

### 2.2 Rendering Pipeline (New)

```
requestAnimationFrame loop
  |
  +- syncAgents(employees)
  +- updateAnimations(dt)
  +- updateParticles(dt)
  |
  +- renderFrame(ctx, isoLayout, agents, assets, frameCount)
       |
       +- ctx.clearRect + fillRect('#05080f')
       +- renderIsoTiles(ctx, layout, assets)      <-- isometric floor tiles
       +- renderWalls(ctx, layout, assets)          <-- back walls first (painter's)
       +- [sort all entities by isoDepth (row + col)]
       |    +- renderFurniture(ctx, item, assets)   <-- desks, servers, plants
       |    +- renderCharacter(ctx, agent, assets)   <-- chibi sprites
       +- renderFloatingIcons(ctx, agents)           <-- state icons above heads
       +- renderSpeechBubbles(ctx, agents)
       +- renderParticles(ctx, particles)
       +- renderNeonSigns(ctx, signs, frameCount)    <-- "The Brain" glow effect
       +- renderPostProcess(ctx, w, h, frameCount)   <-- CRT scanlines + vignette
```

### 2.3 Hit Detection for Isometric

Click detection requires reverse-projecting screen coords to iso tile coords:

```typescript
function screenToIso(screenX: number, screenY: number): { col: number, row: number } {
  const col = (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2;
  const row = (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2;
  return { col: Math.floor(col), row: Math.floor(row) };
}
```

Interactive objects define **hit zones** (bounding boxes in screen space) checked on click/hover:
- Furniture hit zones: defined per object type with pixel-accurate bounds
- Character hit zones: sprite bounding box (48x48 centered on iso position)
- Hover: cursor changes to pointer, object gets highlight glow
- Click: triggers associated action (open modal, navigate, show context menu)

---

## 3. Interactive Hotspot Map

Every clickable object in the office maps to an app feature:

| Object | Location in Office | Click Action | Hover Effect |
|--------|-------------------|--------------|--------------|
| **War Room Projector** | Meeting room area | Opens Project Goals modal | Cyan glow border |
| **Kanban Whiteboard** | Central wall (Dev room) | Opens Kanban Board (drag-drop) | Shakes slightly / border lights |
| **QA Terminal** | Secluded desk, red/orange screen | Opens MR/PR review list | Siren flash if pending MRs |
| **Server Rack "The Brain"** | Tech room, small neon sign ON TOP | Opens document library / wiki | LEDs flash green, sign pulses |
| **Heart Icon / Accountant** | Wall-mounted near entrance | Opens Org Chart + Budget view | Pulse animation |
| **Clipboard** | Top-right area | Opens task backlog view | Subtle bounce |
| **Recruitment Telepad** | Door/entrance area | Opens agent hiring dialog | Ring shimmer intensifies |
| **CEO Agent** | CEO desk | Opens CEO Directive / talk to CEO | Gold highlight aura |
| **Other Agents** | Their assigned desks | Opens agent context card (name, role, task, config, fire) | Highlight + pointer cursor |
| **Agent Desks/PCs** | Throughout office | Shows current task detail for that agent | Monitor glow brightens |

### 3.1 Modal System

All modals share consistent styling:
- **Background:** Office dims/blurs (rgba overlay)
- **Modal:** Dark terminal style (#05080f), neon border (cyan/purple)
- **Font:** Monospace pixel-style
- **Close:** ESC key or click outside
- **Animation:** Scale 0->1 bounce-in, blur->focus transition

---

## 4. Office Layout (Isometric)

Based on reference image, adapted for interactive zones:

```
+---------------------------------------------------+
|                    BACK WALL                        |
|  [TODO] [IN PROGRESS] [DONE]    [Server Racks]    |
|  (Kanban Whiteboard)            ["The Brain" sign] |
|                                  (small, on top)   |
|  [Desk][PC] [Desk][PC]    [Kitchen/Coffee area]   |
|  (Frontend)  (Backend)                              |
|                           [Bookshelf] [Vending]    |
|  [Desk][PC] [Desk][PC]                             |
|  (QA)       (DevOps)      [Steps up to Brain room] |
|                                                     |
|  [Whiteboard]              [Server Room / Brain]   |
|  (Sprint Overview)         [Rack] [Rack] [Rack]    |
|                            [Console] [Monitors]    |
|  [Meeting Area]                                     |
|  [Projector Screen]        [Stairs down]           |
|  [Chairs in semicircle]                             |
|                                                     |
|  [CEO Desk]  [Plants]     [Reception / Telepad]   |
|                            [Heart/Org display]     |
|  [PM Desk]   [Sofa/Break] [Door/Entrance]         |
+---------------------------------------------------+
```

### 4.1 Room Zones

| Zone | Floor Style | Purpose | Key Objects |
|------|-------------|---------|-------------|
| Dev Room | Dark tech tiles, blue accent | Where agents code | Desks, PCs, Kanban board |
| Server Room "The Brain" | Metal grating, green glow | Docs/RAG access | Server racks, console, neon sign |
| Meeting Room | Checkered floor | Goals/planning | Projector, semicircle chairs |
| CEO Office | Premium dark floor | CEO desk, directives | CEO desk, plant, monitors |
| Kitchen/Break | Lighter tiles | Agent breaks | Coffee machine, vending, sofa |
| Lobby/Entrance | Entry tiles | Hiring, org chart | Telepad, heart display, door |

---

## 5. PixelLab MCP Asset Generation Plan

### 5.1 Characters (Chibi Style)

Generate 6+ characters using `create_character` with chibi proportions:

```
CEO:      "chibi pixel art CEO in dark suit with gold tie, confident posture, cyberpunk office style"
PM:       "chibi pixel art project manager with clipboard and headset, smart casual, cyberpunk style"
Frontend: "chibi pixel art frontend developer with hoodie and cyan headphones, cyberpunk style"
Backend:  "chibi pixel art backend developer with dark hoodie and green terminal glasses, cyberpunk style"
DevOps:   "chibi pixel art devops engineer with utility vest and red visor, cyberpunk style"
QA:       "chibi pixel art QA tester with tablet and orange-tinted glasses, cyberpunk style"
```

Parameters:
- `proportions`: `{"type": "preset", "name": "chibi"}`
- `n_directions`: 8 (for isometric movement)
- `size`: 48 (pixels)
- `view`: `"low top-down"` (isometric compatible)

Animations per character (via `animate_character`):
- `walking` — 8-directional walk cycle
- `idle` — breathing/fidget loop
- Custom: `typing`, `pointing`, `carrying_box`, `drinking_coffee`

### 5.2 Isometric Tiles

Generate floor tiles using `create_isometric_tile`:

```
Dark tech floor:    "dark cyberpunk office floor tile with subtle circuit board pattern, dark blue"
Server room floor:  "metal grating floor tile with green LED underglow, cyberpunk server room"
Meeting room floor: "dark checkered floor tile, black and dark grey, office meeting room"
CEO office floor:   "premium dark floor tile with gold accent line, executive office"
Kitchen floor:      "lighter grey tile with subtle pattern, office kitchen breakroom"
Lobby floor:        "dark entry floor tile with glowing blue guide lines, cyberpunk lobby"
```

Parameters:
- `size`: 32 or 64
- `tile_shape`: `"thin"` for floors
- `outline`: `"lineless"` for modern look

### 5.3 Map Objects (Furniture & Props)

Generate interactive props using `create_map_object`:

```
Server rack:        "pixel art server rack with blinking LED lights, cyberpunk style, dark metal, green/blue lights"
Kanban whiteboard:  "pixel art kanban board with colored sticky notes (red yellow green blue), wall-mounted, office"
Desk with PC:       "pixel art office desk with dual monitors showing code, cyberpunk, dark theme"
Coffee machine:     "pixel art office coffee machine with steam, modern, dark kitchen"
Projector screen:   "pixel art wall projector screen showing charts, meeting room, retracted"
Telepad:            "pixel art circular teleportation platform with cyan energy rings, sci-fi"
Neon sign Brain:    "small pixel art neon sign reading 'The Brain' in cyan glow, compact, wall-mounted"
Sofa:               "pixel art dark office sofa, cyberpunk lounge, purple accent"
Bookshelf:          "pixel art bookshelf with books and tech manuals, dark office"
Plant:              "pixel art office desk plant, small succulent in geometric pot"
QA terminal:        "pixel art computer terminal with red/orange screen and warning siren light"
Vending machine:    "pixel art vending machine with neon display, cyberpunk office"
Clipboard display:  "pixel art wall-mounted clipboard with task checklist, glowing border"
Heart display:      "pixel art LED heart icon display showing org status, wall-mounted, red glow"
```

Parameters:
- `view`: `"low top-down"` (isometric perspective)
- `outline`: `"single color outline"` for clarity
- `detail`: `"medium detail"` or `"high detail"` for key objects

### 5.4 Token Budget

3 API tokens available (40 credits each = 120 credits total):
- Token 1: `5f022ee5-b728-453d-8e6d-ca29b688a8d9` (active)
- Token 2: `a1492141-93b0-429f-897c-ffa03a7214fb` (standby)
- Token 3: `ea741d04-fedf-4f53-98f5-3e9013a10024` (standby)

**Priority order for generation:**
1. Characters (6 chibi agents) — ~6 credits
2. Character animations (walk + idle each) — ~12 credits
3. Floor tiles (6 types) — ~6 credits
4. Key interactive props (server, board, desk, telepad, projector) — ~5 credits
5. Secondary props (coffee machine, sofa, plants, etc.) — ~5 credits
6. Neon sign "The Brain" — ~1 credit
7. Remaining: additional animations and variant props

Rotate tokens when credits deplete. Update `.mcp.json` header to switch.

---

## 6. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Renderer | Browser Canvas 2D (isometric projection) | No WebGL for Tauri compat |
| Game loop | `requestAnimationFrame` with `dt` | Single RAF callback |
| Pathfinding | A* on isometric grid | Upgrade from BFS for iso support |
| Assets | PixelLab-generated PNGs + JSON layout | Generated via MCP |
| Scaling | Integer 2x render, CSS contain-fit | `imageRendering: pixelated` |
| Types | TypeScript strict | Extended types for iso coords |
| Framework | React 19 + Zustand | Hook lifecycle, minimal state |
| Hit detection | Reverse iso projection + bounding boxes | Per-object hit zones |
| Modals | React portals, absolute positioned | Terminal/neon theme |

---

## 7. Implementation Phases

### Phase 1: Asset Generation (PixelLab MCP)
- Generate all chibi characters (6 roles)
- Generate walk + idle animations
- Generate isometric floor tiles (6 zone types)
- Generate key interactive props

### Phase 2: Isometric Engine
- Replace top-down renderer with isometric projection
- Implement iso coordinate system + depth sorting
- Implement reverse projection for hit detection
- Port pathfinding to isometric grid (A*)

### Phase 3: Interactive Hotspots
- Define hit zones for all interactive objects
- Implement hover effects (glow, cursor change)
- Implement click handlers (modal open, navigation)
- Build modal system (terminal/neon themed)

### Phase 4: Agent Animation System
- Implement state machine for agent animations
- Wire floating icons to agent states
- Implement agent context menu (click on agent)
- Basic idle + working + walking animations

### Phase 5: Environment Polish
- CRT scanlines + vignette post-process
- Neon sign glow animation ("The Brain")
- Particle system (code particles from working agents)
- Ambient props (coffee machine steam, server LEDs, plant sway)

### Phase 6: Event-Driven Sequences
- CEO Directive → agent choreography
- Hire sequence (telepad animation)
- Fire sequence (packing box animation)
- Sprint complete (confetti + celebration)

---

## 8. Design Constraints

- **CANVAS-AS-VIEW INVARIANT:** PixelOfficeCanvas reads from `company` prop only. Zero API calls inside the component.
- **Single RAF loop:** Exactly one `requestAnimationFrame` callback.
- **Performance budget:** <=30 particles, <=20 ctx.save/restore, <=16ms frame budget.
- **No WebGL:** Canvas 2D only for Tauri WebView2 compatibility.
- **Modular exports:** All sandbox code must be portable to `ceo-simulator` without sandbox-specific imports.

---

## 9. Reference Documents

- [pixel-office-uiux-spec.md](../../brain/wiki/pixel-office-uiux-spec.md) — Original 10-task UIUX spec
- [diegetic-ui-blueprint.md](../../brain/wiki/diegetic-ui-blueprint.md) — Diegetic UI philosophy + interactive prop map
- [animation-interaction-bible.md](../../brain/wiki/animation-interaction-bible.md) — Complete animation specs for all agent states and sequences
- Reference image: Isometric cyberpunk office with "The Brain" neon, workstations, server room, Kanban boards

---

*Spec consolidated 2026-04-18. Ready for implementation planning after PixelLab MCP is connected.*
