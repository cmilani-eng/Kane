/**
 * Map management — Phaser 4 tilemap layer for the skirmish field.
 * Docs: https://docs.phaser.io/ (Tilemaps)
 */
import Phaser from 'phaser';
import { MAP } from '../../config/balance';
import { TILE } from './tilesetAssets';

export interface MapHandle {
  map: Phaser.Tilemaps.Tilemap;
  layer: Phaser.Tilemaps.TilemapLayer;
}

/** Build a blank procedural tilemap from the generated tileset. */
export function createSkirmishMap(scene: Phaser.Scene): MapHandle {
  const tileW = MAP.tile;
  const tileH = MAP.tile;
  const cols = Math.ceil(MAP.width / tileW);
  const rows = Math.ceil(MAP.height / tileH);

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

  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const wx = tx * tileW + tileW / 2;
      const wy = ty * tileH + tileH / 2;
      const mid =
        Math.hypot(wx - MAP.width / 2, wy - MAP.height / 2) < 280;
      const path = (tx + ty) % 5 === 0;
      let id: number = TILE.grass;
      if (mid) id = TILE.dirt;
      else if (path) id = TILE.path;
      else if ((tx * 13 + ty * 7) % 17 === 0) id = TILE.crystal;
      else if ((tx * 13 + ty * 7) % 11 === 0) id = TILE.moss;
      layer.putTileAt(id, tx, ty);
    }
  }

  layer.setDepth(0);
  return { map, layer };
}
