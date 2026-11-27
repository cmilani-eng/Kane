/** Skate Rush 3 — Easy can be beaten. What is proved: skateFairness.testkit.ts. */
import { describeFairness } from './skateFairness.testkit';

// 100 ms of slack on each press, 0.7 s between spawns, 0.4 s of warning, and reactions of 0.35 s.
describeFairness('easy', { grid: 6, breathing: 42, warning: 24, reaction: 21 });
