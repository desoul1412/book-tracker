/**
 * Isometric office layout matching the CEO-SIM reference design.
 *
 * Grid: 16 cols × 10 rows
 *
 * Zones:
 *   Dev Room    — floor-tech   — cols 0-10, rows 0-8  (dark circuit floor)
 *   Server Room — floor-server — cols 11-15, rows 0-7 (light grey)
 *   Lobby       — floor-lobby  — cols 0-15, row 9
 *
 * Layout (back→front, left→right in iso view):
 *   Row 0: kanban | bookshelf | coffee-counter fridge vending | server-racks brain-sign
 *   Row 1: dev desks ×3 (back row)
 *   Row 2: dev chairs + bar-stools
 *   Row 3: dev desks ×3 (front row)
 *   Row 4: dev chairs
 *   Row 5: open floor + CEO desk (right of center)
 *   Row 6: CEO chair + sofa area
 *   Row 7: open + plant
 *   Row 8: open office floor
 *   Row 9: lobby / reception desk
 */

export type TileType =
  | 'floor-tech'
  | 'floor-server'
  | 'floor-meeting'
  | 'floor-ceo'
  | 'floor-kitchen'
  | 'floor-lobby'
  | 'void';

export interface PropPlacement {
  key:      string;
  prop:     string;
  col:      number;
  row:      number;
  hotspot?: string;
  zOffset?: number;
}

export interface AgentSeat {
  role: string;
  col:  number;
  row:  number;
}

export interface IsoOfficeLayout {
  cols:     number;
  rows:     number;
  tileGrid: TileType[];
  walkable: boolean[];
  props:    PropPlacement[];
  seats:    AgentSeat[];
}

const COLS = 16;
const ROWS = 10;

function tile(col: number, row: number, type: TileType, grid: TileType[]) {
  if (col >= 0 && col < COLS && row >= 0 && row < ROWS)
    grid[row * COLS + col] = type;
}

function rect(
  c0: number, r0: number, c1: number, r1: number,
  type: TileType, grid: TileType[]
) {
  for (let r = r0; r <= r1; r++)
    for (let c = c0; c <= c1; c++)
      tile(c, r, type, grid);
}

export function buildIsoLayout(): IsoOfficeLayout {
  const tileGrid: TileType[] = new Array(COLS * ROWS).fill('void');
  const walkable: boolean[]  = new Array(COLS * ROWS).fill(false);

  // ── Floor zones ──────────────────────────────────────────────────────────────
  rect(0,  0, 10, 8, 'floor-tech',   tileGrid);  // Dev + break area (dark circuit)
  rect(11, 0, 15, 7, 'floor-server', tileGrid);  // Server room (light grey)
  rect(0,  9, 15, 9, 'floor-lobby',  tileGrid);  // Lobby

  // ── Walkable = all non-void ───────────────────────────────────────────────────
  for (let i = 0; i < tileGrid.length; i++)
    walkable[i] = tileGrid[i] !== 'void';

  // ── Block prop footprints ─────────────────────────────────────────────────────
  const blockedCells: [number, number][] = [
    [0,  0],                         // kanban board
    [6,  0],                         // bookshelf divider
    [7,  0],                         // coffee counter
    [9,  0],                         // fridge
    [10, 0],                         // vending machine
    [1,  1], [3, 1], [5, 1],        // desk row 1 (back)
    [1,  3], [3, 3], [5, 3],        // desk row 2 (front)
    [12, 0], [13, 0], [14, 0],      // server racks
    [15, 0],                         // bookshelf (server room)
    [13, 2],                         // control console
    [6,  5],                         // sofa
    [9,  5],                         // CEO desk
    [7,  9],                         // reception desk
  ];
  for (const [c, r] of blockedCells)
    walkable[r * COLS + c] = false;

  // ── Props ─────────────────────────────────────────────────────────────────────
  const props: PropPlacement[] = [

    // ── Dev Room ─────────────────────────────────────────────────────────────
    // Kanban on back-left wall
    { key: 'kanban-1',      prop: 'kanban-board',    col: 0,  row: 0, hotspot: 'kanban' },
    // Bookshelf divider between dev and break
    { key: 'bookshelf-dev', prop: 'bookshelf',       col: 6,  row: 0 },

    // Desk pod — row 1 (back, nearest to kanban wall)
    { key: 'desk-1',        prop: 'desk-pc',         col: 1,  row: 1 },
    { key: 'desk-2',        prop: 'desk-pc',         col: 3,  row: 1 },
    { key: 'desk-3',        prop: 'desk-pc',         col: 5,  row: 1 },
    { key: 'chair-1',       prop: 'chair',           col: 1,  row: 2 },
    { key: 'chair-2',       prop: 'chair',           col: 3,  row: 2 },
    { key: 'chair-3',       prop: 'chair',           col: 5,  row: 2 },

    // Desk pod — row 2 (front)
    { key: 'desk-4',        prop: 'desk-pc',         col: 1,  row: 3 },
    { key: 'desk-5',        prop: 'desk-pc',         col: 3,  row: 3 },
    { key: 'desk-6',        prop: 'desk-pc',         col: 5,  row: 3 },
    { key: 'chair-4',       prop: 'chair',           col: 1,  row: 4 },
    { key: 'chair-5',       prop: 'chair',           col: 3,  row: 4 },
    { key: 'chair-6',       prop: 'chair',           col: 5,  row: 4 },

    // Dev room plants
    { key: 'plant-1',       prop: 'plant',           col: 0,  row: 7 },

    // ── Break / Kitchen ───────────────────────────────────────────────────────
    { key: 'coffee-1',      prop: 'coffee-counter',  col: 7,  row: 0 },
    { key: 'fridge-1',      prop: 'fridge',          col: 9,  row: 0 },
    { key: 'vending-1',     prop: 'vending-machine', col: 10, row: 0 },
    { key: 'barstool-1',    prop: 'bar-stool',       col: 7,  row: 2 },
    { key: 'barstool-2',    prop: 'bar-stool',       col: 8,  row: 2 },
    { key: 'barstool-3',    prop: 'bar-stool',       col: 9,  row: 2 },
    { key: 'plant-2',       prop: 'plant',           col: 8,  row: 6 },

    // ── CEO / Management (center) ─────────────────────────────────────────────
    { key: 'sofa-1',        prop: 'sofa',            col: 6,  row: 5 },
    { key: 'desk-ceo',      prop: 'desk-pc',         col: 9,  row: 5,  hotspot: 'agent-desk' },
    { key: 'chair-ceo',     prop: 'chair',           col: 9,  row: 6 },
    { key: 'plant-3',       prop: 'plant',           col: 11, row: 4 },

    // ── Server Room — "The Brain" ─────────────────────────────────────────────
    { key: 'rack-1',        prop: 'server-rack',     col: 12, row: 0, hotspot: 'brain-server', zOffset: -1 },
    { key: 'rack-2',        prop: 'server-rack',     col: 13, row: 0,                          zOffset: -1 },
    { key: 'rack-3',        prop: 'server-rack',     col: 14, row: 0,                          zOffset: -1 },
    { key: 'brain-sign',    prop: 'neon-sign-brain', col: 13, row: 0,                          zOffset: -2 },
    { key: 'console-1',     prop: 'control-console', col: 13, row: 2, hotspot: 'qa-terminal' },
    { key: 'bookshelf-srv', prop: 'bookshelf',       col: 15, row: 0 },

    // ── Lobby ─────────────────────────────────────────────────────────────────
    { key: 'reception-1',   prop: 'reception-desk',  col: 7,  row: 9,  hotspot: 'reception' },
    { key: 'plant-4',       prop: 'plant',           col: 0,  row: 9 },
    { key: 'plant-5',       prop: 'plant',           col: 15, row: 9 },
  ];

  // ── Agent seats — walkable tiles adjacent to each workstation ─────────────────
  // Role strings MUST match emp.role casing from the company data.
  const seats: AgentSeat[] = [
    { role: 'CEO',        col: 9,  row: 6 },  // chair-ceo
    { role: 'CTO',        col: 1,  row: 2 },  // chair-1 (desk-1)
    { role: 'PM',         col: 3,  row: 2 },  // chair-2 (desk-2)
    { role: 'DevOps',     col: 5,  row: 2 },  // chair-3 (desk-3)
    { role: 'Frontend',   col: 1,  row: 4 },  // chair-4 (desk-4)
    { role: 'Designer',   col: 3,  row: 4 },  // chair-5 (desk-5)
    { role: 'Backend',    col: 5,  row: 4 },  // chair-6 (desk-6)
    { role: 'QA',         col: 13, row: 3 },  // south of control console
    { role: 'Researcher', col: 5,  row: 6 },  // open floor near CEO area
  ];

  return { cols: COLS, rows: ROWS, tileGrid, walkable, props, seats };
}
