/**
 * Map management — Phaser 4 tilemap layer for the skirmish field.
 * Docs: https://docs.phaser.io/ (Tilemaps)
 */
import Phaser from 'phaser';
import { MAP } from '../../config/balance';
import { getSkirmishMap, type SkirmishMapId } from '../../data/skirmishMaps';
import { TILE } from './tilesetAssets';

export interface MapHandle {
  map: Phaser.Tilemaps.Tilemap;
  layer: Phaser.Tilemaps.TilemapLayer;
}

/** Build a blank procedural tilemap from the generated tileset. */
export function createSkirmishMap(
  scene: Phaser.Scene,
  mapId: SkirmishMapId = 'meadow',
): MapHandle {
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
      layer.putTileAt(groundTile(getSkirmishMap(mapId).id, wx, wy, tx, ty), tx, ty);
    }
  }

  layer.setDepth(0);
  return { map, layer };
}

function groundTile(
  mapId: SkirmishMapId,
  wx: number,
  wy: number,
  tx: number,
  ty: number,
): number {
  if (mapId === 'ford') {
    const band = Math.abs(wy - MAP.height * 0.5);
    if (band < 40) return TILE.path;
    if (band < 160) return TILE.dirt;
    if ((tx * 13 + ty * 7) % 19 === 0) return TILE.moss;
    return TILE.grass;
  }
  const mid = Math.hypot(wx - MAP.width / 2, wy - MAP.height / 2) < 280;
  const path = (tx + ty) % 5 === 0;
  if (mid) return TILE.dirt;
  if (path) return TILE.path;
  if ((tx * 13 + ty * 7) % 17 === 0) return TILE.crystal;
  if ((tx * 13 + ty * 7) % 11 === 0) return TILE.moss;
  return TILE.grass;
}
