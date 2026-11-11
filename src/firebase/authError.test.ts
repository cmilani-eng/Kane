import { beforeEach, describe, expect, it } from 'vitest';
import { resetLocaleForTests, setLocale, t } from '../i18n';
import { authErrorMessage } from './auth';
import { memoryStorage } from '../test/memoryStorage';

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: memoryStorage(),
    configurable: true,
  });
  resetLocaleForTests();
});

describe('auth dialog copy', () => {
  it('translates a known sign-in error and the guest button', () => {
    setLocale('es');
    const wrong = authErrorMessage({ code: 'auth/wrong-password' });
    expect(wrong).toContain('contraseña');
    expect(wrong).not.toContain('incorrect');
    expect(t('auth.guestLocal')).toBe('Jugar como invitado (solo local)');
    expect(t('auth.login')).toBe('Entrar');
  });

  it('keeps the en-GB source for the same error', () => {
    expect(authErrorMessage({ code: 'auth/invalid-email' })).toBe('Enter a valid email address.');
    expect(authErrorMessage(new Error('raw firebase'))).toBe('raw firebase');
    expect(authErrorMessage(null)).toBe('Something went wrong. Try again.');
  });
});
