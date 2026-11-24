/**
 * SATs Quest words (en-GB only). The game teaches the English national curriculum, so by the
 * owner's decision its copy stays in British English and is not in the shared i18n catalogue;
 * only the picker card blurb (`hub.sats.blurb`) is translated.
 */
import type { HeroColour, HeroId } from './satsSave';
import type { BandOrUnplaced, RealmId, TimerMode } from './satsTypes';

export const GAME_TITLE = 'SATs Quest';
export const GAME_TAGLINE = 'Learn. Quest. Beat the clock.';

export interface RealmCopy {
  readonly name: string;
  readonly boss: string;
  readonly subject: string;
  readonly blurb: string;
  readonly icon: string;
}

export const REALM_COPY: Readonly<Record<RealmId, RealmCopy>> = {
  arithmetic: {
    name: 'Number Forest',
    boss: 'the Riddle Troll',
    subject: 'Maths · arithmetic',
    blurb: 'Quick calculations, like SATs maths Paper 1.',
    icon: '🌲',
  },
  reasoning: {
    name: 'Puzzle Peaks',
    boss: 'the Stone Giant',
    subject: 'Maths · reasoning',
    blurb: 'Word problems, like SATs maths Papers 2 and 3.',
    icon: '⛰️',
  },
  grammar: {
    name: 'Word Castle',
    boss: 'the Grammar Gryphon',
    subject: 'English · grammar and punctuation',
    blurb: 'Word classes, sentences and punctuation, like the GPS test.',
    icon: '🏰',
  },
  spelling: {
    name: 'Echo Glade',
    boss: 'the Echo Sprite',
    subject: 'English · spelling',
    blurb: 'Listen to a word in a sentence and spell it, like the spelling test.',
    icon: '🍃',
  },
  reading: {
    name: 'Story Tower',
    boss: 'the Story Sphinx',
    subject: 'English · reading',
    blurb: 'Read a story, poem or guide and answer questions about it.',
    icon: '📜',
  },
};

export const MOCK_COPY = {
  name: 'The Clockwork Dragon',
  blurb: 'A mixed mock round at real SATs pace, with no spells. Opens when every realm has had its trial.',
  icon: '🐉',
} as const;

/** Friendly rank, plus the plain meaning for grown-ups. */
export const BAND_COPY: Readonly<Record<BandOrUnplaced, { readonly rank: string; readonly plain: string }>> = {
  unplaced: { rank: 'Not tested yet', plain: 'Take the trial to find your starting chapter.' },
  towards: { rank: 'Apprentice', plain: 'Working towards the expected standard' },
  expected: { rank: 'Adventurer', plain: 'Working at the expected standard' },
  higher: { rank: 'Champion', plain: 'Working towards the higher standard (110+)' },
};

export const HERO_COPY: Readonly<Record<HeroId, { readonly name: string; readonly icon: string; readonly line: string }>> = {
  knight: { name: 'Knight', icon: '🛡️', line: 'Brave and steady.' },
  wizard: { name: 'Wizard', icon: '🪄', line: 'Clever and curious.' },
  fairy: { name: 'Fairy', icon: '🧚', line: 'Quick and bright.' },
  ranger: { name: 'Ranger', icon: '🏹', line: 'Calm and sharp-eyed.' },
};

export const COLOUR_HEX: Readonly<Record<HeroColour, string>> = {
  rose: '#f472b6',
  amber: '#f59e0b',
  emerald: '#10b981',
  sky: '#38bdf8',
  violet: '#a78bfa',
  silver: '#cbd5e1',
};

export const TIMER_COPY: Readonly<Record<TimerMode, { readonly label: string; readonly help: string }>> = {
  standard: { label: 'Standard time', help: 'The clock gets closer to real SATs pace as you move up the chapters.' },
  extra: { label: 'Extra time (+25%)', help: 'A quarter more time, like the extra-time access arrangement in the real tests.' },
  off: { label: 'No timer', help: 'Practise without a clock. Stars still count your marks.' },
};

export const COPY = {
  back: '← Games',
  backAria: 'Back to the games',
  loading: 'Opening the storybook…',
  signInTitle: 'Sign in to start your quest',
  signInBody: 'Sign in with your account so your quest is saved, and you can carry on later from any device.',
  signIn: 'Sign in',
  playDevice: 'Play on this device',
  playDeviceNote: 'Progress is only kept in this browser.',
  heroTitle: 'Choose your hero',
  heroBody: 'Every hero plays the same way. Pick the one you like best, and a colour.',
  heroGo: 'Begin the quest',
  homePill: 'The Kingdom of Quill',
  homeBody: 'Five realms, five guardians, one clock. Beat each guardian by answering SATs-style questions before the Moon Hourglass runs out.',
  trialCta: 'Start the Royal Trial',
  trialCtaMore: 'Continue the Royal Trial',
  trialExplain:
    'The Royal Trial is a short test in each realm. It finds the right chapter for you to start on. Just do your best: it is fine to find some questions hard.',
  play: 'Play',
  chapter: 'Chapter',
  locked: 'Locked',
  takeTrial: 'Take the trial',
  retakeTrial: 'Retake the trial',
  settings: 'Settings',
  aboutData: 'About your data',
  xp: 'XP',
  savedCloud: 'Saved to your account',
  savedDevice: 'Saved on this device',
  saveFailed: 'Saved on this device. It will go to your account next time you are online.',
  trialPill: 'Royal Trial',
  trialIntroBody: (count: string) => `${count} Answer as well as you can before the sand runs out. You will not see right or wrong answers until the end.`,
  begin: 'Begin',
  notNow: 'Not now',
  next: 'Next',
  check: 'Check',
  finish: 'See results',
  timeUpQuestion: 'Time is up for that one. On to the next!',
  saved: 'Answer saved.',
  unreadable: 'That does not look like an answer yet. Check it and try again.',
  hit: (marks: number) => `Hit! ${marks} mark${marks === 1 ? '' : 's'}`,
  blocked: 'Blocked!',
  answerWas: (answer: string) => `The answer was ${answer}.`,
  howTo: 'How to do it',
  askOwl: 'Ask Owl to explain',
  owlThinking: 'Owl is thinking…',
  owlUnavailable: 'Owl is resting. The steps above show how to do it.',
  hintSpell: 'Hint',
  slowSpell: 'Slow time',
  stardust: 'Stardust',
  hearWord: 'Hear it again',
  typeWord: 'Type the word',
  noVoice: 'This device cannot read words aloud, so choose the correct spelling.',
  chooseSpelling: 'Choose the correct spelling.',
  cannotHear: "Can't hear it? Choose instead",
  passage: 'Read this first',
  timeLeft: 'Time left',
  noTimer: 'No timer',
  bossHealth: 'Guardian',
  paceAhead: 'Ahead of the Pace Owl',
  paceBehind: 'Behind the Pace Owl',
  paceLevel: 'Level with the Pace Owl',
  resultPill: 'Quest results',
  hourglassOut: 'The Moon Hourglass ran out.',
  allAnswered: 'You answered every question.',
  marksLine: (marks: number, total: number) => `${marks} out of ${total} marks`,
  xpLine: (xp: number) => `+${xp} XP`,
  unlocked: (chapter: number) => `Chapter ${chapter} is now open!`,
  tryAgain: 'Try again',
  nextChapter: 'Next chapter',
  toKingdom: 'Back to the kingdom',
  trialDoneTitle: (realm: string) => `${realm}: trial complete`,
  trialDoneBody: (rank: string, chapter: number) => `Your rank here is ${rank}. Your quest starts at chapter ${chapter}, and earlier chapters stay open for practice.`,
  nextGate: (realm: string) => `Next trial: ${realm}`,
  settingsTitle: 'Settings',
  timerHeading: 'Timer',
  dyslexiaFont: 'Easier-to-read text',
  dyslexiaHelp: 'A clearer font with more space between letters and lines, on a cream background.',
  reduceMotion: 'Less movement',
  reduceMotionHelp: 'Turns off shaking and floating effects.',
  done: 'Done',
  aboutTitle: 'About your data',
  aboutBody: [
    'We save: the hero you chose, your rank and chapters in each realm, your stars and XP, your settings, and how many questions you have tried and got right in each topic.',
    'We do not save: your answers, your real name, your age or your school.',
    'Only you can see your quest, when you are signed in. Nobody else, including other players, can see it.',
    'When "Ask Owl" is switched on, only the sum and the answers are sent to the computer that writes the explanation — never your name or anything about you.',
    'You can delete everything SATs Quest has saved at any time.',
  ],
  deleteData: 'Delete my SATs Quest data',
  deleteConfirmTitle: 'Delete your quest?',
  deleteConfirmBody: 'This removes your hero, ranks, stars, XP and settings from your account and this device. It cannot be undone.',
  deleteYes: 'Yes, delete it',
  deleteNo: 'No, keep it',
  deleted: 'Your SATs Quest data has been deleted.',
  deleteFailed: 'We could not reach your account. Please try again when you are online.',
  practiceNote: 'Ranks are practice estimates to help you choose chapters. They are not real SATs scores.',
} as const;
