# Arcade Front-End Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the game’s entry flow, language behavior, and arcade-style corner HUD without changing game rules.

**Architecture:** Keep `js/game-state.mjs` untouched. Adapt the menu/settings and pass translated display messages through the existing controller and renderer; CSS owns the neutral arcade styling, central board placement, and fixed viewport HUD.

**Tech Stack:** Static HTML, CSS, browser-native ES modules, Node built-in tests.

## Global Constraints

- Menu -> Game Start -> player selection -> board game is the user-facing flow.
- Korean is the first-launch default; Korean and English are complete locales.
- French remains visible but disabled as "Coming soon".
- Player HUD positions are fixed: P1 top-left, P2 bottom-right, P3 top-right, P4 bottom-left.
- Keep all gameplay logic and state mutations out of UI modules.
- Retain a neutral replaceable background for future designer art.

---

### Task 1: Update entry menu and language controls

**Files:**
- Modify: `index.html`, `settings.html`, `js/menu.js`, `js/settings.js`
- Modify: `public/lang/en.json`, `public/lang/ko.json`, `public/lang/fr.json`
- Test: `tests/game-localization.test.mjs`

- [ ] Set Korean as the fallback language when `localStorage.lang` is empty.
- [ ] Keep English and Korean settings buttons functional; render French as a disabled "Coming soon" control.
- [ ] Keep Game Start pointing to `game.html`; add a short menu transition/entry hint only if it uses existing localized copy.
- [ ] Add tests confirming Korean default and disabled French behavior.
- [ ] Run `node --test tests/game-localization.test.mjs` and commit `feat: update game language entry`.

### Task 2: Render fixed arcade corner HUD

**Files:**
- Modify: `js/game-ui.mjs`, `css/game.css`, `game.html`
- Test: `tests/game-localization.test.mjs`

- [ ] Replace the current status placement with four fixed HUD slots mapped to P1/P2/P3/P4 corners.
- [ ] Show avatar, name, Debt, Gummies, jail state, and active-player emphasis in each populated slot.
- [ ] Keep the board central and all game-critical mobile information visible in compact/scrollable form.
- [ ] Use flat, high-contrast arcade styling with neutral CSS background and tokenized colors; do not add final background artwork.
- [ ] Add DOM-level assertions for corner-slot mapping and active highlight; run the focused test file and commit `feat: add arcade corner player hud`.

### Task 3: Verify full user-facing flow

**Files:**
- Modify: `js/game.mjs`, `tests/game-localization.test.mjs` only if wiring needs adjustment.

- [ ] Verify menu launch, Korean-first setup, English switch, disabled French, 2-player and 4-player corner HUD, and active-player highlight.
- [ ] Run `node --test`, `node --check js/game.mjs js/game-ui.mjs`, parse all locale JSON, and serve the site locally for browser inspection.
- [ ] Commit `feat: polish arcade game entry flow`.

## Plan self-review

- Covers the approved menu flow, Korean-first language handling, disabled French, corner HUD mapping, arcade style, responsive visibility, and asset-ready background.
- Does not change `js/game-state.mjs` or gameplay rules.
