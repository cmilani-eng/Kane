/**
 * SATs Quest spelling bank (Echo Glade). Words are grouped by the STA KS2 GPS test framework
 * Paper 2 spelling content domain (S38–S61), using words from the national curriculum
 * spelling patterns and statutory word lists. Every sentence is written for this game.
 *
 * In the real test the word is read aloud in a sentence and pupils write it. The game reads
 * it with the browser's speech voice; when no voice is available it falls back to picking
 * the correct spelling from three plausible misspellings generated here.
 *
 * Called by: itemBank.ts. Tested by: banks.test.ts
 */
import { shuffle, type Rng } from './satsRandom';
import type { Level, SpellItem } from './satsTypes';

export interface SpellingEntry {
  readonly word: string;
  readonly level: Level;
  readonly code: string;
  readonly sentence: string;
  /** Real-word confusions for homophones; used before generated misspellings. */
  readonly confusions?: readonly string[];
  readonly tip: string;
}

const w = (
  word: string,
  level: Level,
  code: string,
  sentence: string,
  tip: string,
  confusions?: readonly string[],
): SpellingEntry => ({ word, level, code, sentence, tip, ...(confusions ? { confusions } : {}) });

export const SPELLING_BANK: readonly SpellingEntry[] = [
  // level 1
  w('young', 1, 'S40', 'The young dragon flapped its wings for the very first time.', 'The /u/ sound is spelt "ou" in young, like touch and double.'),
  w('double', 1, 'S40', 'The knight ate a double helping of soup after the long ride.', 'The /u/ sound is spelt "ou" in double.'),
  w('touch', 1, 'S40', 'Do not touch the glowing crystal!', 'The /u/ sound is spelt "ou" in touch.'),
  w('myth', 1, 'S39', 'The old myth tells of a city under the sea.', 'The short /i/ sound is spelt "y" in myth, like gym and pyramid.'),
  w('pyramid', 1, 'S39', 'The explorers climbed to the top of the pyramid.', 'The short /i/ sound is spelt "y": pyr-a-mid.'),
  w('treasure', 1, 'S44', 'The map showed where the treasure was buried.', 'Words ending with the /zhuh/ sound are often spelt "-sure": treasure, measure.'),
  w('picture', 1, 'S44', 'The artist painted a picture of the castle.', 'Words ending with the /chuh/ sound are often spelt "-ture": picture, adventure.'),
  w('adventure', 1, 'S44', 'Every adventure begins with a single step.', 'The /chuh/ ending is spelt "-ture": adven-ture.'),
  w('gently', 1, 'S43', 'The fairy gently placed the egg in its nest.', 'For words ending in "-le", swap the "e" for "y" to add -ly: gentle → gently.'),
  w('eight', 1, 'S52', 'There were eight towers around the city.', 'The /ay/ sound is spelt "eigh" in eight, like weight and sleigh.'),

  // level 2
  w('disappear', 2, 'S41', 'The magician made the rabbit disappear.', 'Add the prefix "dis" to "appear" without changing either part: dis + appear.'),
  w('impossible', 2, 'S41', 'Nothing is impossible for a brave adventurer.', 'The prefix "im-" is used before words starting with p: im + possible.'),
  w('information', 2, 'S42', 'The owl gave us important information about the forest.', 'Add "-ation" to the root word: inform + ation.'),
  w('preparation', 2, 'S42', 'The cooks began their preparation for the royal feast.', 'Drop the "e" from prepare before adding "-ation": prepar + ation.'),
  w('decision', 2, 'S45', 'The queen made a wise decision.', 'The /zhun/ ending is spelt "-sion": decide → decision.'),
  w('invasion', 2, 'S45', 'The castle walls were built to stop an invasion.', 'The /zhun/ ending is spelt "-sion": invade → invasion.'),
  w('position', 2, 'S47', 'The guard took up a position by the gate.', 'The /shun/ ending is most often spelt "-tion".'),
  w('competition', 2, 'S47', 'The wizards held a spell-casting competition.', 'The /shun/ ending is spelt "-tion": compet-i-tion.'),
  w('thought', 2, 'S59', 'The troll thought hard about the riddle.', 'The letters "ough" make the /or/ sound in thought, like bought and ought.'),
  w('through', 2, 'S59', 'The fox crept through the dark wood.', 'The letters "ough" make the /oo/ sound in through.'),

  // level 3
  w('dangerous', 3, 'S46', 'Crossing the broken bridge was dangerous.', 'The ending "-ous" means "full of": danger + ous.'),
  w('famous', 3, 'S46', 'The famous sword was kept in a glass case.', 'Drop the "e" from fame before adding "-ous": fam + ous.'),
  w('curious', 3, 'S46', 'The curious kitten peeked inside the cauldron.', 'Curious ends in "-ious": cur-i-ous.'),
  w('stomach', 3, 'S48', "The giant's stomach rumbled loudly.", 'The /k/ sound is spelt "ch" in stomach, like echo and chorus.'),
  w('echo', 3, 'S48', 'Our voices made an echo in the cave.', 'The /k/ sound is spelt "ch" in echo.'),
  w('science', 3, 'S51', 'The young inventor loved science and magic.', 'The /s/ sound is spelt "sc" in science, like scene.'),
  w('scene', 3, 'S51', 'The first scene of the play took place in a forest.', 'The /s/ sound is spelt "sc" in scene.'),
  w('possible', 3, 'S56', 'Is it possible to fly without wings?', 'Possible ends in "-ible" (you cannot make a whole word by taking -ible off).'),
  w('terrible', 3, 'S56', 'A terrible storm swept across the sea.', 'Terrible ends in "-ible" and has a double r.'),
  w('knowledge', 3, 'S60', 'The wise owl shared its knowledge with everyone.', 'Knowledge has a silent "k" and "dge": know + ledge.'),
  w('island', 3, 'S60', 'The pirates sailed to a hidden island.', 'Island has a silent "s": is-land.'),

  // level 4
  w('precious', 4, 'S53', 'The dragon guarded its precious eggs.', 'The /shus/ ending is spelt "-cious" in precious.'),
  w('delicious', 4, 'S53', 'The elves baked a delicious pie.', 'The /shus/ ending is spelt "-cious" in delicious.'),
  w('cautious', 4, 'S53', 'The cautious explorer tested each stone before stepping on it.', 'The /shus/ ending is spelt "-tious" in cautious (from caution).'),
  w('special', 4, 'S54', 'Today is a special day in the kingdom.', 'The /shul/ ending is spelt "-cial" after a vowel: spe-cial.'),
  w('official', 4, 'S54', "The king's official sealed the letter with wax.", 'Official ends in "-cial" and has a double f.'),
  w('essential', 4, 'S54', 'Water is essential for every living thing.', 'The /shul/ ending is spelt "-tial" after a consonant: essen-tial.'),
  w('confidence', 4, 'S55', 'With practice, the young knight grew in confidence.', 'Confident → confidence: the "-ent" ending becomes "-ence".'),
  w('innocent', 4, 'S55', 'The innocent goat had not eaten the crown.', 'Innocent ends in "-ent" and has a double n.'),
  w('receive', 4, 'S58', 'Every hero will receive a golden medal.', 'I before e, except after c: rec-ei-ve.'),
  w('ceiling', 4, 'S58', 'Bats hung from the ceiling of the cave.', 'I before e, except after c: c-ei-ling.'),
  w('machine', 4, 'S49', 'The inventor built a machine that could fly.', 'The /sh/ sound is spelt "ch" in machine, like chef.'),
  w('unique', 4, 'S50', 'Every snowflake is unique.', 'The /k/ sound at the end is spelt "-que": uni-que.'),
  w('tongue', 4, 'S50', 'The dragon flicked out its forked tongue.', 'The /g/ sound at the end is spelt "-gue": ton-gue.'),

  // level 5
  w('referring', 5, 'S57', 'Which page of the spellbook are you referring to?', 'Refer is stressed on "fer", so double the r before -ing: referring.'),
  w('preferred', 5, 'S57', 'The unicorn preferred apples to carrots.', 'Prefer is stressed on "fer", so double the r before -ed: preferred.'),
  w('beginning', 5, 'S38', 'This is only the beginning of our quest.', 'Begin is stressed on "gin", so double the n before -ing: beginning.'),
  w('forgotten', 5, 'S38', 'The forgotten key lay at the bottom of the well.', 'Forget is stressed on "get", so double the t: forgotten.'),
  w('conscious', 5, 'S53', 'The knight was conscious of the danger ahead.', 'Conscious contains "sc" and ends in "-cious": con-sci-ous.'),
  w('ambitious', 5, 'S53', 'The ambitious young wizard wanted to explore the stars.', 'Ambition → ambitious: the "-tion" root keeps a t, so it ends "-tious".'),
  w('independence', 5, 'S55', 'The village celebrated its independence with fireworks.', 'Independent → independence: "-ent" becomes "-ence".'),
  w('obedience', 5, 'S55', 'The dragon was trained in obedience.', 'Obedient → obedience: "-ent" becomes "-ence".'),
  w('rhythm', 5, 'S60', 'The drummers kept a steady rhythm.', 'Rhythm has a silent "h" after the r and no vowels except y: rh-y-thm.'),
  w('solemn', 5, 'S60', 'The ceremony was quiet and solemn.', 'Solemn has a silent "n" at the end, like autumn.'),
  w('stationery', 5, 'S61', 'The scribe bought new stationery: paper, quills and ink.', 'Stationery with an "e" means paper and pens (e for envelopes). Stationary with an "a" means standing still.', ['stationary']),
  w('principal', 5, 'S61', 'The principal reason for the journey was to find the lost crown.', 'Principal (with "pal") means main or most important. A principle is a rule or belief.', ['principle']),
];

const RULES: readonly [RegExp, string][] = [
  [/([bcdfglmnprstz])\1/, '$1'],
  [/([aeiou])([bcdfglmnprt])([aeiou])/, '$1$2$2$3'],
  [/ie/, 'ei'],
  [/ei/, 'ie'],
  [/cious/, 'tious'],
  [/tious/, 'cious'],
  [/ious/, 'ous'],
  [/ous/, 'us'],
  [/tion/, 'sion'],
  [/sion/, 'tion'],
  [/ible/, 'able'],
  [/able/, 'ible'],
  [/ence/, 'ance'],
  [/ent/, 'ant'],
  [/cial/, 'tial'],
  [/tial/, 'cial'],
  [/sc/, 's'],
  [/ch/, 'k'],
  [/que$/, 'k'],
  [/gue$/, 'g'],
  [/ough/, 'uff'],
  [/ough/, 'ow'],
  [/ou/, 'u'],
  [/y/, 'i'],
  [/sure$/, 'zure'],
  [/ture$/, 'cher'],
  [/ly$/, 'ley'],
  [/eigh/, 'ay'],
  [/^kn/, 'n'],
  [/rh/, 'r'],
  [/mn$/, 'm'],
  [/dge/, 'ge'],
  [/ate$/, 'ite'],
  [/([aeiou])$/, ''],
  [/ary$/, 'ery'],
  [/ery$/, 'ary'],
  [/al$/, 'le'],
];

/** Three plausible, distinct misspellings of `word` (real-word confusions first). */
export function misspellings(entry: Pick<SpellingEntry, 'word' | 'confusions'>): string[] {
  const out: string[] = [];
  const addCandidate = (candidate: string): void => {
    if (candidate && candidate !== entry.word && !out.includes(candidate)) out.push(candidate);
  };
  for (const confusion of entry.confusions ?? []) addCandidate(confusion);
  for (const [pattern, replacement] of RULES) {
    if (out.length >= 3) break;
    if (pattern.test(entry.word)) addCandidate(entry.word.replace(pattern, replacement));
  }
  // Generic fallbacks for short words: swap two letters in the middle, add a silent "e",
  // then double the last letter.
  for (let i = 1; out.length < 3 && i < entry.word.length - 2; i++) {
    const chars = [...entry.word];
    [chars[i], chars[i + 1]] = [chars[i + 1]!, chars[i]!];
    addCandidate(chars.join(''));
  }
  if (out.length < 3 && !entry.word.endsWith('e')) addCandidate(`${entry.word}e`);
  if (out.length < 3) addCandidate(entry.word + entry.word.slice(-1));
  return out.slice(0, 3);
}

/** Replace the word in its sentence with a gap, keeping the sentence's capital letter if any. */
export function gapSentence(entry: Pick<SpellingEntry, 'word' | 'sentence'>): string {
  const pattern = new RegExp(`\\b${entry.word}\\b`, 'i');
  return entry.sentence.replace(pattern, '________');
}

export function buildSpellItem(entry: SpellingEntry, rng: Rng): SpellItem {
  return {
    kind: 'spell',
    id: `sp.${entry.word}`,
    key: `sp.${entry.word}`,
    realm: 'spelling',
    level: entry.level,
    code: entry.code,
    marks: 1,
    prompt: 'Listen, then spell the missing word.',
    word: entry.word,
    sentence: entry.sentence,
    gapped: gapSentence(entry),
    options: shuffle(rng, [entry.word, ...misspellings(entry)]),
    explain: [`The word is "${entry.word}".`, entry.tip],
  };
}
