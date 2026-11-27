/** Skate Rush 3 — Extreme is nearly impossible, but can be beaten. What is proved: skateFairness.testkit.ts. */
import { describeFairness } from './skateFairness.testkit';

// Less room for a person than on any other level: 67 ms of slack on a press, half a second between
// spawns, and reactions of 0.2 s.
describeFairness('extreme', { grid: 4, breathing: 30, warning: 24, reaction: 12 });
