/**
 * SATs Quest grammar and punctuation bank (Word Castle). Hand-written for this game, tagged
 * with the STA KS2 English grammar, punctuation and spelling test framework (2016, current)
 * Paper 1 content domain references (G1–G7). Most real Paper 1 questions are selected
 * response, so these are "tick one" and "tap the word" questions.
 *
 * In the source, the first option of a choice question is the correct one; options are
 * shuffled when the item is built. No question is copied from a past STA paper.
 *
 * Called by: itemBank.ts. Tested by: banks.test.ts
 */
import { shuffle, type Rng } from './satsRandom';
import type { ChoiceItem, Level, TapWordItem } from './satsTypes';

export interface GpsChoiceEntry {
  readonly id: string;
  readonly level: Level;
  readonly code: string;
  readonly kind: 'choice';
  readonly prompt: string;
  /** Correct option first. */
  readonly options: readonly string[];
  readonly explain: readonly string[];
}

export interface GpsTapEntry {
  readonly id: string;
  readonly level: Level;
  readonly code: string;
  readonly kind: 'tapWord';
  readonly prompt: string;
  readonly sentence: string;
  /** The word to tap, exactly as it appears in the sentence (including any punctuation). */
  readonly target: string;
  readonly explain: readonly string[];
}

export type GpsEntry = GpsChoiceEntry | GpsTapEntry;

const c = (
  id: string,
  level: Level,
  code: string,
  prompt: string,
  options: readonly string[],
  ...explain: string[]
): GpsChoiceEntry => ({ id, level, code, kind: 'choice', prompt, options, explain });

const tap = (
  id: string,
  level: Level,
  code: string,
  prompt: string,
  sentence: string,
  target: string,
  ...explain: string[]
): GpsTapEntry => ({ id, level, code, kind: 'tapWord', prompt, sentence, target, explain });

export const GPS_BANK: readonly GpsEntry[] = [
  // ---------------------------------------------------------------- level 1
  tap('gps.noun1', 1, 'G1.1', 'Tap the noun.', 'The brave knight rode quickly.', 'knight',
    'A noun names a person, place, animal or thing.', '"Knight" names a person. "Brave" is an adjective, "rode" is a verb and "quickly" is an adverb.'),
  tap('gps.verb1', 1, 'G1.2', 'Tap the verb.', 'The fairy sings a sweet song.', 'sings',
    'A verb is a doing or being word.', '"Sings" tells you what the fairy does.'),
  tap('gps.adj1', 1, 'G1.3', 'Tap the adjective.', 'A huge dragon slept in the cave.', 'huge',
    'An adjective describes a noun.', '"Huge" describes the dragon.'),
  c('gps.question1', 1, 'G2.2', 'Which sentence is a question?',
    ['Where is the magic key?', 'Find the magic key.', 'What a shiny key that is!', 'The key is under the stone.'],
    'A question asks something and ends with a question mark.'),
  c('gps.command1', 1, 'G2.3', 'Which sentence is a command?',
    ['Close the castle gate.', 'The gate is closed.', 'Is the gate closed?', 'How tall the gate is!'],
    'A command tells someone to do something. It usually starts with a bossy (imperative) verb, like "Close".'),
  c('gps.capitals1', 1, 'G5.1', 'Which sentence uses capital letters correctly?',
    ['On Monday, Robin visited the castle.', 'On monday, Robin visited the castle.', 'on Monday, robin visited the Castle.', 'On Monday, robin visited the castle.'],
    'Use a capital letter to start a sentence and for names of people and days of the week.'),
  c('gps.contraction1', 1, 'G5.8', 'Which word uses an apostrophe correctly to show a missing letter?',
    ["didn't", "did'nt", "didnt'", "di'dnt"],
    'The apostrophe goes where the letter is missing: did not → didn\'t (the "o" is missing).'),
  c('gps.so1', 1, 'G3.3', 'Which word best completes the sentence?\nThe troll was hungry, ___ he ate all the soup.',
    ['so', 'but', 'or', 'if'],
    '"So" is a co-ordinating conjunction that shows a result: he was hungry, so he ate.'),
  c('gps.past1', 1, 'G4.1a', 'Which verb completes the sentence in the simple past tense?\nYesterday, the wizard ___ a spell.',
    ['cast', 'casts', 'will cast', 'is casting'],
    '"Yesterday" tells you it already happened, so use the simple past: cast.'),
  c('gps.listcommas1', 1, 'G5.5', 'Which sentence uses commas correctly?',
    ['We packed bread, cheese, apples and a map.', 'We packed, bread cheese apples and a map.', 'We packed bread cheese, apples, and, a map.', 'We, packed bread, cheese apples and a map.'],
    'Use commas to separate items in a list. The last two items are joined by "and".'),

  // ---------------------------------------------------------------- level 2
  tap('gps.adverb2', 2, 'G1.6', 'Tap the adverb.', 'The owl flew silently over the forest.', 'silently',
    'An adverb tells you more about a verb: how, when, where or how often.', '"Silently" tells you how the owl flew.'),
  tap('gps.prep2', 2, 'G1.7', 'Tap the preposition.', 'The cat hid under the bridge.', 'under',
    'A preposition shows where or when something is in relation to something else.', '"Under" shows where the cat hid.'),
  tap('gps.pronoun2', 2, 'G1.5', 'Tap the pronoun.', 'The giants said they were hungry.', 'they',
    'A pronoun takes the place of a noun.', '"They" takes the place of "the giants".'),
  c('gps.determiner2', 2, 'G1.8', 'Which word in this sentence is a determiner?\nThose dragons guard every bridge.',
    ['every', 'dragons', 'guard', 'bridge'],
    'A determiner comes before a noun and tells you which one or how many.', '"Every" comes before "bridge". ("Those" is also a determiner, but it is not one of the options.)'),
  c('gps.exclaim2', 2, 'G2.4', 'Which sentence is an exclamation?',
    ['What an amazing castle this is!', 'Is this an amazing castle?', 'Build an amazing castle.', 'This castle is amazing.'],
    'An exclamation starts with "What" or "How", contains a verb and ends with an exclamation mark.'),
  c('gps.speech2', 2, 'G5.7', 'Which sentence is punctuated correctly?',
    ['"Follow me," said the fox.', '"Follow me" said the fox.', 'Follow me, "said the fox."', '"Follow me, said the fox."'],
    'Inverted commas go around the words that are spoken. The comma goes inside them, before the closing inverted commas.'),
  c('gps.possess2', 2, 'G5.8', 'Which sentence uses an apostrophe correctly?',
    ["The dragon's wings were green.", "The dragons wing's were green.", 'The dragon,s wings were green.', "The dragons' wing's were green."],
    'To show something belongs to one owner, add an apostrophe and s: the dragon\'s wings.'),
  c('gps.progressive2', 2, 'G4.1b', 'Which sentence is in the present progressive tense?',
    ['The elves are building a boat.', 'The elves built a boat.', 'The elves have built a boat.', 'The elves will build a boat.'],
    'The present progressive uses "am", "is" or "are" with a verb ending in -ing: are building.'),
  c('gps.because2', 2, 'G3.4', 'Which word is a subordinating conjunction?\nWe stayed inside because the storm was wild.',
    ['because', 'We', 'inside', 'wild'],
    'A subordinating conjunction starts a subordinate clause. "Because" introduces the reason we stayed inside.'),
  c('gps.prefix2', 2, 'G6.2', 'Which prefix makes this word mean the opposite?\n___appear',
    ['dis', 'mis', 're', 'pre'],
    'The prefix "dis-" means "not" or "the opposite of": disappear.'),

  // ---------------------------------------------------------------- level 3
  c('gps.fronted3', 3, 'G1.6a', 'Which sentence has a fronted adverbial?',
    ['Before sunrise, the knight saddled the horse.', 'The knight saddled the horse before sunrise.', 'The knight, who was tired, saddled the horse.', 'The knight saddled the horse and rode away.'],
    'A fronted adverbial is an adverbial at the start of a sentence, usually followed by a comma. "Before sunrise" tells you when.'),
  c('gps.frontedcomma3', 3, 'G5.6a', 'Which sentence has the comma in the correct place?',
    ['After the feast, the guests danced.', 'After, the feast the guests danced.', 'After the feast the, guests danced.', 'After the feast the guests, danced.'],
    'Put a comma after a fronted adverbial. "After the feast" is the fronted adverbial.'),
  c('gps.relclause3', 3, 'G3.1a', 'Which sentence contains a relative clause?',
    ['The map, which was torn, showed the way.', 'The torn map showed the way.', 'The map showed the way to the castle.', 'Because it was torn, the map was hard to read.'],
    'A relative clause adds information about a noun and starts with a relative pronoun such as which, who or that.'),
  tap('gps.relpron3', 3, 'G1.5b', 'Tap the relative pronoun.', 'The wizard who lives on the hill is kind.', 'who',
    'A relative pronoun (who, which, that, whose, where, when) starts a relative clause.', '"Who" starts the clause "who lives on the hill", which tells you more about the wizard.'),
  c('gps.modal3', 3, 'G4.1c', 'Which word is a modal verb?\nYou should take a lantern into the cave.',
    ['should', 'take', 'lantern', 'into'],
    'Modal verbs (can, could, will, would, shall, should, may, might, must) show how likely or necessary something is.'),
  c('gps.perfect3', 3, 'G4.1d', 'Which sentence is in the present perfect tense?',
    ['The goblins have finished their dinner.', 'The goblins finished their dinner.', 'The goblins are finishing their dinner.', 'The goblins had finished their dinner.'],
    'The present perfect uses "has" or "have" with a past participle: have finished. ("Had finished" is the past perfect.)'),
  c('gps.nounphrase3', 3, 'G3.2', 'Which of these is an expanded noun phrase?',
    ['the tiny silver key', 'ran quickly', 'under the bed', 'and then'],
    'An expanded noun phrase is a noun with extra words that describe it: the tiny silver key.'),
  c('gps.brackets3', 3, 'G5.9', 'Which sentence uses brackets correctly?',
    ['The castle (built long ago) stood on the hill.', 'The castle built (long ago stood) on the hill.', '(The castle) built long ago stood on the hill.', 'The castle built long ago (stood on the hill.'],
    'Brackets go around extra information. The sentence must still make sense if you take the bracketed words out.'),
  c('gps.standard3', 3, 'G7.1', 'Which sentence is written in Standard English?',
    ['We were tired after the long walk.', 'We was tired after the long walk.', 'We is tired after the long walk.', 'Us were tired after the long walk.'],
    'In Standard English, "we" goes with "were": we were.'),
  c('gps.synonym3', 3, 'G6.1', 'Which word is closest in meaning to "enormous"?',
    ['gigantic', 'tiny', 'quick', 'quiet'],
    'Synonyms are words with the same or nearly the same meaning. Enormous and gigantic both mean very big.'),

  // ---------------------------------------------------------------- level 4
  c('gps.passive4', 4, 'G4.4', 'Which sentence is written in the passive voice?',
    ['The bridge was built by the trolls.', 'The trolls built the bridge.', 'The trolls are building the bridge.', 'The trolls will build a bridge.'],
    'In the passive voice, the thing the action happens to comes first: the bridge was built (by the trolls).'),
  c('gps.object4', 4, 'G1.9', 'What is the object of this sentence?\nThe unicorn chased the butterfly.',
    ['the butterfly', 'The unicorn', 'chased', 'chased the'],
    'The subject does the action (the unicorn). The object has the action done to it (the butterfly).'),
  c('gps.colon4', 4, 'G5.10', 'Which sentence uses a colon correctly?',
    ['You will need three things: a map, a torch and a rope.', 'You will need: three things a map, a torch and a rope.', 'You will need three: things a map, a torch and a rope.', 'You: will need three things a map, a torch and a rope.'],
    'A colon can introduce a list. The words before the colon must make a complete clause.'),
  c('gps.semicolon4', 4, 'G5.11', 'Which sentence uses a semi-colon correctly?',
    ['The storm was fierce; the ship rocked wildly.', 'The storm; was fierce the ship rocked wildly.', 'The storm was; fierce the ship rocked wildly.', 'The storm was fierce the ship; rocked wildly.'],
    'A semi-colon joins two closely linked main clauses. Each side could be a sentence on its own.'),
  c('gps.hyphen4', 4, 'G5.13', 'Which sentence uses a hyphen correctly?',
    ['The well-known wizard waved.', 'The well known-wizard waved.', 'The-well known wizard waved.', 'The well known wizard-waved.'],
    'A hyphen joins words that work together to describe a noun: a well-known wizard.'),
  c('gps.formal4', 4, 'G7.3', 'Which sentence is the most formal?',
    ['Please ensure that the gate is locked.', 'Make sure you lock the gate, OK?', "Don't forget the gate!", 'Gate locked? Cool.'],
    'Formal writing avoids chatty words and contractions, and uses full sentences.'),
  c('gps.subclause4', 4, 'G3.4', 'Which part of this sentence is the subordinate clause?\nAlthough it was late, the fairies kept dancing.',
    ['Although it was late', 'the fairies kept dancing', 'it was', 'kept dancing'],
    'A subordinate clause starts with a subordinating conjunction (here "although") and does not make sense on its own.'),
  tap('gps.det4', 4, 'G1.8', 'Tap the determiner.', 'Several owls watched from tall towers.', 'Several',
    'A determiner comes before a noun and tells you which one or how many.', '"Several" tells you how many owls.'),
  c('gps.antonym4', 4, 'G6.1', 'Which word is an antonym of "ancient"?',
    ['modern', 'old', 'broken', 'golden'],
    'An antonym is a word with the opposite meaning. Ancient means very old; modern means new.'),
  c('gps.pluralpossess4', 4, 'G5.8', 'Which sentence shows that the cloaks belong to more than one wizard?',
    ["The wizards' cloaks were blue.", "The wizard's cloaks were blue.", "The wizards cloak's were blue.", "The wizard's cloak's were blue."],
    'For a plural ending in s, put the apostrophe after the s: the wizards\' cloaks.'),

  // ---------------------------------------------------------------- level 5
  c('gps.subjunctive5', 5, 'G4.3', 'Which sentence uses the subjunctive form?',
    ['If I were a dragon, I would fly to the moon.', 'If I was a dragon, I would fly to the moon.', 'If I am a dragon, I will fly to the moon.', 'When I was a dragon, I flew to the moon.'],
    'The subjunctive uses "were" instead of "was" for imagined situations: If I were…'),
  c('gps.subjunctiveBe5', 5, 'G4.3', 'Which verb completes the sentence in the subjunctive form?\nThe queen insists that every knight ___ on time.',
    ['be', 'is', 'are', 'was'],
    'After words like "insist that" or "demand that", the subjunctive uses the base form of the verb: that every knight be on time.'),
  c('gps.passiveSwap5', 5, 'G4.4', 'Which sentence is the passive version of this sentence?\nThe giant lifted the boulder.',
    ['The boulder was lifted by the giant.', 'The giant was lifting the boulder.', 'The boulder lifted the giant.', 'The giant had lifted the boulder.'],
    'To make a sentence passive, the object (the boulder) becomes the subject: the boulder was lifted by the giant.'),
  c('gps.dash5', 5, 'G5.12', 'Which sentence uses a dash correctly?',
    ['The door creaked open – someone was inside.', 'The door – creaked open someone was inside.', 'The – door creaked open someone was inside.', 'The door creaked – open someone was inside.'],
    'A single dash can mark the boundary between two main clauses. Each side makes sense on its own.'),
  c('gps.lightVerb5', 5, 'G1.2', 'In which sentence is "light" used as a verb?',
    ['Please light the candle.', 'The light was bright.', 'This bag is light.', 'Turn on the light.'],
    'A word\'s class depends on its job in the sentence. In "light the candle", light is something you do, so it is a verb.'),
  c('gps.tense5', 5, 'G4.2', 'Which sentence uses the same tense all the way through?',
    ['The wolf ran to the door and knocked loudly.', 'The wolf ran to the door and knocks loudly.', 'The wolf runs to the door and knocked loudly.', 'The wolf will run to the door and knocked loudly.'],
    'Keep verbs in the same tense unless the time changes: ran … knocked (both simple past).'),
  c('gps.parenthesis5', 5, 'G5.9', 'Which sentence uses commas to show parenthesis correctly?',
    ['The castle, which stood on a hill, was empty.', 'The castle which, stood on a hill was empty.', 'The castle which stood, on a hill, was empty.', 'The, castle which stood on a hill was empty.'],
    'Commas for parenthesis go around the extra information. Take it out and the sentence still makes sense: The castle was empty.'),
  c('gps.suffix5', 5, 'G6.3', 'Which suffix turns "happy" into a noun?',
    ['-ness', '-ly', '-er', '-ful'],
    'Adding "-ness" makes a noun: happy → happiness. (Change the y to i first.)'),
  c('gps.subject5', 5, 'G1.9', 'What is the subject of this sentence?\nOver the hills flew a golden eagle.',
    ['a golden eagle', 'the hills', 'flew', 'Over'],
    'The subject is who or what does the verb. Who flew? A golden eagle — even though it comes after the verb here.'),
  c('gps.formalWord5', 5, 'G7.2', 'Which word or phrase is the most formal way to complete this sentence?\nWe need to ___ the problem.',
    ['resolve', 'sort out', 'fix up', 'deal with'],
    '"Resolve" is a formal word. Phrases like "sort out" are more informal.'),
];

/** Build a playable item. Choice options are shuffled so the answer is not always first. */
export function buildGpsItem(entry: GpsEntry, rng: Rng): ChoiceItem | TapWordItem {
  if (entry.kind === 'tapWord') {
    const tokens = entry.sentence.split(' ');
    return {
      kind: 'tapWord',
      id: entry.id,
      key: entry.id,
      realm: 'grammar',
      level: entry.level,
      code: entry.code,
      marks: 1,
      prompt: entry.prompt,
      tokens,
      answer: tokens.indexOf(entry.target),
      explain: entry.explain,
    };
  }
  const order = shuffle(rng, entry.options.map((_, i) => i));
  return {
    kind: 'choice',
    id: entry.id,
    key: entry.id,
    realm: 'grammar',
    level: entry.level,
    code: entry.code,
    marks: 1,
    prompt: entry.prompt,
    options: order.map((i) => entry.options[i]!),
    answer: order.indexOf(0),
    explain: entry.explain,
  };
}
