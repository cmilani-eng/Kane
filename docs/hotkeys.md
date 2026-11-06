# KANE hotkeys

How KANE's selection and command keys map to the RTS games they come from
(StarCraft II, Age of Empires II, Command & Conquer), and what is built.

**Status:** ✅ built · 🔜 not built yet

## Selection

| Function | Reference games | KANE | Status |
|----------|-----------------|------|--------|
| Select a unit | all | LMB | ✅ |
| Select every unit of a type | double-click (SC2, AoE II, C&C Generals) | Double-click a unit, or Ctrl+click (Windows/Linux) / Cmd+click (Mac) | ✅ |
| Add or toggle in the selection | Shift+click | Shift+LMB | ✅ |
| Box select | drag | LMB drag | ✅ |
| Select all army | F2 (SC2), Ctrl+A | Ctrl+A, or the HUD **Army** button | ✅ |
| Clear selection / pause | Esc | Esc (cancels placing and attack-move first, then pauses) | ✅ |
| Jump to base | Backspace (SC2) | Home, or the HUD button | ✅ |
| Select idle workers | F1 (SC2), `.` (AoE II) | HUD **Idle** chip cycles them; no key yet | ✅ |
| Select idle military | — | HUD **Idle army** chip cycles + recenters; no key yet | ✅ |
| Cycle sub-group | Tab (SC2) | — | 🔜 |

Double-click and Ctrl/Cmd+click select the units of that type that are in vision,
not only the ones on screen. macOS turns Ctrl+click into a right-click, so Mac
players use double-click or Cmd+click.

## Control groups

| Function | Reference games | KANE | Status |
|----------|-----------------|------|--------|
| Save the selection as a group | Ctrl+0-9 | Ctrl+0-9, or Alt+0-9 | ✅ |
| Select a group | 0-9 | 0-9 | ✅ |
| Add a group to the selection | Shift+0-9 | Shift+0-9 | ✅ |
| Centre the camera on a group | press the number twice (SC2, AoE II) | Press the same number twice quickly | ✅ |
| Add the selection to a group | Shift+Ctrl+0-9 (SC2) | — | 🔜 |

Alt+0-9 exists because Chrome and Firefox reserve Ctrl+digit for switching tabs
on some platforms, and a page cannot always override that. On Linux, Alt+0-9
may itself collide with tab shortcuts in Chrome and Firefox. That collision is
unverified until it is tested in real browsers; so far it has only been tried
with scripted key events.

With a production building selected, **1 / 2 / 3** train units there instead of
recalling a group. Select a unit first to use the number for a group.

## Orders

| Function | Reference games | KANE | Status |
|----------|-----------------|------|--------|
| Move / attack / gather | right-click | RMB | ✅ |
| Move / attack / gather on touch | long-press | — (a tap selects; the panel's A-move button sends units) | 🔜 |
| Attack-move | A, then click | A, then click | ✅ |
| Stop | S | S (phones get a Stop button) | ✅ |
| Hold position / patrol | H / P (SC2) | — | 🔜 |
| Queue orders | Shift+command | — | 🔜 |

## KANE-specific

| Key | Action |
|-----|--------|
| H | Recruit hero |
| Q, W, E | Hero abilities |
| F | Formation (Nobles) |
| M | Mutation (Weirdos) |
| R | Rage (Brutes) |
| B | Build (B again cycles building types) |
| WASD / arrows / screen edge | Pan |
| Mouse wheel, `[` `]` | Zoom |
| Pause | Pause menu |
