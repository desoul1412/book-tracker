/**
 * Isometric Canvas 2D renderer for the CEO-SIM pixel office.
 *
 * Coordinate system:
 *   isoX = originX + (col - row) * (TILE_W / 2)
 *   isoY = originY + (col + row) * (TILE_H / 2)
 *
 * Painter's algorithm: sort all entities by (row + col) ascending so
 * elements further from the viewer are drawn first.
 */

import type { IsoAssets, IsoDirection } from './isoAssetLoader';
import type { TileType, PropPlacement } from './isoLayout';

// ── Constants ─────────────────────────────────────────────────────────────────

export const ISO_TILE_W   = 64;   // diamond width (px)
export const ISO_TILE_H   = 32;   // diamond visible height (px, top face)
export const CHAR_SIZE    = 68;   // character sprite canvas size
export const CHAR_ANCHOR_Y = 52;  // pixels from top of char sprite to feet

// ── Projection ────────────────────────────────────────────────────────────────

export function isoProject(
  col: number, row: number,
  originX: number, originY: number
): { x: number; y: number } {
  return {
    x: originX + (col - row) * (ISO_TILE_W / 2),
    y: originY + (col + row) * (ISO_TILE_H / 2),
  };
}

export function screenToIso(
  screenX: number, screenY: number,
  originX: number, originY: number
): { col: number; row: number } {
  const dx = screenX - originX;
  const dy = screenY - originY;
  const col = (dx / (ISO_TILE_W / 2) + dy / (ISO_TILE_H / 2)) / 2;
  const row = (dy / (ISO_TILE_H / 2) - dx / (ISO_TILE_W / 2)) / 2;
  return { col: Math.floor(col), row: Math.floor(row) };
}

/** Depth key for painter's algorithm — lower = drawn first (further away) */
export function isoDepth(col: number, row: number): number {
  return col + row;
}

// ── Direction mapping (grid delta → PixelLab direction) ──────────────────────

export function deltaToDirection(dx: number, dy: number): IsoDirection {
  // dx = col delta, dy = row delta
  const angle = Math.atan2(dy, dx);
  const deg   = ((angle * 180 / Math.PI) + 360) % 360;
  // 8-way snapping: 0=E 45=SE 90=S 135=SW 180=W 225=NW 270=N 315=NE
  const octant = Math.round(deg / 45) % 8;
  const dirs: IsoDirection[] = [
    'east', 'south-east', 'south', 'south-west',
    'west', 'north-west', 'north', 'north-east',
  ];
  return dirs[octant];
}

// ── Wall rendering ────────────────────────────────────────────────────────────

const WALL_H = 90;

function renderWalls(
  ctx: CanvasRenderingContext2D,
  cols: number, rows: number,
  originX: number, originY: number,
) {
  const hw = ISO_TILE_W / 2;  // 32
  const hh = ISO_TILE_H / 2;  // 16

  // ── Back wall (NE face, along row = 0) ───────────────────────────────────────
  // Parallelogram rising above the top edge of the iso floor
  const blX = originX - hw;
  const blY = originY + hh;
  const brX = originX + (cols - 1) * hw + hw;
  const brY = originY + (cols - 1) * hh + hh;

  const bg = ctx.createLinearGradient(blX, blY - WALL_H, blX, blY);
  bg.addColorStop(0, '#192538');
  bg.addColorStop(1, '#1e2e46');
  ctx.beginPath();
  ctx.moveTo(blX, blY);
  ctx.lineTo(brX, brY);
  ctx.lineTo(brX, brY - WALL_H);
  ctx.lineTo(blX, blY - WALL_H);
  ctx.closePath();
  ctx.fillStyle = bg;
  ctx.fill();

  // Panel grid lines on back wall
  ctx.save();
  const wallW = brX - blX;
  const slope = (brY - blY) / wallW;
  ctx.strokeStyle = 'rgba(0,200,255,0.06)';
  ctx.lineWidth = 1;
  for (let dx = hw; dx < wallW; dx += hw) {
    const px = blX + dx, py = blY + dx * slope;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - WALL_H); ctx.stroke();
  }
  for (let dh = 30; dh < WALL_H; dh += 30) {
    ctx.beginPath();
    ctx.moveTo(blX, blY - dh); ctx.lineTo(brX, brY - dh); ctx.stroke();
  }
  ctx.restore();

  // ── Left wall (NW face, along col = 0, rows 0 → ROWS-2) ──────────────────────
  // Stop one row before lobby so the lobby entrance stays open
  const ltX = originX - hw;
  const ltY = originY + hh;
  const lbX = originX - (rows - 2) * hw - hw;
  const lbY = originY + (rows - 2) * hh + hh;

  const lg = ctx.createLinearGradient(ltX, ltY - WALL_H, ltX, ltY);
  lg.addColorStop(0, '#111e2c');
  lg.addColorStop(1, '#161f30');
  ctx.beginPath();
  ctx.moveTo(lbX, lbY);
  ctx.lineTo(ltX, ltY);
  ctx.lineTo(ltX, ltY - WALL_H);
  ctx.lineTo(lbX, lbY - WALL_H);
  ctx.closePath();
  ctx.fillStyle = lg;
  ctx.fill();

  // Subtle vertical lines on left wall
  ctx.save();
  ctx.strokeStyle = 'rgba(0,200,255,0.04)';
  ctx.lineWidth = 1;
  const lWall = Math.sqrt((lbX - ltX) ** 2 + (lbY - ltY) ** 2);
  const lDx = (lbX - ltX) / lWall;
  const lDy = (lbY - ltY) / lWall;
  for (let d = hw; d < lWall; d += hw) {
    const px = ltX + lDx * d, py = ltY + lDy * d;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - WALL_H); ctx.stroke();
  }
  ctx.restore();

  // ── Wall top-edge trim (where ceiling meets wall) ────────────────────────────
  ctx.save();
  ctx.strokeStyle = 'rgba(0,220,255,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(blX, blY - WALL_H); ctx.lineTo(brX, brY - WALL_H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ltX, ltY - WALL_H); ctx.lineTo(lbX, lbY - WALL_H); ctx.stroke();
  ctx.restore();
}

// ── Tile rendering ────────────────────────────────────────────────────────────

const TILE_FALLBACK_COLORS: Record<TileType, string> = {
  'floor-tech':    '#0d1a2e',
  'floor-server':  '#141f14',
  'floor-meeting': '#1a1a2e',
  'floor-ceo':     '#1a1408',
  'floor-kitchen': '#1a1e1a',
  'floor-lobby':   '#0d1a2e',
  'void':          'transparent',
};

export function renderIsoTiles(
  ctx: CanvasRenderingContext2D,
  cols: number, rows: number,
  tileGrid: TileType[],
  assets: IsoAssets,
  originX: number, originY: number
) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const type = tileGrid[row * cols + col];
      if (type === 'void') continue;

      const { x, y } = isoProject(col, row, originX, originY);
      const drawX = Math.round(x - ISO_TILE_W / 2);
      const drawY = Math.round(y);

      const img = assets.tiles.get(type);
      if (img) {
        ctx.drawImage(img, drawX, drawY, ISO_TILE_W, ISO_TILE_W); // 64×64 tile
      } else {
        // Fallback: draw diamond shape
        const fb = TILE_FALLBACK_COLORS[type];
        ctx.fillStyle = fb;
        ctx.beginPath();
        ctx.moveTo(x,                    y);
        ctx.lineTo(x + ISO_TILE_W / 2,  y + ISO_TILE_H / 2);
        ctx.lineTo(x,                    y + ISO_TILE_H);
        ctx.lineTo(x - ISO_TILE_W / 2,  y + ISO_TILE_H / 2);
        ctx.closePath();
        ctx.fill();
        // Grid outline
        ctx.strokeStyle = 'rgba(0,255,255,0.08)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
}

// ── Prop rendering ────────────────────────────────────────────────────────────

export function renderProp(
  ctx: CanvasRenderingContext2D,
  prop: PropPlacement,
  assets: IsoAssets,
  originX: number, originY: number,
  hover = false,
) {
  const img = assets.props.get(prop.prop);
  const { x, y } = isoProject(prop.col, prop.row, originX, originY);

  // Anchor: bottom-center of prop image sits at tile's bottom apex
  const anchorX = x;
  const anchorY = y + ISO_TILE_H; // bottom of the tile diamond

  if (!img) {
    // Placeholder box
    ctx.fillStyle = 'rgba(0,255,255,0.15)';
    ctx.fillRect(anchorX - 24, anchorY - 48, 48, 48);
    return;
  }

  const drawX = Math.round(anchorX - img.width / 2);
  const drawY = Math.round(anchorY - img.height);

  if (hover) {
    ctx.save();
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur  = 12;
  }

  ctx.drawImage(img, drawX, drawY);

  if (hover) ctx.restore();
}

// ── Character rendering ───────────────────────────────────────────────────────

export interface CharRenderState {
  id:          string;
  role:        string;
  isoX:        number;   // world X in iso-projected pixels
  isoY:        number;   // world Y in iso-projected pixels
  direction:   IsoDirection;
  animName:    string;   // 'idle' | 'walk' | 'drinking'
  frameIndex:  number;
  isWalking:   boolean;
  label:       string;
  labelColor:  string;
  speechBubble: string | null;
  heartbeat:   'alive' | 'stale' | 'dead';
  alertIcon?:  '!' | '?' | '~' | null;
}

export function renderCharacter(
  ctx: CanvasRenderingContext2D,
  char: CharRenderState,
  assets: IsoAssets,
) {
  const charAsset = assets.characters.get(char.role);
  const drawX = Math.round(char.isoX - CHAR_SIZE / 2);
  const drawY = Math.round(char.isoY - CHAR_ANCHOR_Y);

  if (charAsset) {
    // Try animation frame first, fall back to rotation still
    const animDirs = charAsset.animations[char.animName];
    const frames   = animDirs?.[char.direction];
    const img      = frames
      ? frames[char.frameIndex % frames.length]
      : (charAsset.rotations[char.direction] ?? charAsset.rotations['south']);

    if (img) {
      ctx.drawImage(img, drawX, drawY);
    } else {
      drawCharPlaceholder(ctx, char.isoX, char.isoY, char.labelColor);
    }
  } else {
    drawCharPlaceholder(ctx, char.isoX, char.isoY, char.labelColor);
  }

  // Role label
  ctx.save();
  ctx.font         = 'bold 7px monospace';
  ctx.textAlign    = 'center';
  ctx.fillStyle    = char.labelColor;
  ctx.shadowColor  = char.labelColor;
  ctx.shadowBlur   = 4;
  ctx.fillText(char.label, char.isoX, drawY - 4);
  ctx.restore();

  // Status dot
  renderStatusDot(ctx, char);
}

function drawCharPlaceholder(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, color: string
) {
  ctx.fillStyle = color + '88';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(cx - 6, cy - 24, 12, 20);
}

function renderStatusDot(ctx: CanvasRenderingContext2D, char: CharRenderState) {
  const colors = {
    alive: '#00ff88', stale: '#ff8800', dead: '#ff2244',
  };
  const color = colors[char.heartbeat] ?? '#4a5568';
  ctx.save();
  ctx.fillStyle    = color;
  ctx.shadowColor  = color;
  ctx.shadowBlur   = char.heartbeat === 'alive' ? 4 : 2;
  ctx.beginPath();
  ctx.arc(char.isoX + 10, char.isoY - CHAR_ANCHOR_Y, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Speech bubbles ────────────────────────────────────────────────────────────

export function renderSpeechBubble(
  ctx: CanvasRenderingContext2D, char: CharRenderState
) {
  if (!char.speechBubble) return;

  const text = char.speechBubble.length > 18
    ? char.speechBubble.slice(0, 16) + '..'
    : char.speechBubble;

  ctx.save();
  ctx.font        = '7px monospace';
  ctx.shadowBlur  = 0;
  ctx.shadowColor = 'transparent';

  const metrics = ctx.measureText(text);
  const bw = Math.ceil(metrics.width) + 8;
  const bh = 11;
  const bx = Math.round(char.isoX - bw / 2);
  const by = Math.round(char.isoY - CHAR_ANCHOR_Y - bh - 8);

  ctx.fillStyle   = '#050810';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth   = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  ctx.fillStyle   = '#e0eaf4';
  ctx.textAlign   = 'center';
  ctx.fillText(text, char.isoX, by + 8);
  ctx.restore();
}

// ── Alert icons ───────────────────────────────────────────────────────────────

const ALERT_COLORS = {
  '!': { glow: '#ff2244', bg: '#1a0005', text: '#ff2244' },
  '?': { glow: '#ff8800', bg: '#1a0800', text: '#ff8800' },
  '~': { glow: '#ffcc00', bg: '#1a1400', text: '#ffcc00' },
} as const;

export function renderAlertIcon(
  ctx: CanvasRenderingContext2D,
  char: CharRenderState,
  frameCount: number,
) {
  if (!char.alertIcon) return;
  const pal = ALERT_COLORS[char.alertIcon as keyof typeof ALERT_COLORS] ?? ALERT_COLORS['!'];
  const bounce = Math.sin(frameCount * 0.12) * 3;
  const ix = Math.round(char.isoX);
  const iy = Math.round(char.isoY - CHAR_ANCHOR_Y - 20 + bounce);

  ctx.save();
  ctx.shadowColor = pal.glow;
  ctx.shadowBlur  = 6;
  ctx.fillStyle   = pal.bg;
  ctx.fillRect(ix - 5, iy - 6, 10, 12);
  ctx.strokeStyle = pal.glow;
  ctx.lineWidth   = 1;
  ctx.strokeRect(ix - 4.5, iy - 5.5, 9, 11);
  ctx.shadowBlur  = 0;
  ctx.font        = 'bold 9px monospace';
  ctx.fillStyle   = pal.text;
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char.alertIcon, ix, iy + 1);
  ctx.restore();
}

// ── Neon glow for "The Brain" sign ────────────────────────────────────────────

export function renderNeonGlow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  frameCount: number,
) {
  const pulse = 0.6 + 0.4 * Math.sin(frameCount * 0.05);
  ctx.save();
  ctx.shadowColor = `rgba(0,255,255,${pulse})`;
  ctx.shadowBlur  = 20 * pulse;
  ctx.strokeStyle = `rgba(0,255,255,${0.4 * pulse})`;
  ctx.lineWidth   = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

// ── CRT post-processing ───────────────────────────────────────────────────────

export function renderCRT(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  _frameCount: number,
) {
  ctx.save();

  // Scanlines
  ctx.globalAlpha = 0.06;
  ctx.fillStyle   = '#000000';
  for (let y = 0; y < h; y += 2) {
    ctx.fillRect(0, y, w, 1);
  }

  // Vignette
  ctx.globalAlpha = 1;
  const gradient  = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();
}

// ── Full frame render ─────────────────────────────────────────────────────────

export interface IsoRenderParams {
  cols:       number;
  rows:       number;
  tileGrid:   TileType[];
  props:      PropPlacement[];
  characters: CharRenderState[];
  assets:     IsoAssets;
  originX:    number;
  originY:    number;
  hoverProp?: string;      // key of hovered prop
  frameCount: number;
}

export function renderIsoFrame(
  ctx: CanvasRenderingContext2D,
  p: IsoRenderParams,
) {
  const { cols, rows, tileGrid, props, characters, assets, originX, originY, frameCount } = p;

  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = '#05080f';
  ctx.fillRect(0, 0, w, h);

  // ── Walls (rendered before floor so floor tiles sit on top of wall base) ─────
  renderWalls(ctx, cols, rows, originX, originY);

  // ── Floor tiles ─────────────────────────────────────────────────────────────
  renderIsoTiles(ctx, cols, rows, tileGrid, assets, originX, originY);

  // ── Depth-sorted entities (props + characters) ───────────────────────────────
  type Entity =
    | { kind: 'prop';  depth: number; data: PropPlacement }
    | { kind: 'char';  depth: number; data: CharRenderState };

  const entities: Entity[] = [
    ...props.map(pr => ({
      kind: 'prop' as const,
      depth: isoDepth(pr.col, pr.row) + (pr.zOffset ?? 0),
      data: pr,
    })),
    ...characters.map(ch => {
      // Convert world iso coords back to approx col/row for depth sorting
      const col = (ch.isoX / (ISO_TILE_W / 2) + ch.isoY / (ISO_TILE_H / 2)) / 2;
      const row = (ch.isoY / (ISO_TILE_H / 2) - ch.isoX / (ISO_TILE_W / 2)) / 2;
      return { kind: 'char' as const, depth: col + row, data: ch };
    }),
  ];

  entities.sort((a, b) => a.depth - b.depth);

  for (const e of entities) {
    if (e.kind === 'prop') {
      const isHover = e.data.key === p.hoverProp;
      renderProp(ctx, e.data, assets, originX, originY, isHover);

      // Neon glow on "The Brain" sign
      if (e.data.prop === 'neon-sign-brain') {
        const { x, y } = isoProject(e.data.col, e.data.row, originX, originY);
        renderNeonGlow(ctx, x - 64, y - 20, 128, 40, frameCount);
      }
    } else {
      renderCharacter(ctx, e.data, assets);
    }
  }

  // ── Speech bubbles + alert icons (always on top) ────────────────────────────
  for (const ch of characters) {
    renderSpeechBubble(ctx, ch);
    renderAlertIcon(ctx, ch, frameCount);
  }

  // ── CRT post-processing ──────────────────────────────────────────────────────
  renderCRT(ctx, w, h, frameCount);
}
