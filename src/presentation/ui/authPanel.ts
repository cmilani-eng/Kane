/**
 * Email/password auth sheet — DOM overlay (reliable mobile inputs).
 * Modes: login | signup | reset. Guest continue optional for Start Game gate.
 */
import { flags } from '../../config/flags';
import {
  authErrorMessage,
  resetPassword,
  signInWithEmail,
  signUpWithEmail,
} from '../../firebase/auth';
import { isFirebaseSdkReady } from '../../firebase/app';
import { bootstrapCloudAccount } from '../../firebase/cloudProgression';
import type { KaneAuthUser } from '../../firebase/types';
import { playSfx } from '../audio/sfx';

export type AuthPanelMode = 'login' | 'signup' | 'reset';

export interface AuthPanelOpts {
  /** Initial mode. */
  mode?: AuthPanelMode;
  /** Show “Play as guest (local only)” for Start Game gate. */
  allowGuest?: boolean;
  onAuthed: (user: KaneAuthUser) => void;
  onGuest?: () => void;
  onClose: () => void;
}

const ROOT_ID = 'kane-auth-panel';
const STYLE_ID = 'kane-auth-panel-style';

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${ROOT_ID} {
      position: fixed; inset: 0; z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      background: rgba(6, 10, 18, 0.82);
      font-family: system-ui, sans-serif;
      padding: 16px;
    }
    #${ROOT_ID} .kane-auth-card {
      width: min(400px, 100%);
      background: #152238;
      border: 2px solid rgba(240, 199, 94, 0.9);
      border-radius: 4px;
      padding: 22px 20px 18px;
      color: #d7e6f2;
      box-sizing: border-box;
    }
    #${ROOT_ID} h2 {
      margin: 0 0 4px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 22px; font-weight: normal; color: #f5e6c8;
      text-align: center;
    }
    #${ROOT_ID} .kane-auth-sub {
      margin: 0 0 14px; font-size: 12px; color: #9eb4c8; text-align: center;
    }
    #${ROOT_ID} label {
      display: block; font-size: 11px; color: #9eb4c8; margin: 10px 0 4px;
    }
    #${ROOT_ID} input {
      width: 100%; box-sizing: border-box;
      background: #0a1220; border: 1px solid #3a4555; color: #fff8e8;
      padding: 10px 12px; font-size: 15px; border-radius: 2px;
    }
    #${ROOT_ID} input:focus { outline: 1px solid #f0c75e; }
    #${ROOT_ID} .kane-auth-err {
      min-height: 18px; margin: 10px 0 0; font-size: 12px; color: #e87a7a;
      text-align: center;
    }
    #${ROOT_ID} .kane-auth-ok {
      min-height: 18px; margin: 10px 0 0; font-size: 12px; color: #6ecfbf;
      text-align: center;
    }
    #${ROOT_ID} .kane-auth-actions {
      display: flex; flex-direction: column; gap: 8px; margin-top: 14px;
    }
    #${ROOT_ID} button {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 15px; padding: 11px 14px; cursor: pointer;
      border: none; color: #fff8e8; background: #2a3a28;
    }
    #${ROOT_ID} button.primary { background: #3a5530; color: #f0c75e; }
    #${ROOT_ID} button.ghost { background: #3a4555; font-family: system-ui, sans-serif; font-size: 13px; }
    #${ROOT_ID} button.linkish {
      background: transparent; color: #7ec8ff; font-family: system-ui, sans-serif;
      font-size: 12px; padding: 6px;
    }
    #${ROOT_ID} button:disabled { opacity: 0.55; cursor: wait; }
    #${ROOT_ID} .kane-auth-row { display: flex; justify-content: space-between; gap: 8px; }
  `;
  document.head.appendChild(style);
}

function destroy(): void {
  document.getElementById(ROOT_ID)?.remove();
}

export function showAuthPanel(opts: AuthPanelOpts): void {
  destroy();
  ensureStyle();
  playSfx('ui');

  let mode: AuthPanelMode = opts.mode ?? 'login';
  let busy = false;

  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.innerHTML = `
    <div class="kane-auth-card" role="dialog" aria-modal="true" aria-labelledby="kane-auth-title">
      <h2 id="kane-auth-title">Account</h2>
      <p class="kane-auth-sub" id="kane-auth-sub"></p>
      <div id="kane-auth-fields"></div>
      <p class="kane-auth-err" id="kane-auth-err" hidden></p>
      <p class="kane-auth-ok" id="kane-auth-ok" hidden></p>
      <div class="kane-auth-actions" id="kane-auth-actions"></div>
    </div>
  `;
  document.body.appendChild(root);

  const titleEl = root.querySelector('#kane-auth-title') as HTMLElement;
  const subEl = root.querySelector('#kane-auth-sub') as HTMLElement;
  const fieldsEl = root.querySelector('#kane-auth-fields') as HTMLElement;
  const errEl = root.querySelector('#kane-auth-err') as HTMLElement;
  const okEl = root.querySelector('#kane-auth-ok') as HTMLElement;
  const actionsEl = root.querySelector('#kane-auth-actions') as HTMLElement;

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
      titleEl.textContent = 'Log in';
      subEl.textContent = sdk
        ? 'Email & password · progress saves to your account'
        : 'Add VITE_FIREBASE_* in .env.local (or use guest play)';
    } else if (mode === 'signup') {
      titleEl.textContent = 'Create account';
      subEl.textContent = '13+ · ads off · skins only — never pay-to-win';
    } else {
      titleEl.textContent = 'Reset password';
      subEl.textContent = 'We will email a reset link if the account exists';
    }

    fieldsEl.innerHTML = '';
    if (mode === 'signup') {
      fieldsEl.innerHTML += `
        <label for="kane-auth-name">Display name</label>
        <input id="kane-auth-name" type="text" maxlength="32" autocomplete="nickname" placeholder="Commander" />
      `;
    }
    fieldsEl.innerHTML += `
      <label for="kane-auth-email">Email</label>
      <input id="kane-auth-email" type="email" autocomplete="email" required />
    `;
    if (mode !== 'reset') {
      fieldsEl.innerHTML += `
        <label for="kane-auth-pass">Password</label>
        <input id="kane-auth-pass" type="password" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" minlength="6" required />
      `;
    }

    actionsEl.innerHTML = '';
    const primary = document.createElement('button');
    primary.type = 'button';
    primary.className = 'primary';
    primary.textContent =
      mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create account' : 'Send reset link';
    primary.disabled = !sdk || busy;
    primary.onclick = () => void submit();
    actionsEl.appendChild(primary);

    if (opts.allowGuest && opts.onGuest) {
      const guest = document.createElement('button');
      guest.type = 'button';
      guest.className = 'ghost';
      guest.textContent = 'Play as guest (local only)';
      guest.onclick = () => {
        playSfx('ui');
        destroy();
        opts.onGuest?.();
      };
      actionsEl.appendChild(guest);
    }

    const row = document.createElement('div');
    row.className = 'kane-auth-row';
    if (mode === 'login') {
      const toSignup = document.createElement('button');
      toSignup.type = 'button';
      toSignup.className = 'linkish';
      toSignup.textContent = 'Create account';
      toSignup.onclick = () => {
        mode = 'signup';
        render();
      };
      const toReset = document.createElement('button');
      toReset.type = 'button';
      toReset.className = 'linkish';
      toReset.textContent = 'Forgot password?';
      toReset.onclick = () => {
        mode = 'reset';
        render();
      };
      row.append(toSignup, toReset);
    } else {
      const toLogin = document.createElement('button');
      toLogin.type = 'button';
      toLogin.className = 'linkish';
      toLogin.textContent = 'Back to log in';
      toLogin.onclick = () => {
        mode = 'login';
        render();
      };
      row.appendChild(toLogin);
    }
    actionsEl.appendChild(row);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'ghost';
    close.textContent = 'Cancel';
    close.onclick = () => {
      playSfx('ui');
      destroy();
      opts.onClose();
    };
    actionsEl.appendChild(close);

    if (!flags.firebaseAuthUi) {
      setErr('Auth UI disabled by feature flag.');
      primary.disabled = true;
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
        const msg = 'Reset email sent if that address is registered.';
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
