/**
 * SATs Quest reading bank (Story Tower). Every passage is written for this game — no past
 * STA text is reproduced. Questions are tagged with the STA KS2 English reading test
 * framework (2016, current) content domain: 2a vocabulary in context, 2b retrieval,
 * 2c summarising, 2d inference, 2e prediction, 2f structure and purpose, 2g language choices,
 * 2h comparisons within the text. Retrieval (2b) and inference (2d) carry the most marks in
 * the real test, so they appear most often here too.
 *
 * In the source, the first option is the correct one; options are shuffled when built.
 *
 * Called by: itemBank.ts. Tested by: banks.test.ts
 */
import { shuffle, type Rng } from './satsRandom';
import type { ChoiceItem, Level, Passage } from './satsTypes';

export interface ReadingQuestion {
  readonly code: '2a' | '2b' | '2c' | '2d' | '2e' | '2f' | '2g' | '2h';
  readonly prompt: string;
  /** Correct option first. */
  readonly options: readonly string[];
  readonly explain: string;
}

export interface ReadingEntry {
  readonly passage: Passage;
  readonly questions: readonly ReadingQuestion[];
}

const q = (code: ReadingQuestion['code'], prompt: string, options: readonly string[], explain: string): ReadingQuestion => ({
  code,
  prompt,
  options,
  explain,
});

export const READING_BANK: readonly ReadingEntry[] = [
  {
    passage: {
      id: 'rd.lantern',
      level: 1,
      title: 'The Lantern of Pip Hollow',
      genre: 'story',
      paragraphs: [
        'Every night, Wren lit the old lantern at the top of Pip Hollow. Its warm, golden glow showed travellers the safe path through the marsh.',
        'One evening, Wren climbed the hill and found the lantern dark. The little flame had gone, and in its place sat a tiny, shivering moth with silver wings.',
        '"I\'m sorry," whispered the moth. "I was so cold that I drank the light." Wren smiled. "Then we must find a way to keep us both warm."',
        'Wren wrapped the moth in a woolly scarf and hurried down the hill to fetch a spark from the baker\'s oven. Far below, the first traveller of the night was already waiting at the edge of the marsh.',
      ],
    },
    questions: [
      q('2b', 'What did the lantern help travellers to do?',
        ['find the safe path through the marsh', 'cross the river by boat', 'climb the hill quickly', "find the baker's shop"],
        'Paragraph 1 says the glow "showed travellers the safe path through the marsh".'),
      q('2a', 'In paragraph 2, the moth is "shivering". What does this tell you?',
        ['It was very cold.', 'It was very hungry.', 'It was very excited.', 'It was very sleepy.'],
        'Shivering means shaking with cold, and the moth says "I was so cold".'),
      q('2d', 'How does Wren feel about the moth?',
        ['kind and caring', 'angry and upset', 'scared of it', 'bored by it'],
        'Wren smiles and wraps the moth in a woolly scarf, which shows kindness.'),
      q('2e', 'What is Wren most likely to do next?',
        ['bring a spark back to light the lantern', 'go home to bed', 'leave the moth in the marsh', 'close the path for the night'],
        'Wren is fetching a spark, and a traveller is waiting for the light.'),
    ],
  },
  {
    passage: {
      id: 'rd.hatchling',
      level: 2,
      title: 'Caring for a Baby Dragon',
      genre: 'information',
      paragraphs: [
        'Baby dragons, called hatchlings, need lots of care in their first year. Follow this guide to keep your hatchling happy and healthy.',
        'Food\nHatchlings eat five small meals a day. Their favourite foods are roasted pumpkins and warm porridge. Never feed a hatchling cold food, because it can put out the tiny flame in its belly.',
        'Sleep\nA hatchling sleeps for up to sixteen hours a day. Make a nest of dry straw in a warm corner, away from draughts.',
        'Exercise\nFrom three months old, hatchlings need to stretch their wings every morning. Start with short glides from a low wall.',
      ],
    },
    questions: [
      q('2b', 'How many meals a day does a hatchling eat?', ['five', 'three', 'sixteen', 'two'],
        'The Food section says "Hatchlings eat five small meals a day".'),
      q('2b', 'Why should you never feed a hatchling cold food?',
        ['It can put out the flame in its belly.', 'It makes the hatchling sleep too long.', 'Hatchlings only eat pumpkins.', 'It is bad for their wings.'],
        'The Food section gives the reason: "it can put out the tiny flame in its belly".'),
      q('2a', 'Which word in the Sleep section means "cold currents of air"?', ['draughts', 'straw', 'corner', 'nest'],
        'Draughts are cold currents of air, which is why the nest should be away from them.'),
      q('2f', 'Why has the writer used headings such as "Food" and "Sleep"?',
        ['to help the reader find information quickly', 'to tell a story about one dragon', 'to make the text rhyme', 'to show what happens at the end'],
        'Headings split an information text into sections so readers can find what they need.'),
    ],
  },
  {
    passage: {
      id: 'rd.clockmaker',
      level: 3,
      title: "The Clockmaker's Apprentice",
      genre: 'story',
      paragraphs: [
        "Old Mr Tock's shop was full of clocks: tall clocks, tiny clocks, clocks shaped like owls and clocks that sang at midnight. His apprentice, Ezra, had dusted every one of them a thousand times.",
        'But there was one clock Ezra had never touched. It stood behind a velvet curtain, and its hands had not moved for fifty years. "That one is not for winding," Mr Tock always said, tapping his nose.',
        "One stormy afternoon, while Mr Tock was out, a gust of wind blew the curtain aside. The clock's face glittered like frost. Ezra's fingers itched. Just one turn of the key, Ezra thought. What harm could it do?",
        'The key turned with a soft click. At once, every clock in the shop fell silent. Outside the window, raindrops froze in the air, hanging like tiny glass beads. Only Ezra could still move.',
      ],
    },
    questions: [
      q('2d', 'Why do you think Mr Tock tapped his nose when he talked about the clock?',
        ['He was keeping a secret about it.', 'He had a cold.', 'He wanted Ezra to wind it.', 'He thought it was worthless.'],
        'Tapping your nose is a sign that you know a secret, and the clock turns out to be magical.'),
      q('2a', '"Ezra\'s fingers itched." What does this phrase suggest?',
        ['Ezra really wanted to touch the clock.', "Ezra's hands were sore.", 'Ezra was cold.', 'Ezra had been dusting too much.'],
        'If your fingers itch to do something, you badly want to do it. Ezra then thinks about turning the key.'),
      q('2g', '"raindrops froze in the air, hanging like tiny glass beads." Why did the writer compare the raindrops to glass beads?',
        ['to help you picture them stopped and sparkling', 'to show that it was snowing', 'to explain how glass is made', 'to show the rain was falling faster'],
        'The comparison helps you see the raindrops hanging still and shining, because time has stopped.'),
      q('2c', 'Which sentence best sums up the story so far?',
        ['Ezra disobeys Mr Tock, winds a mysterious clock and stops time.', 'Ezra and Mr Tock build a new clock together.', 'A storm breaks every clock in the shop.', 'Mr Tock teaches Ezra how to wind clocks.'],
        'A summary gives the main events: Ezra winds the forbidden clock and time stops.'),
    ],
  },
  {
    passage: {
      id: 'rd.moonmarket',
      level: 4,
      title: 'The Moon Market',
      genre: 'poem',
      paragraphs: [
        'When the town is fast asleep\nand the owls their secrets keep,\ndown the lane on silver feet\ncomes the market of the street.',
        'Stalls of starlight, jars of dreams,\nribbons spun from river streams;\nlanterns sway like sleepy boats\nwhile the sellers hum soft notes.',
        'Bring a wish and not a coin,\nany child is free to join —\nbut be home by morning\'s chime,\nor you\'ll pay with borrowed time.',
      ],
    },
    questions: [
      q('2b', 'When does the Moon Market appear?', ['when the town is asleep', 'at midday', 'when it rains', 'on market day'],
        'The first line says "When the town is fast asleep".'),
      q('2g', '"lanterns sway like sleepy boats". What does this comparison suggest about the lanterns?',
        ['They move gently from side to side.', 'They are very bright.', 'They are floating on water.', 'They are about to fall over.'],
        'Sleepy boats rock slowly, so the lanterns are swaying gently. They are not really on water.'),
      q('2d', 'What do you think "pay with borrowed time" means in the last line?',
        ['Something bad will happen if you stay too long.', 'You must bring money to the market.', 'The market sells clocks.', 'You will get a free gift.'],
        'The line is a warning after "be home by morning\'s chime": staying too long has a cost.'),
      q('2h', 'How is the last verse different from the first two verses?',
        ['It gives the reader a warning.', 'It describes the stalls.', 'It describes the town falling asleep.', 'It lists things for sale.'],
        'The first two verses describe the market; the last one gives a rule and a warning.'),
    ],
  },
  {
    passage: {
      id: 'rd.glassbridge',
      level: 5,
      title: 'The Glass Bridge',
      genre: 'story',
      paragraphs: [
        'The bridge to Ember Peak was made entirely of glass, and it was said that it showed each traveller the thing they feared most. Most people took the long road around the valley, which added three days to the journey. Juniper did not have three days.',
        "At the first step, the glass beneath Juniper's boots clouded and swirled. Shapes formed: a classroom, rows of desks, a blank sheet of paper and a clock ticking far too quickly. Juniper's breath caught. It was only a picture, yet the ticking seemed to echo inside every bone.",
        'Halfway across, Juniper stopped and looked down properly. The clock in the glass was ticking, yes — but the paper was no longer blank. Line by line, answers were appearing, written in handwriting Juniper recognised. "That\'s mine," Juniper whispered. "I know this."',
        'The swirling glass cleared until it was as still as a frozen lake. By the time Juniper reached the far side, the fear had not vanished completely, but it had shrunk to something small enough to carry.',
      ],
    },
    questions: [
      q('2d', 'Why did Juniper choose to cross the glass bridge?',
        ['There was not enough time to take the long road.', 'Juniper was not afraid of anything.', 'The long road was closed.', 'Juniper wanted to see the valley.'],
        'The long road adds three days, and "Juniper did not have three days".'),
      q('2g', '"the ticking seemed to echo inside every bone." What does this tell you about how Juniper felt?',
        ['very anxious', 'very sleepy', 'very cold', 'very proud'],
        'Feeling the ticking through your whole body shows how worried Juniper was about the clock.'),
      q('2h', 'How does the glass change between paragraph 2 and paragraph 4?',
        ['It goes from cloudy and swirling to clear and still.', 'It goes from clear to cloudy.', 'It cracks and then mends itself.', 'It turns from glass into ice.'],
        'In paragraph 2 it "clouded and swirled"; in paragraph 4 it is "as still as a frozen lake" — a comparison, not real ice.'),
      q('2d', 'Why did Juniper whisper "I know this"?',
        ['Juniper recognised the answers and felt more confident.', 'Juniper had crossed the bridge before.', 'Juniper was talking to the clock.', 'Juniper wanted someone else to hear.'],
        'The answers were in handwriting Juniper recognised, so Juniper realised the work was within reach.'),
      q('2c', 'Which statement best describes the main idea of the passage?',
        ['Facing a fear can make it feel smaller.', 'Glass bridges are dangerous.', 'It is better to take the long road.', 'Clocks always tick too quickly.'],
        'By the end, the fear "had shrunk to something small enough to carry".'),
    ],
  },
];

/** Rasch difficulty for a reading question: the passage level, nudged by question type. */
export function readingDifficulty(level: Level, code: ReadingQuestion['code']): number {
  const nudge = code === '2b' ? -0.5 : code === '2c' || code === '2h' ? 0.5 : code === '2a' ? 0 : 0.3;
  return level - 3 + nudge;
}

export function readingEntry(passageId: string): ReadingEntry | undefined {
  return READING_BANK.find((e) => e.passage.id === passageId);
}

export function buildReadingItems(entry: ReadingEntry, rng: Rng): ChoiceItem[] {
  return entry.questions.map((question, i) => {
    const order = shuffle(rng, question.options.map((_, k) => k));
    return {
      kind: 'choice',
      id: `${entry.passage.id}.q${i + 1}`,
      key: `${entry.passage.id}.q${i + 1}`,
      realm: 'reading',
      level: entry.passage.level,
      code: question.code,
      marks: 1,
      prompt: question.prompt,
      options: order.map((k) => question.options[k]!),
      answer: order.indexOf(0),
      passageId: entry.passage.id,
      explain: [question.explain],
    };
  });
}
