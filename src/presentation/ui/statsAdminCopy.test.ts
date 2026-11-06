import { beforeEach, describe, expect, it } from 'vitest';
import { setAdminAccessMode } from '../../database/adminAllowlist';
import type { DailyRollupStore } from '../../database/dailyStatsRollup';
import type { ModerationStore } from '../../database/moderationStub';
import { resetLocaleForTests, setLocale } from '../../i18n';
import {
  adminAllowlistText,
  adminModerationText,
  adminRollupText,
} from './statsAdminCopy';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

const emptyRollup: DailyRollupStore = {
  version: 1,
  updatedAtMs: 0,
  sink: 'localStorage',
  days: [],
};

const oneDay: DailyRollupStore = {
  version: 1,
  updatedAtMs: 0,
  sink: 'localStorage',
  days: [
    {
      day: '2026-11-06',
      matches: 2,
      wins: 1,
      losses: 1,
      durationMs: 120_000,
      bySpecies: {
        brutes: { matches: 2, wins: 1, losses: 1, durationMs: 120_000 },
        nobles: { matches: 0, wins: 0, losses: 0, durationMs: 0 },
        weirdos: { matches: 0, wins: 0, losses: 0, durationMs: 0 },
      },
      byDifficulty: {},
    },
  ],
};

const emptyLog: ModerationStore = { version: 1, events: [] };

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: memoryStorage(),
    configurable: true,
  });
  resetLocaleForTests();
});

describe('admin tools copy', () => {
  it('translates the rollup, allowlist, and moderation chrome', () => {
    setLocale('es');
    setAdminAccessMode('open');

    const empty = adminRollupText(emptyRollup);
    expect(empty).toContain('Resumen diario');
    expect(empty).not.toContain('Daily rollup');

    const day = adminRollupText(oneDay);
    expect(day).toContain('2026-11-06');
    expect(day).toContain('1V/1D');
    expect(day).toContain('B2/N0/W0');
    expect(day).not.toContain('Daily rollup');

    const access = adminAllowlistText();
    expect(access).toContain('Modo de acceso: open');
    expect(access).toContain('abierto');
    expect(access).not.toContain('Access mode');
    expect(access).not.toContain('soft-launch');

    const log = adminModerationText(emptyLog);
    expect(log).toContain('Registro de moderación');
    expect(log).not.toContain('Moderation log');

    const kept = adminModerationText({
      version: 1,
      events: [
        {
          id: 'e1',
          atMs: 1,
          action: 'report',
          targetId: 'peer-stub',
          reason: 'Phase 7 moderation stub',
          byAdminId: 'local',
        },
      ],
    });
    expect(kept).toContain('report peer-stub — Phase 7 moderation stub');
  });
});
