import { describe, expect, it } from 'vitest';
import { clientDatabaseURL } from './publicConfig';

describe('clientDatabaseURL', () => {
  it('never falls back to the emulator URL in a production build', () => {
    expect(
      clientDatabaseURL({
        fromEnv: '',
        production: true,
        useEmulators: true,
        projectId: 'kane-rts-game',
      }),
    ).toBe('');
    expect(
      clientDatabaseURL({
        fromEnv: 'https://kane-rts-game-default-rtdb.firebaseio.com',
        production: true,
        useEmulators: false,
        projectId: 'kane-rts-game',
      }),
    ).toBe('https://kane-rts-game-default-rtdb.firebaseio.com');
  });

  it('uses the emulator URL only outside production when emulators are on', () => {
    expect(
      clientDatabaseURL({
        fromEnv: '',
        production: false,
        useEmulators: true,
        projectId: 'kane-rts-game',
      }),
    ).toBe('http://127.0.0.1:9000?ns=kane-rts-game');
    expect(
      clientDatabaseURL({
        fromEnv: '',
        production: false,
        useEmulators: false,
        projectId: 'kane-rts-game',
      }),
    ).toBe('');
  });
});
