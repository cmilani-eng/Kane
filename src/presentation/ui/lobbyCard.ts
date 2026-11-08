/**
 * Friend lobby as a picker-style card in DOM and Tailwind. It uses the same live lobby
 * session as the Phaser panel it replaces (peek, subscribe, host, join, leave), and the
 * same strings. The stat lines sit in one column, so they cannot stack over the title.
 */
import { t } from '../../i18n';
import { getCurrentAuthUser } from '../../firebase/auth';
import { getLobbySession } from '../../networking/lobbySingleton';
import { joinAsGuest, startAsHost, type PvpLaunch } from '../../networking/matchStart';
import { playSfx } from '../audio/sfx';
import {
  PICKER_BODY_CLASSES,
  PICKER_CARD_CLASSES,
  PICKER_TAG_CLASSES,
  PICKER_TITLE_CLASSES,
} from './pickerCard';
import {
  lobbyMapTipLine,
  lobbyMatchLengthTipLine,
  lobbySetupLine,
  lobbyStatusLine,
} from './lobbyPanel';

const OVERLAY_CLASSES =
  'fixed inset-0 z-[80] flex items-center justify-center bg-[rgb(10_18_32/0.84)] p-4';

const BUTTON_BASE =
  'inline-flex min-h-12 items-center justify-center rounded-[14px] px-5 py-[11px] text-[14px] font-black uppercase shadow-[0_5px_0_rgba(0,0,0,0.45)] hover:brightness-110 active:translate-y-0.5 cursor-pointer';

const PRIMARY_BUTTON = `${BUTTON_BASE} bg-[#9dff6a] text-[#06121f] shadow-[0_5px_0_#4a9a2c]`;
const SECONDARY_BUTTON = `${BUTTON_BASE} bg-[#2a3a50] text-[#f5f8ff]`;
const QUIET_BUTTON = `${BUTTON_BASE} bg-[#3a4555] text-[#f5f8ff]`;

const MUTED_LINE = 'mt-2 text-[13px] leading-normal text-[#8fa7c2]';

/** Opens the friend lobby card. `onClose` runs once, however the card closes. */
export function showLobbyCard(
  onClose: () => void,
  onMatch: (launch: PvpLaunch) => void,
): void {
  const lobby = getLobbySession();

  const overlay = document.createElement('div');
  overlay.className = OVERLAY_CLASSES;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', t('lobby.title'));

  const card = document.createElement('div');
  card.className = `${PICKER_CARD_CLASSES} relative max-h-[calc(100dvh-32px)] overflow-y-auto`;

  const close = document.createElement('button');
  close.type = 'button';
  close.className =
    'absolute top-4 right-4 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-[18px] text-[#f5f8ff] hover:bg-white/20';
  close.setAttribute('aria-label', t('lobby.close'));
  close.textContent = '×';

  const tag = document.createElement('span');
  tag.className = PICKER_TAG_CLASSES;
  tag.textContent = t('lobby.title');

  const code = document.createElement('h2');
  code.className = `${PICKER_TITLE_CLASSES} tracking-[4px]`;

  const status = document.createElement('p');
  status.className = PICKER_BODY_CLASSES;

  const subtitle = document.createElement('p');
  subtitle.className = MUTED_LINE;
  subtitle.textContent = t('lobby.subtitle');

  const setup = document.createElement('p');
  setup.className = MUTED_LINE;
  setup.textContent = lobbySetupLine();

  const tips = document.createElement('p');
  tips.className = MUTED_LINE;
  tips.textContent = [lobbyMapTipLine(), lobbyMatchLengthTipLine()].join(' · ');

  const quiet = document.createElement('p');
  quiet.className = 'mt-4 text-[12px] text-[#6a7f94]';
  quiet.textContent = t('lobby.quiet');

  const row = document.createElement('div');
  row.className = 'mt-6 flex flex-wrap justify-center gap-3';

  const create = document.createElement('button');
  create.type = 'button';
  create.className = PRIMARY_BUTTON;
  create.textContent = t('lobby.create');

  const join = document.createElement('button');
  join.type = 'button';
  join.className = SECONDARY_BUTTON;
  join.textContent = t('lobby.join');

  const leave = document.createElement('button');
  leave.type = 'button';
  leave.className = QUIET_BUTTON;
  leave.textContent = t('lobby.leave');

  row.append(create, join, leave);
  card.append(close, tag, code, status, subtitle, setup, tips, quiet, row);
  overlay.append(card);

  const refresh = (): void => {
    const st = lobby.peek();
    code.textContent = st.code ?? '————';
    code.style.color =
      st.status === 'hosting' || st.status === 'hosted'
        ? '#f0c75e'
        : st.status === 'joining' || st.status === 'joined'
          ? '#7ec8ff'
          : '#6a7f94';
    status.textContent = lobbyStatusLine(st.status, st.code, st.reason);
    create.textContent = st.status === 'hosted' ? t('pvp.start') : t('lobby.create');
  };

  let done = false;
  let unsubscribe = (): void => {};
  let stopGuestWatch: (() => void) | null = null;
  const destroy = (): void => {
    if (done) return;
    done = true;
    unsubscribe();
    stopGuestWatch?.();
    window.removeEventListener('keydown', onKey);
    overlay.remove();
    onClose();
  };
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') destroy();
  };

  /** The match is open: the card hands the battle to the menu, which opens it. */
  const launchMatch = (launch: PvpLaunch): void => {
    if (done) return;
    done = true;
    unsubscribe();
    stopGuestWatch?.();
    lobby.release();
    window.removeEventListener('keydown', onKey);
    overlay.remove();
    onClose();
    onMatch(launch);
  };
  create.addEventListener('click', () => {
    playSfx('ui');
    const st = lobby.peek();
    const uid = getCurrentAuthUser()?.uid;
    if (st.status === 'hosted' && st.code && st.peerUid && uid) {
      void startAsHost(st.code, uid, st.peerUid).then((launch) => {
        if (launch) launchMatch(launch);
      });
      return;
    }
    void lobby.host();
  });
  join.addEventListener('click', () => {
    playSfx('ui');
    const raw = window.prompt(t('lobby.prompt'), 'KANE01');
    if (raw == null) return;
    void lobby.join(raw).then(() => {
      const st = lobby.peek();
      const uid = getCurrentAuthUser()?.uid;
      if (st.status !== 'joined' || !st.code || !st.peerUid || !uid) return;
      stopGuestWatch?.();
      stopGuestWatch = joinAsGuest(st.code, st.peerUid, uid, launchMatch);
    });
  });
  leave.addEventListener('click', () => {
    playSfx('ui');
    void lobby.leave();
  });
  close.addEventListener('click', () => {
    playSfx('ui');
    destroy();
  });
  window.addEventListener('keydown', onKey);

  refresh();
  unsubscribe = lobby.subscribe(refresh);
  document.body.append(overlay);
  create.focus();
}
