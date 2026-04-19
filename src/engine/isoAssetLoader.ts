/** Load isometric pixel-art assets for the CEO-SIM office. */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

async function tryLoadImage(src: string): Promise<HTMLImageElement | null> {
  try { return await loadImage(src); } catch { return null; }
}

export interface IsoCharacterAsset {
  /** One image per direction — keys: south sw west nw north ne east se */
  rotations: Partial<Record<IsoDirection, HTMLImageElement>>;
  /** animation name → direction → frames array */
  animations: Partial<Record<string, Partial<Record<IsoDirection, HTMLImageElement[]>>>>;
}

export type IsoDirection = 'south' | 'south-west' | 'west' | 'north-west' | 'north' | 'north-east' | 'east' | 'south-east';

export const ISO_DIRECTIONS: IsoDirection[] = [
  'south', 'south-west', 'west', 'north-west',
  'north', 'north-east', 'east', 'south-east',
];

export interface IsoAssets {
  tiles:      Map<string, HTMLImageElement>;
  props:      Map<string, HTMLImageElement>;
  characters: Map<string, IsoCharacterAsset>;
}

const TILE_NAMES = [
  'floor-tech', 'floor-server', 'floor-meeting',
  'floor-ceo', 'floor-kitchen', 'floor-lobby',
];

const PROP_NAMES = [
  'desk-pc', 'kanban-board', 'server-rack', 'neon-sign-brain',
  'control-console', 'chair', 'plant', 'bar-stool', 'bookshelf',
  'reception-desk', 'coffee-counter', 'fridge', 'vending-machine', 'sofa',
];

const CHARACTER_ROLES = [
  'ceo', 'cto', 'pm', 'designer', 'frontend',
  'backend', 'devops', 'qa', 'researcher',
];

const ANIMATION_NAMES = ['walk', 'idle', 'drinking'];

export async function loadIsoAssets(): Promise<IsoAssets> {
  const tiles      = new Map<string, HTMLImageElement>();
  const props      = new Map<string, HTMLImageElement>();
  const characters = new Map<string, IsoCharacterAsset>();

  // ── Tiles ────────────────────────────────────────────────────────────────────
  await Promise.all(TILE_NAMES.map(async name => {
    const img = await tryLoadImage(`/assets/iso/tiles/${name}.png`);
    if (img) tiles.set(name, img);
  }));

  // ── Props ────────────────────────────────────────────────────────────────────
  await Promise.all(PROP_NAMES.map(async name => {
    const img = await tryLoadImage(`/assets/iso/props/${name}.png`);
    if (img) props.set(name, img);
  }));

  // ── Characters (rotations + animations — graceful if ZIPs not yet extracted) ─
  await Promise.all(CHARACTER_ROLES.map(async role => {
    const asset: IsoCharacterAsset = { rotations: {}, animations: {} };

    await Promise.all(ISO_DIRECTIONS.map(async dir => {
      const img = await tryLoadImage(`/assets/iso/characters/${role}/rotations/${dir}.png`);
      if (img) asset.rotations[dir] = img;
    }));

    await Promise.all(ANIMATION_NAMES.map(async anim => {
      const dirFrames: Partial<Record<IsoDirection, HTMLImageElement[]>> = {};
      await Promise.all(ISO_DIRECTIONS.map(async dir => {
        const frames: HTMLImageElement[] = [];
        for (let i = 0; i < 12; i++) {
          const img = await tryLoadImage(`/assets/iso/characters/${role}/animations/${anim}/${dir}/${i}.png`);
          if (img) frames.push(img); else break;
        }
        if (frames.length > 0) dirFrames[dir] = frames;
      }));
      if (Object.keys(dirFrames).length > 0) asset.animations[anim] = dirFrames;
    }));

    characters.set(role, asset);
  }));

  return { tiles, props, characters };
}
