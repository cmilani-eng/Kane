/**
 * Email/password auth sheet — DOM overlay (reliable mobile inputs).
 * Modes: login | signup | reset. Guest continue optional for Start Game gate
 * (Firebase anonymous when SDK configured; local-only fallback otherwise).
 * Visual language matches Friend lobby + Stats (navy / gold / cream).
 */
import { BRAND } from '../../config/brand';
import { flags } from '../../config/flags';
import {
  authErrorMessage,
  resetPassword,
  signInAsGuest,
  signInWithEmail,
  signUpWithEmail,
} from '../../firebase/auth';
import { isFirebaseSdkReady } from '../../firebase/app';
import { bootstrapCloudAccount } from '../../firebase/cloudProgression';
import type { KaneAuthUser } from '../../firebase/types';
import { t } from '../../i18n';
import { playSfx } from '../audio/sfx';

export type AuthPanelMode = 'login' | 'signup' | 'reset';

export interface AuthPanelOpts {
  /** Initial mode. */
  mode?: AuthPanelMode;
  /** Show guest continue for Start Game gate. */
  allowGuest?: boolean;
  onAuthed: (user: KaneAuthUser) => void;
  /** Local-only guest when Firebase env is missing (or anonymous sign-in fails). */
  onGuest?: () => void;
  onClose: () => void;
}

const ROOT_ID = 'kane-auth-panel';
const CARD_GLINT =
  "before:pointer-events-none before:absolute before:inset-x-0.5 before:top-0.5 before:h-1 before:bg-kane-gold/90 before:content-['']";
const ROOT_CLASS = [
  'fixed inset-0 z-[10000] flex items-center justify-center bg-kane-scrim p-4 font-sans',
  'short:items-start short:overflow-auto short:px-3 short:py-2',
].join(' ');
const CARD_CLASS = [
  'relative box-border w-[min(400px,100%)] rounded border-2 border-kane-gold/85 bg-kane-card',
  'px-5 pt-[22px] pb-[18px] text-kane-ink',
  'short:w-[min(720px,100%)] short:px-4 short:pt-3 short:pb-2.5',
  CARD_GLINT,
].join(' ');
const LABEL = 'mt-2.5 mb-1 block text-[11px] text-kane-muted short:mt-1 short:mb-0.5';
const INPUT = [
  'box-border w-full rounded-xs border border-kane-slate bg-kane-deep px-3 py-2.5 text-[15px]',
  'text-kane-parchment focus:outline-1 focus:outline-kane-gold short:px-2.5 short:py-[7px]',
].join(' ');
const BUTTON = 'cursor-pointer border-none font-sans disabled:cursor-wait disabled:opacity-55';
const BIG_BUTTON = `${BUTTON} min-h-12 px-3.5 py-[11px] text-center leading-[1.25] whitespace-normal short:flex-[1_1_140px]`;
const PRIMARY = `${BIG_BUTTON} bg-kane-moss text-sm text-kane-gold`;
const GHOST = `${BIG_BUTTON} bg-kane-slate text-[13px] text-kane-parchment`;
const LINKISH = `${BUTTON} bg-transparent p-1.5 text-xs text-kane-ice`;

function destroy(): void {
  document.getElementById(ROOT_ID)?.remove();
}

export function showAuthPanel(opts: AuthPanelOpts): void {
  destroy();
  playSfx('ui');

  let mode: AuthPanelMode = opts.mode ?? 'login';
  let busy = false;

  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.className = ROOT_CLASS;
  root.innerHTML = `
    <div class="${CARD_CLASS}" role="dialog" aria-modal="true" aria-labelledby="kane-auth-title">
      <div class="mt-1 mb-0.5 text-center font-kane-serif text-[13px] font-bold tracking-[0.04em] text-kane-gold">${BRAND.name}</div>
      <h2 class="mb-1 text-center font-kane-serif text-[26px] text-kane-cream short:m-0 short:text-xl" id="kane-auth-title">Account</h2>
      <p class="mb-3.5 text-center text-[13px] text-kane-muted short:mb-1.5" id="kane-auth-sub"></p>
      <div id="kane-auth-fields"></div>
      <p class="mt-2.5 min-h-[18px] text-center text-xs text-kane-danger" id="kane-auth-err" hidden></p>
      <p class="mt-2.5 min-h-[18px] text-center text-xs text-kane-teal" id="kane-auth-ok" hidden></p>
      <div class="mt-3.5 flex flex-col gap-2 short:mt-2 short:flex-row short:flex-wrap short:items-center" id="kane-auth-actions"></div>
      <p class="mt-2.5 text-center text-[11px] text-kane-quiet short:mt-1.5" id="kane-auth-quiet"></p>
    </div>
  `;
  document.body.appendChild(root);

  const titleEl = root.querySelector('#kane-auth-title') as HTMLElement;
  const subEl = root.querySelector('#kane-auth-sub') as HTMLElement;
  const fieldsEl = root.querySelector('#kane-auth-fields') as HTMLElement;
  const errEl = root.querySelector('#kane-auth-err') as HTMLElement;
  const okEl = root.querySelector('#kane-auth-ok') as HTMLElement;
  const actionsEl = root.querySelector('#kane-auth-actions') as HTMLElement;
  const quietEl = root.querySelector('#kane-auth-quiet') as HTMLElement;

  const setErr = (msg: string | null): void => {
    if (!msg) {
      errEl.hidden = true;
      errEl.textContent = '';
      return;
    }
    errEl.hidden = false;
    errEl.textContent = msg;
    okEl.hidden = true;
  };
  const setOk = (msg: string | null): void => {
    if (!msg) {
      okEl.hidden = true;
      okEl.textContent = '';
      return;
    }
    okEl.hidden = false;
    okEl.textContent = msg;
    errEl.hidden = true;
  };

  const render = (): void => {
    const sdk = isFirebaseSdkReady();
    setErr(null);
    setOk(null);

    if (mode === 'login') {
      titleEl.textContent = t('auth.login');
      subEl.textContent = sdk ? t('auth.loginSub') : t('auth.loginSubLocal');
      quietEl.textContent = t('auth.skins');
    } else if (mode === 'signup') {
      titleEl.textContent = t('auth.signup');
      subEl.textContent = t('auth.signupSub');
      quietEl.textContent = t('auth.age');
    } else {
      titleEl.textContent = t('auth.reset');
      subEl.textContent = t('auth.resetSub');
      quietEl.textContent = '';
    }

    fieldsEl.innerHTML = '';
    if (mode === 'signup') {
      fieldsEl.innerHTML += `
        <label class="${LABEL}" for="kane-auth-name">${t('auth.displayName')}</label>
        <input class="${INPUT}" id="kane-auth-name" type="text" maxlength="32" autocomplete="nickname" placeholder="${t('auth.displayPlaceholder')}" />
      `;
    }
    fieldsEl.innerHTML += `
      <label class="${LABEL}" for="kane-auth-email">${t('auth.email')}</label>
      <input class="${INPUT}" id="kane-auth-email" type="email" autocomplete="email" required />
    `;
    if (mode !== 'reset') {
      fieldsEl.innerHTML += `
        <label class="${LABEL}" for="kane-auth-pass">${t('auth.password')}</label>
        <input class="${INPUT}" id="kane-auth-pass" type="password" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" minlength="6" required />
      `;
    }

    actionsEl.innerHTML = '';
    const primary = document.createElement('button');
    primary.type = 'button';
    primary.className = PRIMARY;
    primary.textContent =
      mode === 'login' ? t('auth.login') : mode === 'signup' ? t('auth.signup') : t('auth.sendReset');
    primary.disabled = !sdk || busy;
    primary.onclick = () => void submit();
    actionsEl.appendChild(primary);

    if (opts.allowGuest && (opts.onGuest || sdk)) {
      const guest = document.createElement('button');
      guest.type = 'button';
      guest.className = GHOST;
      guest.disabled = busy;
      guest.textContent = sdk ? t('auth.guest') : t('auth.guestLocal');
      guest.onclick = () => void continueAsGuest();
      actionsEl.appendChild(guest);
    }

    const row = document.createElement('div');
    row.className = 'flex justify-between gap-2 short:m-0 short:flex-[1_1_100%]';
    if (mode === 'login') {
      const toSignup = document.createElement('button');
      toSignup.type = 'button';
      toSignup.className = LINKISH;
      toSignup.textContent = t('auth.signup');
      toSignup.onclick = () => {
        mode = 'signup';
        render();
      };
      const toReset = document.createElement('button');
      toReset.type = 'button';
      toReset.className = LINKISH;
      toReset.textContent = t('auth.forgot');
      toReset.onclick = () => {
        mode = 'reset';
        render();
      };
      row.append(toSignup, toReset);
    } else {
      const toLogin = document.createElement('button');
      toLogin.type = 'button';
      toLogin.className = LINKISH;
      toLogin.textContent = t('auth.back');
      toLogin.onclick = () => {
        mode = 'login';
        render();
      };
      row.appendChild(toLogin);
    }
    actionsEl.appendChild(row);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = GHOST;
    close.textContent = t('auth.cancel');
    close.onclick = () => {
      playSfx('ui');
      destroy();
      opts.onClose();
    };
    actionsEl.appendChild(close);

    if (!flags.firebaseAuthUi) {
      setErr(t('auth.disabled'));
      primary.disabled = true;
    }
  };

  const continueAsGuest = async (): Promise<void> => {
    if (busy) return;
    playSfx('ui');
    if (!isFirebaseSdkReady()) {
      destroy();
      opts.onGuest?.();
      return;
    }
    busy = true;
    render();
    try {
      const user = await signInAsGuest();
      await bootstrapCloudAccount(user);
      destroy();
      opts.onAuthed(user);
    } catch (err) {
      console.warn('[KANE] anonymous guest failed; falling back to local', err);
      busy = false;
      if (opts.onGuest) {
        destroy();
        opts.onGuest();
        return;
      }
      render();
      setErr(authErrorMessage(err));
    }
  };

  const submit = async (): Promise<void> => {
    if (busy) return;
    const email = (document.getElementById('kane-auth-email') as HTMLInputElement | null)?.value ?? '';
    const pass = (document.getElementById('kane-auth-pass') as HTMLInputElement | null)?.value ?? '';
    const name = (document.getElementById('kane-auth-name') as HTMLInputElement | null)?.value ?? '';
    busy = true;
    render();
    try {
      if (mode === 'reset') {
        await resetPassword(email);
        busy = false;
        const msg = t('auth.resetSent');
        render();
        setOk(msg);
        return;
      }
      const user =
        mode === 'signup'
          ? await signUpWithEmail(email, pass, name)
          : await signInWithEmail(email, pass);
      await bootstrapCloudAccount(user);
      playSfx('ui');
      destroy();
      opts.onAuthed(user);
    } catch (err) {
      busy = false;
      render();
      setErr(authErrorMessage(err));
    }
  };

  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      destroy();
      opts.onClose();
    }
    if (e.key === 'Enter') void submit();
  });

  render();
}

export function hideAuthPanel(): void {
  destroy();
}
