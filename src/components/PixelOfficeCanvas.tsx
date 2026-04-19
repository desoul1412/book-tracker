import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { loadIsoAssets, type IsoAssets, type IsoDirection } from '../engine/isoAssetLoader';
import {
  renderIsoFrame,
  isoProject,
  screenToIso,
  deltaToDirection,
  ISO_TILE_W, ISO_TILE_H,
  type CharRenderState,
} from '../engine/isoRenderer';
import { buildIsoLayout, type IsoOfficeLayout } from '../engine/isoLayout';
import { bfsPath, type WalkableGrid } from '../engine/pathfinding';
// ── Sandbox types (full CEO-SIM types live in dashboardStore) ─────────────────
interface Employee {
  id:             string;
  role:           string;
  status:         'working' | 'meeting' | 'break' | 'idle';
  color?:         string;
  assignedTask?:  string;
  activityDetail?: string;
  alertIcon?:     '!' | '?' | '~' | null;
}
interface Company {
  employees: Employee[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const NATIVE_W    = 1000;
const NATIVE_H    = 580;
const WALK_SPEED  = 2.5;   // tiles per second
const ANIM_FPS    = 8;     // animation frames per second (per direction sprite)

// ── Role → character key mapping ─────────────────────────────────────────────

const ROLE_CHAR: Record<string, string> = {
  CEO:        'ceo',
  CTO:        'cto',
  PM:         'pm',
  Designer:   'designer',
  Frontend:   'frontend',
  Backend:    'backend',
  DevOps:     'devops',
  QA:         'qa',
  Researcher: 'researcher',
};

const ROLE_COLORS: Record<string, string> = {
  CEO:        '#ffd700',
  CTO:        '#c0c0ff',
  PM:         '#ff9944',
  Designer:   '#ff55ff',
  Frontend:   '#00ffff',
  Backend:    '#00ff88',
  DevOps:     '#ff4444',
  QA:         '#ff8844',
  Researcher: '#88ddff',
};

const BREAK_COLS = [7, 8, 9];   // bar stool area
const BREAK_ROW  = 3;           // just south of the counter stools

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Agent internal state ──────────────────────────────────────────────────────

interface AgentState {
  id:            string;
  role:          string;
  charKey:       string;
  tileCol:       number;
  tileRow:       number;
  fracCol:       number;   // sub-tile fractional position (for smooth motion)
  fracRow:       number;
  targetCol:     number;
  targetRow:     number;
  path:          [number, number][];
  pathIdx:       number;
  direction:     IsoDirection;
  animName:      string;
  frameIndex:    number;
  frameTick:     number;
  isWalking:     boolean;
  label:         string;
  labelColor:    string;
  speechBubble:  string | null;
  heartbeat:     'alive' | 'stale' | 'dead';
  lastHeartbeat: number;
  alertIcon?:    '!' | '?' | '~' | null;
}

// ── Iso origin (where tile 0,0 is drawn on screen) ───────────────────────────

function computeOrigin(layout: IsoOfficeLayout) {
  // Center the iso grid horizontally; originY must clear 128px props at row 0
  const originX = NATIVE_W / 2 - ((layout.cols - layout.rows) * ISO_TILE_W) / 4;
  const originY = 120;
  return { originX, originY };
}

// ── Build WalkableGrid (2D) from flat boolean array ───────────────────────────

function buildWalkable2D(layout: IsoOfficeLayout): WalkableGrid {
  const grid: WalkableGrid = [];
  for (let r = 0; r < layout.rows; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < layout.cols; c++) {
      row.push(layout.walkable[r * layout.cols + c]);
    }
    grid.push(row);
  }
  return grid;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PixelOfficeCanvasProps {
  company: Company;
}

export function PixelOfficeCanvas({ company }: PixelOfficeCanvasProps) {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const [assets, setAssets]   = useState<IsoAssets | null>(null);
  const [layout, setLayout]   = useState<IsoOfficeLayout | null>(null);
  const walkableRef    = useRef<WalkableGrid | null>(null);
  const agentsRef      = useRef<Map<string, AgentState>>(new Map());
  const companyRef     = useRef(company);
  const frameCountRef  = useRef(0);
  const hoverPropRef   = useRef<string | undefined>(undefined);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  companyRef.current = company;

  // ── Load assets + layout ────────────────────────────────────────────────────
  useEffect(() => {
    const isoLayout = buildIsoLayout();
    setLayout(isoLayout);
    walkableRef.current = buildWalkable2D(isoLayout);
    loadIsoAssets().then(setAssets);
  }, []);

  // ── Sync employees → agent states ───────────────────────────────────────────
  const syncAgents = useCallback((employees: Employee[], isoLayout: IsoOfficeLayout) => {
    const map  = agentsRef.current;
    const grid = walkableRef.current;

    for (const emp of employees) {
      let agent = map.get(emp.id);

      if (!agent) {
        const seat = isoLayout.seats.find(s => s.role === emp.role)
          ?? { col: 5, row: 5 };
        const charKey = ROLE_CHAR[emp.role] ?? 'ceo';
        agent = {
          id:            emp.id,
          role:          emp.role,
          charKey,
          tileCol:       seat.col,
          tileRow:       seat.row,
          fracCol:       seat.col,
          fracRow:       seat.row,
          targetCol:     seat.col,
          targetRow:     seat.row,
          path:          [],
          pathIdx:       0,
          direction:     'north',  // face toward desk monitor on spawn
          animName:      'idle',
          frameIndex:    0,
          frameTick:     0,
          isWalking:     false,
          label:         emp.role,
          labelColor:    emp.color ?? ROLE_COLORS[emp.role] ?? '#ffffff',
          speechBubble:  null,
          heartbeat:     'alive',
          lastHeartbeat: performance.now(),
        };
        map.set(emp.id, agent);
      }

      // Determine target tile from employee status
      let targetPos: { col: number; row: number };
      switch (emp.status) {
        case 'working':
          targetPos = isoLayout.seats.find(s => s.role === emp.role)
            ?? { col: agent!.tileCol, row: agent!.tileRow };
          agent.speechBubble = emp.activityDetail
            ? emp.activityDetail.slice(0, 20)
            : (emp.assignedTask?.slice(0, 20) ?? 'Working…');
          agent.animName = 'idle';
          break;
        case 'meeting':
          targetPos  = { col: 7, row: 5 }; // sofa area (informal meeting spot)
          agent.speechBubble = 'In meeting';
          agent.animName = 'idle';
          break;
        case 'break':
          if (!agent.isWalking && agent.tileCol === agent.targetCol && agent.tileRow === agent.targetRow) {
            targetPos = { col: pickRandom(BREAK_COLS), row: BREAK_ROW };
          } else {
            targetPos = { col: agent.targetCol, row: agent.targetRow };
          }
          agent.speechBubble = 'On break';
          agent.animName = 'drinking';
          break;
        default:
          if (!agent.isWalking && agent.tileCol === agent.targetCol && agent.tileRow === agent.targetRow) {
            if (Math.random() < 1 / 180) {
              targetPos = { col: pickRandom(BREAK_COLS), row: BREAK_ROW };
            } else {
              targetPos = { col: agent.targetCol, row: agent.targetRow };
            }
          } else {
            targetPos = { col: agent.targetCol, row: agent.targetRow };
          }
          agent.speechBubble = null;
          agent.animName = 'idle';
          break;
      }

      // Heartbeat
      const now = performance.now();
      if (emp.status === 'working' || emp.status === 'meeting') {
        agent.heartbeat = 'alive';
        agent.lastHeartbeat = now;
      } else if (emp.status === 'break') {
        agent.heartbeat = (now - agent.lastHeartbeat > 15_000) ? 'stale' : 'alive';
      } else {
        agent.heartbeat = (now - agent.lastHeartbeat > 30_000) ? 'dead'
          : (now - agent.lastHeartbeat > 10_000) ? 'stale' : 'alive';
      }

      agent.alertIcon = emp.alertIcon ?? null;

      // Recompute path if target changed
      if (grid && (targetPos.col !== agent.targetCol || targetPos.row !== agent.targetRow)) {
        agent.targetCol = targetPos.col;
        agent.targetRow = targetPos.row;
        const newPath = bfsPath(
          grid,
          [agent.tileCol, agent.tileRow],
          [targetPos.col, targetPos.row]
        );
        if (newPath.length > 1) {
          agent.path    = newPath;
          agent.pathIdx = 0;
          agent.isWalking = true;
        }
      }
    }
  }, []);

  // ── Game loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!assets || !layout) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const { originX, originY } = computeOrigin(layout);
    let lastTime = performance.now();
    let rafId: number;

    function loop(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      syncAgents(companyRef.current.employees, layout!);

      // ── Update agent positions ─────────────────────────────────────────────
      for (const agent of agentsRef.current.values()) {
        if (agent.isWalking && agent.path.length > 0) {
          const [tc, tr] = agent.path[agent.pathIdx];
          const dc = tc - agent.fracCol;
          const dr = tr - agent.fracRow;
          const dist = Math.sqrt(dc * dc + dr * dr);

          if (dist < 0.05) {
            agent.fracCol = tc;
            agent.fracRow = tr;
            agent.tileCol = tc;
            agent.tileRow = tr;
            agent.pathIdx++;

            if (agent.pathIdx >= agent.path.length) {
              agent.isWalking = false;
              agent.path      = [];
              agent.pathIdx   = 0;
            }
          } else {
            const speed = WALK_SPEED * dt;
            const move  = Math.min(speed, dist);
            agent.fracCol += (dc / dist) * move;
            agent.fracRow += (dr / dist) * move;
            agent.direction = deltaToDirection(dc, dr);
            agent.animName  = 'walk';
          }

          // Animate frames
          agent.frameTick += dt;
          if (agent.frameTick >= 1 / ANIM_FPS) {
            agent.frameTick  = 0;
            agent.frameIndex = (agent.frameIndex + 1) % 8;
          }
        } else {
          if (agent.animName === 'walk') agent.animName = 'idle';
        }
      }

      // ── Build character render states ──────────────────────────────────────
      const charStates: CharRenderState[] = [];
      for (const agent of agentsRef.current.values()) {
        const iso = isoProject(agent.fracCol, agent.fracRow, originX, originY);
        charStates.push({
          id:           agent.id,
          role:         agent.charKey,
          isoX:         iso.x,
          isoY:         iso.y + ISO_TILE_H / 2,  // center on tile
          direction:    agent.direction,
          animName:     agent.animName,
          frameIndex:   agent.frameIndex,
          isWalking:    agent.isWalking,
          label:        agent.label,
          labelColor:   agent.labelColor,
          speechBubble: agent.speechBubble,
          heartbeat:    agent.heartbeat,
          alertIcon:    agent.alertIcon ?? null,
        });
      }

      frameCountRef.current++;
      ctx!.imageSmoothingEnabled = false;

      renderIsoFrame(ctx!, {
        cols:       layout!.cols,
        rows:       layout!.rows,
        tileGrid:   layout!.tileGrid,
        props:      layout!.props,
        characters: charStates,
        assets:     assets!,
        originX,
        originY,
        hoverProp:  hoverPropRef.current,
        frameCount: frameCountRef.current,
      });

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [assets, layout, syncAgents]);

  // ── Hover detection ─────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!layout || !canvasRef.current) return;
    const rect     = canvasRef.current.getBoundingClientRect();
    const scaleX   = NATIVE_W / rect.width;
    const scaleY   = NATIVE_H / rect.height;
    const mouseX   = (e.clientX - rect.left) * scaleX;
    const mouseY   = (e.clientY - rect.top)  * scaleY;
    const { originX, originY } = computeOrigin(layout);
    const { col, row } = screenToIso(mouseX, mouseY, originX, originY);

    const hit = layout.props.find(p =>
      p.hotspot && Math.abs(p.col - col) <= 1 && Math.abs(p.row - row) <= 1
    );
    hoverPropRef.current = hit?.key;
    if (canvasRef.current)
      canvasRef.current.style.cursor = hit ? 'pointer' : 'default';
  }, [layout]);

  // ── Click detection ─────────────────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!layout || !canvasRef.current) return;
    const rect   = canvasRef.current.getBoundingClientRect();
    const scaleX = NATIVE_W / rect.width;
    const scaleY = NATIVE_H / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top)  * scaleY;
    const { originX, originY } = computeOrigin(layout);
    const { col, row } = screenToIso(mouseX, mouseY, originX, originY);

    const hit = layout.props.find(p =>
      p.hotspot && Math.abs(p.col - col) <= 1 && Math.abs(p.row - row) <= 1
    );
    if (hit?.hotspot) {
      // Dispatch hotspot action (extend here to open modals, etc.)
      console.info('[office] hotspot clicked:', hit.hotspot);
    }
  }, [layout]);

  // ── Responsive container ────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const displaySize = useMemo(() => {
    if (containerSize.w === 0) return { w: NATIVE_W, h: NATIVE_H };
    const sx = containerSize.w / NATIVE_W;
    const sy = containerSize.h / NATIVE_H;
    const s  = Math.min(sx, sy);
    return { w: Math.round(NATIVE_W * s), h: Math.round(NATIVE_H * s) };
  }, [containerSize]);

  if (!layout) {
    return (
      <div ref={containerRef} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100%',
        color: '#2a3a50', fontFamily: 'monospace', fontSize: '12px',
      }}>
        Loading office…
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', background: '#05080f',
    }}>
      <canvas
        ref={canvasRef}
        width={NATIVE_W}
        height={NATIVE_H}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{
          width: displaySize.w,
          height: displaySize.h,
          imageRendering: 'pixelated',
          display: 'block',
        }}
      />
    </div>
  );
}
