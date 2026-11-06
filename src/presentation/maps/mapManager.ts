/**
 * Map management — Phaser 4 tilemap layer for the skirmish field.
 * Docs: https://docs.phaser.io/ (Tilemaps)
 */
import Phaser from 'phaser';
import { MAP } from '../../config/balance';
import { getSkirmishMap } from '../../data/skirmishMaps';
import { TILE } from './tilesetAssets';

export interface MapHandle {
  map: Phaser.Tilemaps.Tilemap;
  layer: Phaser.Tilemaps.TilemapLayer;
}

/** Build a blank procedural tilemap from the generated tileset. */
export function createSkirmishMap(
  scene: Phaser.Scene,
  mapId?: string | null,
): MapHandle {
  const layout = getSkirmishMap(mapId);
  const tileW = MAP.tile;
  const tileH = MAP.tile;
  const cols = Math.ceil(MAP.width / tileW);
  const rows = Math.ceil(MAP.height / tileH);
  const seed = layout.tileSeed;

  const map = scene.make.tilemap({
    tileWidth: tileW,
    tileHeight: tileH,
    width: cols,
    height: rows,
  });
  const tileset = map.addTilesetImage('tileset-kane', 'tileset-kane', tileW, tileH, 0, 0, 1);
  if (!tileset) {
    throw new Error('tileset-kane missing — generate in Boot before Game');
  }
  const layer = map.createBlankLayer('ground', tileset, 0, 0, cols, rows, tileW, tileH);
  if (!layer) {
    throw new Error('failed to create ground layer');
  }

  const midX = layout.id === 'ridge' ? MAP.width * 0.45 : MAP.width / 2;
  const midY = layout.id === 'ridge' ? MAP.height * 0.55 : MAP.height / 2;
  const midR = layout.id === 'ridge' ? 220 : 280;

  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const wx = tx * tileW + tileW / 2;
      const wy = ty * tileH + tileH / 2;
      const mid = Math.hypot(wx - midX, wy - midY) < midR;
      const path = (tx + ty + seed) % (layout.id === 'ridge' ? 4 : 5) === 0;
      let id: number = TILE.grass;
      if (mid) id = TILE.dirt;
      else if (path) id = TILE.path;
      else if ((tx * 13 + ty * 7 + seed * 3) % 17 === 0) id = TILE.crystal;
      else if ((tx * 13 + ty * 7 + seed * 5) % 11 === 0) id = TILE.moss;
      layer.putTileAt(id, tx, ty);
    }
  }

  layer.setDepth(0);
  return { map, layer };
}
