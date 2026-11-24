# SATs Quest: a gamified KS2 SATs practice game (plan)

Status: the owner's decisions are recorded below. Facts were checked on 23 November 2026
against the sources linked at the bottom.

## Owner decisions (23 November 2026)

| Topic | Decision |
|---|---|
| Theme | Fairy-tale fantasy that works for boys and girls. The Paper Boss mechanics are kept and re-skinned as a storybook kingdom. |
| Subjects | All tested subjects, with difficulty rising as the child progresses. |
| Realms | Number Forest (arithmetic), Puzzle Peaks (reasoning), Word Castle (grammar and punctuation), Echo Glade (spelling) and Story Tower (reading). |
| Final boss | A Clockwork Dragon mock paper. |
| Audience | 10 to 11-year-olds. |
| Accounts | Each child signs in with their own existing email + password login, or as a guest. |
| Adult gate | None. The owner chose this over the recommended adult gate. |
| Visibility | The game appears in the public picker as experimental. |
| Data handling kept anyway | Data minimisation, an in-game "About your data" note and "Delete my SATs data". These add no gate. |
| Translation | The game content and UI stay in British English. Only the picker card is translated. |
| LLM | The Ollama proxy is built and tested, with the client flag off until it's deployed. |

**Open compliance risk, recorded at the owner's request:**
- Under-13s sign up themselves, with no parental authorisation.
- The shared sign-up panel still says "13+ framing".
- Privacy and Terms are still placeholders.

A qualified UK GDPR and Children's Code review is recommended before the game is promoted to
children. Section 8 has the original recommendation.

## 1. What the real tests look like (verified)

| Test | Papers | Marks | Time |
|---|---|---|---|
| Maths | Paper 1 arithmetic | 40 | 30 min |
| | Papers 2 and 3 reasoning | 35 each | 40 min each |
| English GPS | Paper 1 questions (grammar, punctuation, vocabulary) | 50 | 45 min |
| | Paper 2 spelling (20 words) | 20 | about 15 min, not strictly timed |
| Reading | one booklet | 50 | 60 min (not in the MVP) |

- **Scaled scores** run from 80 to 120. 100 or more means the expected standard was met.
  The raw marks needed change every year. In maths, 100 needed 58/110 in 2025 and
  56/110 in 2026. 110 needed 95/110 in 2025 and 94/110 in 2026.
- **Paper 1 arithmetic** is all context-free constructed-response calculations. Most are
  worth 1 mark. Long multiplication and long division are worth 2 marks, and the second
  mark is for the formal method.
- The 2016 test frameworks are still the current ones. Arrangements for 2026 to 2027 are
  unchanged after the Curriculum and Assessment Review.
- **Bands.** "Working towards / at the expected standard / greater depth" are the
  *teacher-assessment* labels for **writing**. The tests report "met / not met the expected
  standard", and DfE statistics call 110+ the "higher standard". The game therefore uses
  three test-shaped bands:

  | Band | What it means |
  |---|---|
  | **Working towards** | Below the expected-standard pace and accuracy |
  | **Expected** | At the expected standard |
  | **Higher** | Near the higher standard |

  The game never claims to predict a child's real scaled score.

## 2. Game concepts

**A. Paper Boss (recommended).** Each run is a raid on a boss made from a real paper's shape.
The boss's health is the marks: a 10-mark minion, a 20-mark captain, then the full 40-mark
Arithmetic Titan. Each correct answer hits the boss for that question's marks, so long
multiplication hits for 2.

A **Pace Ghost** walks the track at the real pace: 30 minutes for 40 marks, or 45 seconds per
mark. The ghost moves more slowly at the lower bands. When a child answers faster than the
ghost, the spare seconds go into a **Time Bank**. They can spend it on a "Freeze" that stops
the ghost for 15 seconds on a hard question.

This teaches the real exam habit of banking time on easy questions to spend on hard ones,
and it never punishes a wrong answer with lost time.

**B. Time Bank Tower.** An endless climb with one question per floor. Right answers add
seconds to a draining clock, and the best floor is your score. It's simple and replayable,
but it's further from the real paper's shape and has no "finish the paper" moment.

**C. Lane Runner.** Each obstacle is a multiple-choice gate. It's fun for selected-response
GPS questions, but it doesn't suit arithmetic, where children type an answer. Constant
motion is also hard on reduced-motion users and dyslexic readers.

## 3. MVP slice

The recommended slice is **Maths Paper 1 arithmetic**.

- Every item is generated from parameters and marked in code. The LLM is never needed for
  an answer key.
- Item templates are tagged with the official content-domain references, such as 6C7a long
  multiplication, 6C7b long division, 6C9 order of operations, 6F4 adding and subtracting
  fractions, 6F5a/b multiplying and dividing fractions, 6F9 decimals, 6R2 percentages, and
  5C5d squares and cubes.
- No past STA paper questions are reproduced.

GPS selected-response questions (word classes, punctuation, tense) come next, from a curated
seed bank. LLM-written variants come after that, behind validation.

## 4. Question types and input

- **Answers.** Answers are integers, decimals or fractions (proper, improper or mixed).
  A fraction answer accepts any equivalent value, matching the usual STA arithmetic
  mark-scheme practice of accepting equivalents. A template can require simplest form if
  needed.
- **Keypad.** An on-screen keypad is drawn in Phaser, with 48px keys. It has digits, a
  decimal point, a minus sign, a fraction key that switches to whole/numerator/denominator
  boxes, backspace and enter. A physical keyboard works too. There's no DOM text field, so
  mobile keyboards never cover the game.

## 5. Placement assessment (adaptive)

- **Length.** 10 items, timed at the real pace (45 seconds per mark), plus extra-time and
  no-timer modes.
- **Item levels.** Every template has a difficulty level from 1 to 5 on a logit scale.
  - Level 1: 3-digit add and subtract
  - Level 2: short multiplication and division
  - Level 3: long multiplication, same-denominator fractions, percentages of amounts
  - Level 4: unlike-denominator fractions, decimals × whole numbers, order of operations
  - Level 5: mixed-number fractions, fraction ÷ whole number, 4-digit ÷ 2-digit
- **Model.** A Rasch (1PL) model gives the chance of a right answer as
  `P(correct) = 1 / (1 + e^-(θ - b))`. Ability θ is estimated by EAP over a grid with a
  normal prior.
- **Item choice.** The next item is the unused template closest to the current θ.
- **Stopping.** The assessment stops after 10 items or when the standard error drops below
  0.45.
- **Timeouts.** A timed-out item counts as incorrect. A slow but correct answer still counts
  as correct.
- **Bands.** θ is mapped to Working towards, Expected or Higher. The cut-points are anchored
  to the 2025/2026 maths thresholds: about 52% of marks for expected and about 86% for
  higher. They're pure constants with tests, so a teacher can tune them later.
- **Retakes.** A child can retake the placement. The game also moves their band up after
  three boss wins in a row at 90% accuracy or better.

## 6. Progression and rewards

- **XP and badges.** Marks earned give XP. Badges are cosmetic only: "Long Division
  Knight", "Fraction Fixer" and so on.
- **Streaks.** There are no daily-streak guilt mechanics, no loot boxes and no shop.
- **Weak spots.** Each content-domain code tracks right/asked. The next raid leans toward
  the two weakest codes, but never more than half the questions.
- **Mock mode.** A full 40-question Arithmetic Titan in 30 minutes, with no power-ups, at
  real paper timing.

## 7. Time pressure that stays kind

- The ghost is a visible race against pace, not a ticking bomb.
- A wrong answer never removes time.
- Three timer modes:
  - **Standard**
  - **Extra time +25%**, modelled on KS2 access arrangements
  - **No timer**
- There's no flashing, and reduced motion is respected through the existing `motionPrefs`.
- There's a dyslexia-friendly option: a heavier, larger sans font with wider spacing on a
  cream background.

## 8. Accounts, children's data and compliance (needs the owner's decision)

Kane's posture is 13+, with no age gate and placeholder Privacy and Terms pages. A Year 6
game is aimed at 10 to 11-year-olds. Under UK GDPR Article 8, a child under 13 can't
consent to an online service. Parental authorisation is needed where consent is the lawful
basis. The ICO Children's Code (15 standards) applies to any service likely to be accessed
by under-18s.

**Recommendation:**
- **Who holds the account.** A **parent or teacher holds the existing email + password
  account**. The game adds learner profiles under it: a nickname (no real name) and an
  avatar colour.
- **First run.** A parent gate appears on first run: the adult confirms they are the
  parent, guardian or teacher.
- **Data minimisation.** Store only the band, ability, XP and per-content-code counts.
  Store no answers, names, ages or schools.
- **Deletion.** The adult can delete a learner and all of that learner's data from the
  game. The Firestore rules allow the owner to delete.
- **LLM.** Nothing about the child is sent to the LLM.
- **Off the table.** No ads, chat, free text or social features.
- **Before public launch.** Keep the game **experimental and hidden behind a flag in
  production** until a child-friendly privacy notice, a data protection impact assessment
  (DPIA) and a proper legal review are done. Merging to `dev` auto-deploys Hosting.

I'm not a lawyer. This needs a qualified review before real children use it.

## 9. Firestore data model

All paths sit under `users/{uid}/`, where `uid` is the adult's account. Only `isSelf(uid)`
can read or write, and every field is validated in the rules.

**`users/{uid}/satsLearners/{learnerId}`** holds the learner profile:

| Field | Type or values |
|---|---|
| `nickname` | 1 to 20 chars |
| `avatar` | colour enum |
| `band` | `towards` \| `expected` \| `higher` \| `unplaced` |
| `ability` | number between -4 and 4 |
| `xp` | int ≥ 0 |
| `settings` | `{ timer: standard \| extra \| off, dyslexiaFont: bool }` |
| `domainStats` | `{ [code]: { asked, correct } }`, up to 40 codes |
| `createdAtMs`, `updatedAtMs` | int |
| `schemaVersion` | `1` |

The owner can create, update and delete it.

**`users/{uid}/satsLearners/{learnerId}/sessions/{sessionId}`** holds one session:

| Field | Type or values |
|---|---|
| `kind` | `placement` \| `raid` \| `mock` |
| `startedAtMs`, `endedAtMs` | int |
| `items`, `correct`, `marks`, `marksAvailable` | int |
| `bandAfter` | band |
| `abilityAfter` | number |
| `timer` | timer mode |
| `won` | bool |

The owner can create and delete it, but can't update it.

**`llmCache/{hash}` and `llmUsage/{uid_day}`** are written only by the Cloud Function. The
client is denied everything on them.

## 10. LLM tutor (Ollama Cloud)

**Endpoint and auth.** The function calls `POST https://ollama.com/api/chat` with an
`Authorization: Bearer <OLLAMA_API_KEY>` header. Ollama documents keys as created at
ollama.com/settings/keys.

**Structured output.** The Ollama docs say cloud models currently do **not** support
structured outputs. The proxy asks for JSON in the prompt and validates the reply itself.

**Model.** `gpt-oss:20b`, which costs $0.07 per million input tokens and $0.30 per million
output tokens. The model name is a config value to check against `/api/tags` at deploy
time.

**Proxy.** A Firebase callable function, `satsTutor`, sits between the game and Ollama:

| Control | Setting |
|---|---|
| Caller | Must be authenticated |
| Secret | `OLLAMA_API_KEY` from Secret Manager, never in the bundle or a `VITE_` var |
| Timeout | 8 seconds |
| Output limit | `num_predict` 220 tokens |
| Per-user limit | 20 calls a day |
| Global limit | A daily cap on calls |
| Cache | Keyed by `(templateId, params, wrongAnswer)` |

**What it sends.** Only the generated question, the code-computed answer, the child's
numeric answer and the content code.

**What it returns.** A short explanation. The reply is checked for:
- length and plain text
- no URLs
- a blocklist of unsafe words
- the correct answer appearing in the text

If any check fails, or the API is down, the game uses the curated offline explanation for
that template.

Cloud Functions need the Blaze plan and a deploy. The code ships tested and switched off
until then.

## 11. Platform fit

The game follows the Blob and Skate Rush pattern:
- **Code.** Everything lives in `src/games/sats-quest/`: the rules, item and placement
  modules (all pure), the copy, the art, the panels and a thin Phaser scene.
- **Registration.** It's registered in `GAME_REGISTRY` and the `main.ts` scene list.
- **Hosting.** It gets `/sats-quest` and `/sats-quest/` redirects.
- **Picker.** It gets a card colour and a blurb key.
- **Translation.** The game's content is UK-curriculum English. The recommendation is to
  translate the picker blurb only and keep the game copy en-GB.

## 12. What the first PR ships, and what is left

**Shipped:**
- **Royal Trial.** An adaptive placement per realm: arithmetic, reasoning, grammar and punctuation, spelling, and reading.
- **Kingdom map.** It shows the child's rank and which chapters are open.
- **Raids and mock.** Five chapters per realm, from 1.6× time down to 0.9×, plus the Clockwork Dragon mock at real pace.
- **Spells and modes.** Stardust spells, extra-time and no-timer modes, easier-to-read text and less movement.
- **Saving.** Progress is saved under the child's own account, with a copy on the device. "About your data" and "Delete my SATs Quest data" are in the game.
- **Owl tutor.** The proxy is built and tested. Its client flag stays off until the function is deployed.

**To switch on Ask Owl:**
1. The project needs the Blaze plan.
2. Run `firebase functions:secrets:set OLLAMA_API_KEY`.
3. Check the model name against `https://ollama.com/api/tags` (the default is `gpt-oss:20b`).
4. Run `firebase deploy --only functions:satsTutor`.
5. Set `SATS_LLM_TUTOR_ENABLED = true` in `src/games/sats-quest/satsTutor.ts`.
6. Optionally, add a Firestore TTL policy on `expireAt` for `satsLlmUsage` and `satsLlmCache`.

The Firestore rules for `users/{uid}/sats` must also be deployed before cloud saves work. Until then, progress stays on the device.

**Follow-ups:**
- More reading passages. There is one per level today.
- More GPS and spelling items.
- Typed constructed-response reading questions.
- LLM-themed word problems: only the wording varies, and the numbers and answer stay code-checked.
- Teacher and parent views.
- Revisit the sign-up copy, which still says "13+ framing".
- A proper privacy notice and legal review.

## Sources

- KS2 mathematics test framework (2016, current): https://www.gov.uk/government/publications/key-stage-2-mathematics-test-framework
- KS2 English GPS test framework (2016, current): https://www.gov.uk/government/publications/key-stage-2-english-grammar-punctuation-and-spelling-test-framework
- 2025 scaled score tables: https://www.gov.uk/government/publications/key-stage-2-tests-2025-scaled-scores/2025-key-stage-2-scaled-score-conversion-tables
- 2026 scaled score tables: https://www.gov.uk/government/publications/key-stage-2-tests-2026-scaled-scores
- Results for parents: https://www.gov.uk/government/publications/key-stage-2-national-curriculum-tests-and-results-information-for-parents
- Ollama Cloud: https://docs.ollama.com/cloud , API auth: https://docs.ollama.com/api/authentication , chat: https://docs.ollama.com/api/chat , pricing: https://ollama.com/pricing
- ICO Children's Code: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/
- Child online safety, data protection: https://www.gov.uk/guidance/child-online-safety-data-protection-and-privacy
