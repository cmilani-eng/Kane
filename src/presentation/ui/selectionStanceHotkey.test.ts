import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));

describe('stance hotkey echo', () => {
  it('wires F/R/M keyboard presses to flashStanceHotkey', () => {
    const scene = readFileSync(resolve(here, '../../games/kane/KaneBattlefieldScene.ts'), 'utf8');
    expect(scene).toContain("flashStanceHotkey('formation')");
    expect(scene).toContain("flashStanceHotkey('rage')");
    expect(scene).toContain("flashStanceHotkey('mutation')");
  });

  it('defines the gold echo animation for stance buttons', () => {
    const css = readFileSync(resolve(here, 'selectionPanel.css'), 'utf8');
    expect(css).toContain('is-hotkey-echo');
    expect(css).toContain('kane-sel-hotkey-echo');
  });
});
