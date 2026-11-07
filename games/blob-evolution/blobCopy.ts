import { applyDocumentLanguage, t, type MessageKey } from '../../src/i18n';

const STAGE_KEYS = [
  'blob.stage.purple',
  'blob.stage.blue',
  'blob.stage.green',
  'blob.stage.rock',
  'blob.stage.rainbow',
  'blob.stage.angel',
] as const satisfies readonly MessageKey[];

const CHOICE_KEYS = {
  rock: 'blob.rock',
  paper: 'blob.paper',
  scissors: 'blob.scissors',
} as const satisfies Record<string, MessageKey>;

export function blobStageName(stage: number): string {
  const key = STAGE_KEYS[stage];
  return key ? t(key) : '';
}

export function blobChoiceLabel(choice: string): string {
  const key = CHOICE_KEYS[choice as keyof typeof CHOICE_KEYS];
  return key ? t(key) : choice;
}

export function blobChain(): string {
  return [1, 2, 3, 4, 5].map((stage) => blobStageName(stage)).join(' → ');
}

export function blobEaten(): { title: string; body: string } {
  return { title: t('blob.endTitleLose'), body: t('blob.endBodyLose') };
}

export function blobWin(): { title: string; body: string } {
  return { title: t('blob.endTitleWin'), body: t('blob.endBodyWin') };
}

export function blobEndPill(won: boolean): string {
  return won ? t('blob.endPillWin') : t('blob.endPillLose');
}

export function blobRpsOpen(): { pill: string; title: string; copy: string } {
  return {
    pill: t('blob.rpsPill'),
    title: t('blob.rpsTitle'),
    copy: t('blob.rpsCopy'),
  };
}

export function blobRpsTie(choice: string): string {
  return t('blob.rpsTie', { choice: blobChoiceLabel(choice) });
}

export function blobRpsWin(you: string, bot: string): string {
  return t('blob.rpsWin', {
    you: blobChoiceLabel(you),
    bot: blobChoiceLabel(bot),
  });
}

export function blobRpsLose(you: string, bot: string): string {
  return t('blob.rpsLose', {
    you: blobChoiceLabel(you),
    bot: blobChoiceLabel(bot),
  });
}

export function blobHudLine(
  stage: number,
  radius: number,
  speed: number,
  remaining: number,
): string {
  return [
    'BLOB EVOLUTION',
    t('blob.hudStats', {
      stage: blobStageName(stage).toLocaleUpperCase(),
      size: radius.toFixed(1),
      speed: speed.toFixed(1),
    }),
    t('blob.hudLeft', { n: remaining }),
  ].join('\n');
}

function setText(id: string, value: string): void {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

/** Fill the static panels. Title and tagline stay as written. */
export function applyBlobChrome(): void {
  applyDocumentLanguage();
  const back = document.getElementById('hub-back');
  if (back) {
    back.textContent = `← ${t('hub.title')}`;
    back.setAttribute('aria-label', t('blob.backAria'));
  }
  document.getElementById('stick')?.setAttribute('aria-label', t('blob.stickAria'));
  setText('stick-hint', t('blob.stickHint'));
  setText('touch-help', t('blob.touchHelp'));
  setText('start-pill', t('blob.pill'));
  setText('start-blurb', t('blob.startBlurb'));
  setText('start-chain', blobChain());
  setText('start-note', t('blob.note'));
  setText('start-btn', t('blob.start'));
  setText('rps-pill', t('blob.rpsPill'));
  setText('rps-title', t('blob.rpsTitle'));
  setText('rps-copy', t('blob.rpsCopy'));
  setText('rps-hint', t('blob.rpsHint'));
  setText('rps-restart-btn', t('blob.restart'));
  for (const choice of ['rock', 'paper', 'scissors'] as const) {
    const button = document.querySelector(`[data-choice="${choice}"]`);
    if (button) button.textContent = t(CHOICE_KEYS[choice]);
  }
  setText('end-pill', t('blob.endPillLose'));
  setText('end-title', t('blob.endTitleLose'));
  setText('end-copy', t('blob.endBodyLose'));
  setText('restart-btn', t('blob.playAgain'));
  const meta = document.getElementById('blob-meta');
  if (meta) {
    meta.setAttribute(
      'content',
      `Blob Evolution 3D · Eat. Evolve. Ascend. — ${t('hub.blob.blurb')}`,
    );
  }
}

export function blobHudHint(): string {
  return t('blob.hudHint');
}

export function blobRpsLoseTitle(): string {
  return t('blob.rpsLoseTitle');
}

export function blobRpsLoseFallback(): string {
  return t('blob.rpsLoseFallback');
}
