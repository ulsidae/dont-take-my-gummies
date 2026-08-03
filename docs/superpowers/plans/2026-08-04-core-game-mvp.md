# Core Game MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable 2-4 player, local pass-and-play board-game MVP with Debt, Gummies, territories, card events, and the approved mini-games.

**Architecture:** Add a static `game.html` page that imports browser-native ES modules. `js/game-state.mjs` owns the deterministic rules and state transitions, `js/game-ui.mjs` turns state into DOM, and `js/game.mjs` wires user actions to the rules. Node 24's built-in test runner exercises the rules layer directly; the browser UI stays a thin renderer over those transitions.

**Tech Stack:** HTML, CSS, browser-native ES modules, Node.js 24 built-in `node:test`, GitHub Pages.

## Global Constraints

- Keep the project dependency-free; do not add a package manager, bundler, or framework.
- Preserve `index.html`, `settings.html`, current language switching, current character images, and GitHub Pages deployment.
- Use two six-sided dice for all standard movement.
- Support 2-4 local players, ₩1,000,000 starting Debt, and 3 starting gummies.
- Keep rules independent of DOM and image paths; use player avatar metadata so final designer art is swappable.
- Clamp Debt at ₩0; Debt ₩0 wins immediately, while 0 gummies loses immediately.
- Keep the 24-tile board composition exactly as specified in `docs/superpowers/specs/2026-08-04-core-game-design.md`.

---

## File Structure

| File | Responsibility |
| --- | --- |
| Create `js/game-state.mjs` | Pure state constructors, board data, validation, movement, and all game rules. |
| Create `js/game-ui.mjs` | DOM rendering for setup, board, central status, action panels, and result log. |
| Create `js/game.mjs` | Browser controller that initializes the game and translates DOM events into rules calls. |
| Create `game.html` | Play-screen shell and module entry point. |
| Create `css/game.css` | Responsive square-board layout, placeholder tokens, overlays, and mini-game controls. |
| Create `tests/game-state.test.mjs` | Node tests for setup, movement, resources, territory, jail, events, and win/loss. |
| Create `tests/game-mini-games.test.mjs` | Node tests for Blackjack, high/low dice, Mafia, and rare roulette behavior. |
| Modify `index.html` | Point Game Start at `game.html`. |
| Modify `public/lang/en.json`, `public/lang/ko.json`, `public/lang/fr.json` | Add all player-facing core-game copy keys. |

## Public Rule Interfaces

`js/game-state.mjs` exports these exact names:

```js
export const TILE_TYPES = Object.freeze({
  START: 'start', JAIL: 'jail', MAFIA: 'mafia', WORLD_TRAVEL: 'world-travel',
  TERRITORY: 'territory', JOB: 'job', BLACKJACK: 'blackjack', DICE_GAME: 'dice-game',
  EVENT: 'event'
});

export function createGame({ players, random = Math.random });
export function rollStandardTurn(game);
export function resolveTile(game);
export function evaluateResult(game);
export function buyTerritory(game);
export function declineTerritory(game);
export function resolveJailTurn(game);
export function chooseWorldTravel(game, destinationIndex);
export function declineWorldTravel(game);
export function chooseMafiaCup(game, cupIndex);
export function startBlackjack(game);
export function blackjackHit(game);
export function blackjackStand(game);
export function chooseDiceBet(game, choice);
export function resolveDiceBet(game);
export function drawEventCard(game);
export function advanceTurn(game);
```

Every function returns a new game object rather than mutating its input. The game object includes `players`, `activePlayerIndex`, `board`, `eventDeck`, `eventDiscard`, `phase`, `pendingAction`, `lastRoll`, `log`, and `result`. Player objects include `id`, `name`, `avatar`, `color`, `position`, `debt`, `gummies`, `jailAttempts`, `jailed`, and `territoryIds`.

### Task 1: Establish the pure game model and standard movement

**Files:**
- Create: `js/game-state.mjs`
- Create: `tests/game-state.test.mjs`

**Interfaces:**
- Produces: `TILE_TYPES`, `createGame`, `rollStandardTurn`, `advanceTurn`, `applyDebt`, `applyGummies`, and `getActivePlayer`.
- Consumes: none.

- [ ] **Step 1: Write failing setup and movement tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, rollStandardTurn } from '../js/game-state.mjs';

const players = [
  { id: 'red', name: 'Red', avatar: 'img/cha_r.png', color: '#ef5b67' },
  { id: 'green', name: 'Green', avatar: 'img/cha_g.png', color: '#54c99b' }
];

test('creates two players with approved starting resources', () => {
  const game = createGame({ players, random: () => 0 });
  assert.equal(game.players[0].debt, 1_000_000);
  assert.equal(game.players[0].gummies, 3);
  assert.equal(game.board.length, 24);
});

test('moves by two dice and awards a gummy when passing Start', () => {
  const game = createGame({ players, random: () => 0 });
  const nearStart = { ...game, players: [{ ...game.players[0], position: 22 }, game.players[1]] };
  const moved = rollStandardTurn(nearStart);
  assert.deepEqual(moved.lastRoll.dice, [1, 1]);
  assert.equal(moved.players[0].position, 0);
  assert.equal(moved.players[0].gummies, 4);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/game-state.test.mjs`

Expected: FAIL because `js/game-state.mjs` does not exist.

- [ ] **Step 3: Implement the immutable model and board layout**

Create these 24 tiles in clockwise order. Use corners at indexes `0`, `6`, `12`, and `18`:

```js
const BOARD_TYPES = [
  'start', 'territory', 'job', 'event', 'territory', 'blackjack',
  'jail', 'territory', 'job', 'dice-game', 'territory', 'event',
  'mafia', 'territory', 'job', 'blackjack', 'territory', 'event',
  'world-travel', 'territory', 'job', 'dice-game', 'territory', 'event'
];
```

Implement the essential helpers:

```js
export function getActivePlayer(game) {
  return game.players[game.activePlayerIndex];
}

export function applyDebt(player, delta) {
  return { ...player, debt: Math.max(0, player.debt + delta) };
}

export function applyGummies(player, delta) {
  return { ...player, gummies: player.gummies + delta };
}

export function rollDie(random) {
  return Math.floor(random() * 6) + 1;
}
```

`rollStandardTurn` rolls exactly twice from `game.random`, moves the active player clockwise by their sum, grants one gummy if the move crosses or lands on index 0, sets `phase` to `'resolving-tile'`, and does not resolve the destination yet. `createGame` rejects fewer than 2 or more than 4 players with a `RangeError`.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `node --test tests/game-state.test.mjs`

Expected: PASS for setup and Start-crossing movement tests.

- [ ] **Step 5: Commit the model foundation**

```bash
git add js/game-state.mjs tests/game-state.test.mjs
git commit -m "feat: add core game state and movement"
```

### Task 2: Implement ordinary tiles, end conditions, and territories

**Files:**
- Modify: `js/game-state.mjs`
- Modify: `tests/game-state.test.mjs`

**Interfaces:**
- Consumes: `createGame`, `rollStandardTurn`, `applyDebt`, `applyGummies`, and `getActivePlayer` from Task 1.
- Produces: `resolveTile`, `buyTerritory`, `declineTerritory`, `evaluateResult`, and `advanceTurn`.

- [ ] **Step 1: Write failing tile-resolution tests**

```js
import { buyTerritory, evaluateResult, resolveTile } from '../js/game-state.mjs';

test('buying an unowned territory adds debt and records its owner', () => {
  const game = createGame({ players, random: () => 0 });
  const atTerritory = { ...game, players: [{ ...game.players[0], position: 1 }, game.players[1]], phase: 'resolving-tile' };
  const offered = resolveTile(atTerritory);
  const bought = buyTerritory(offered);
  assert.equal(bought.players[0].debt, 1_100_000);
  assert.equal(bought.board[1].ownerId, 'red');
});

test('landing on an opponent territory adds ₩50,000 debt', () => {
  const game = createGame({ players, random: () => 0 });
  const owned = { ...game.board[1], ownerId: 'red' };
  const visitor = { ...game, activePlayerIndex: 1, board: [game.board[0], owned, ...game.board.slice(2)], players: [game.players[0], { ...game.players[1], position: 1 }], phase: 'resolving-tile' };
  assert.equal(resolveTile(visitor).players[1].debt, 1_050_000);
});

test('declares victory at zero debt and defeat at zero gummies', () => {
  const game = createGame({ players, random: () => 0 });
  assert.equal(resolveTile({ ...game, players: [{ ...game.players[0], position: 2, debt: 40_000 }, game.players[1]], phase: 'resolving-tile', random: () => 0 }).result.type, 'victory');
  assert.equal(evaluateResult({ ...game, players: [{ ...game.players[0], gummies: 0 }, game.players[1]] }).result.type, 'defeat');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/game-state.test.mjs`

Expected: FAIL because territory actions and result evaluation are not implemented.

- [ ] **Step 3: Implement Job, territory, and state progression rules**

`resolveTile` must select behavior by `tile.type`. Implement these exact outcomes:

```js
// Job: random ₩50,000 through ₩150,000 inclusive, then clamp at ₩0.
const reward = 50_000 + Math.floor(game.random() * 100_001);

// Unowned territory: defer purchase to a UI choice.
return { ...game, phase: 'awaiting-territory-choice', pendingAction: { type: 'territory', tileIndex } };
```

For owned territory, add ₩50,000 to a visitor's debt and then evaluate the game result. `buyTerritory` adds ₩100,000 debt and records the active player ID; `declineTerritory` records a log entry and finishes the turn without changing resources. `advanceTurn` moves to the next player only when `result` is `null` and `phase` is `'turn-complete'`.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `node --test tests/game-state.test.mjs`

Expected: PASS for Job, territory purchase, owned-territory penalty, victory, and defeat tests.

- [ ] **Step 5: Commit ordinary tiles and progression**

```bash
git add js/game-state.mjs tests/game-state.test.mjs
git commit -m "feat: add territory jobs and end conditions"
```

### Task 3: Implement jail, World Travel, and the event-card deck

**Files:**
- Modify: `js/game-state.mjs`
- Modify: `tests/game-state.test.mjs`

**Interfaces:**
- Consumes: tile resolution and resource helpers from Tasks 1-2.
- Produces: `resolveJailTurn`, `chooseWorldTravel`, `declineWorldTravel`, and `drawEventCard`.

- [ ] **Step 1: Write failing special-tile tests**

```js
import { chooseWorldTravel, resolveJailTurn } from '../js/game-state.mjs';

test('doubles release a jailed player and move by that roll', () => {
  const game = createGame({ players, random: () => 0 });
  const jailed = { ...game, players: [{ ...game.players[0], jailed: true, jailAttempts: 1 }, game.players[1]] };
  const released = resolveJailTurn(jailed);
  assert.equal(released.players[0].jailed, false);
  assert.equal(released.players[0].position, 2);
});

test('third failed jail attempt releases without moving', () => {
  const values = [0, 0.2];
  const game = createGame({ players, random: () => values.shift() });
  const jailed = { ...game, players: [{ ...game.players[0], jailed: true, jailAttempts: 2, position: 6 }, game.players[1]] };
  const released = resolveJailTurn(jailed);
  assert.equal(released.players[0].jailed, false);
  assert.equal(released.players[0].position, 6);
});

test('World Travel spends one gummy and resolves a non-corner destination once', () => {
  const game = createGame({ players, random: () => 0 });
  const waiting = { ...game, players: [{ ...game.players[0], position: 18 }, game.players[1]], phase: 'awaiting-world-travel' };
  const travelled = chooseWorldTravel(waiting, 2);
  assert.equal(travelled.players[0].gummies, 2);
  assert.equal(travelled.players[0].position, 2);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/game-state.test.mjs`

Expected: FAIL because special-tile functions are not exported.

- [ ] **Step 3: Implement special-tile state machines and event deck**

Implement jail as its own turn path. Non-doubles add a failed attempt and end the turn. A double clears `jailed` and `jailAttempts`, moves by the same dice total, and resolves the landing tile. On the third failed attempt, clear jail state without moving and complete the turn.

`chooseWorldTravel` must throw `RangeError` for a corner (`start`, `jail`, `mafia`, or `world-travel`) and for a player with no gummy. On success, subtract one gummy, set the selected position, resolve the destination exactly once, and block a second World Travel action through the phase.

Build an eight-card deck with four positive and four negative ordinary cards. Draw moves a card from `eventDeck` to `eventDiscard`; if the deck is empty, shuffle the discard pile using `game.random` before drawing. Card payloads use explicit deltas such as `{ type: 'debt', amount: -100_000 }` and `{ type: 'gummies', amount: 1 }`.

- [ ] **Step 4: Add and pass event-deck assertions**

Add a test that draws the final card, then calls `drawEventCard` again and asserts the discard pile was reshuffled and a card was applied. Run:

```bash
node --test tests/game-state.test.mjs
```

Expected: PASS for jail, World Travel, and event-deck tests.

- [ ] **Step 5: Commit special tiles and cards**

```bash
git add js/game-state.mjs tests/game-state.test.mjs
git commit -m "feat: add jail travel and event cards"
```

### Task 4: Implement Mafia and the three gambling systems

**Files:**
- Modify: `js/game-state.mjs`
- Create: `tests/game-mini-games.test.mjs`

**Interfaces:**
- Consumes: immutable resource updates and result evaluation from Tasks 1-3.
- Produces: `chooseMafiaCup`, `startBlackjack`, `blackjackHit`, `blackjackStand`, `chooseDiceBet`, `resolveDiceBet`, and rare-event roulette resolution through `drawEventCard`.

- [ ] **Step 1: Write failing mini-game tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, chooseDiceBet, resolveDiceBet, chooseMafiaCup, drawEventCard } from '../js/game-state.mjs';

const players = [
  { id: 'red', name: 'Red', avatar: 'img/cha_r.png', color: '#ef5b67' },
  { id: 'green', name: 'Green', avatar: 'img/cha_g.png', color: '#54c99b' }
];

test('a wrong Mafia cup adds ₩150,000 Debt', () => {
  const game = { ...createGame({ players, random: () => 0 }), phase: 'awaiting-mafia', pendingAction: { correctCup: 0 } };
  assert.equal(chooseMafiaCup(game, 1).players[0].debt, 1_150_000);
});

test('a correct high bet reduces debt by ₩200,000', () => {
  const game = { ...createGame({ players, random: () => 0.99 }), phase: 'awaiting-dice-bet' };
  const selected = chooseDiceBet(game, 'high');
  const resolved = resolveDiceBet(selected);
  assert.equal(resolved.players[0].debt, 800_000);
  assert.equal(resolved.players[0].gummies, 2);
});

test('a rare debt-clear card only wins on its 1-in-100 roulette slot', () => {
  const game = createGame({ players, random: () => 0 });
  const rare = { ...game, eventDeck: [{ kind: 'debt-clear-roulette' }], eventDiscard: [] };
  assert.equal(drawEventCard(rare).players[0].debt, 0);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/game-mini-games.test.mjs`

Expected: FAIL because mini-game actions are not implemented.

- [ ] **Step 3: Implement Mafia, high/low dice, and Blackjack**

Mafia stores a random `correctCup` from `0` through `2` in `pendingAction`; a wrong player choice applies `+150_000` debt.

For high/low dice, `chooseDiceBet` must accept only `'low'` or `'high'`, deduct one gummy, and set `phase: 'awaiting-dice-roll'`. `resolveDiceBet` rolls two dice. Sum 7 refunds one gummy; sum 2-6 wins only `'low'`; sum 8-12 wins only `'high'`; a win subtracts ₩200,000 debt.

For Blackjack, represent cards as values 1-10, compute Aces as 11 when legal and 1 otherwise, and have the dealer hit below 17. `startBlackjack` spends one gummy and deals two player cards plus two dealer cards. `blackjackHit` draws exactly one player card; bust ends in loss. `blackjackStand` completes dealer draws and resolves win/loss/tie. Wins reduce Debt by ₩200,000; a tie refunds the gummy; losses do not refund it.

- [ ] **Step 4: Implement rare-card roulette and pass all mini-game tests**

Add `debt-clear-roulette` and `debt-double-roulette` to the shared event deck. After one is drawn, create an outcome with:

```js
const winningSlot = Math.floor(game.random() * 100);
const won = winningSlot === 0;
```

On success, either set Debt to 0 or multiply Debt by 2. On all other slots, leave resources unchanged. Run:

```bash
node --test tests/game-mini-games.test.mjs
node --test tests/game-state.test.mjs
```

Expected: PASS for Mafia, high/low dice, Blackjack, rare outcomes, and the existing rule suite.

- [ ] **Step 5: Commit mini-games**

```bash
git add js/game-state.mjs tests/game-mini-games.test.mjs
git commit -m "feat: add gambling and mafia mini games"
```

### Task 5: Build the game screen and render game state

**Files:**
- Create: `game.html`
- Create: `css/game.css`
- Create: `js/game-ui.mjs`

**Interfaces:**
- Consumes: full game object and `TILE_TYPES` from `js/game-state.mjs`.
- Produces: `renderGame(root, game, handlers)` and `renderSetup(root, characters, onStart)`.

- [ ] **Step 1: Create the game-shell markup and a manual render checklist**

Create `game.html` with a `<main id="game-root"></main>` container and one module entry point:

```html
<link rel="stylesheet" href="css/game.css">
<main id="game-root" aria-live="polite"></main>
<script type="module" src="js/game.mjs"></script>
```

Create `css/game.css` with CSS Grid for a four-sided board and a central panel. Use CSS custom properties for each player color and CSS classes (`tile--territory`, `tile--job`, `tile--event`, `tile--corner`) rather than image-dependent markup.

Manual check: open `game.html` through a local static server and confirm a full-window, responsive board frame appears without browser-console errors.

- [ ] **Step 2: Implement setup and board rendering**

`renderSetup` displays 2-4 player-count controls and the four existing avatar images (`img/cha_r.png`, `img/cha_g.png`, `img/cha_b.png`, `img/cha_y.png`). It passes ordered selected player objects to `onStart`.

`renderGame` creates 24 tile buttons/sections with `data-tile-index`, player markers, owner indicators, and a center panel. Render player status as:

```js
status.textContent = `${player.name}: Debt ₩${player.debt.toLocaleString()} · Gummies ${player.gummies}`;
```

Render `game.log.slice(-6)` as an ordered activity list. Do not put game-rule decisions in `game-ui.mjs`.

- [ ] **Step 3: Implement contextual action panels**

Map each `game.phase` to exactly one focused panel. Provide handler buttons for territory buy/decline, World Travel destination/decline, Mafia cup choice, Blackjack hit/stand, high/low dice selection, and next-turn flow. Disable controls when no handler applies. Include visually distinct result overlays for victory and defeat.

- [ ] **Step 4: Manually verify the renderer**

Run: `python3 -m http.server 8000`

Open: `http://localhost:8000/game.html`

Expected: setup choices are visible; starting a 2-player game draws 24 tiles, colored player markers, center status, and a Roll button.

- [ ] **Step 5: Commit the game screen**

```bash
git add game.html css/game.css js/game-ui.mjs
git commit -m "feat: add playable board game interface"
```

### Task 6: Wire browser actions, entry menu, localization, and full verification

**Files:**
- Create: `js/game.mjs`
- Modify: `index.html`
- Modify: `public/lang/en.json`
- Modify: `public/lang/ko.json`
- Modify: `public/lang/fr.json`
- Modify: `tests/game-state.test.mjs`
- Modify: `tests/game-mini-games.test.mjs`

**Interfaces:**
- Consumes: all exports from `js/game-state.mjs`, and `renderGame`/`renderSetup` from `js/game-ui.mjs`.
- Produces: complete browser play loop and localized entry point.

- [ ] **Step 1: Wire the controller with explicit action dispatch**

In `js/game.mjs`, keep a module-local `let game = null;` and create a `rerender()` that passes named handlers into `renderGame`:

```js
const handlers = {
  roll: () => {
    const activePlayer = game.players[game.activePlayerIndex];
    game = activePlayer.jailed ? resolveJailTurn(game) : resolveTile(rollStandardTurn(game));
    rerender();
  },
  buyTerritory: () => { game = buyTerritory(game); rerender(); },
  nextTurn: () => { game = advanceTurn(game); rerender(); }
};
```

Add handlers for every public action listed in the interfaces section. The controller must not edit a player, tile, Debt, or gummy value directly.

- [ ] **Step 2: Update entry and translation files**

Change the Game Start anchor in `index.html` from `href="index.html"` to `href="game.html"`. Add the keys used by the game UI to each language JSON file: `setup`, `playerCount`, `startGame`, `rollDice`, `debt`, `gummies`, `buy`, `decline`, `jail`, `worldTravel`, `blackjack`, `high`, `low`, `victory`, `defeat`, and `nextTurn`.

Keep every JSON file valid. Do not remove existing menu/settings keys.

- [ ] **Step 3: Extend tests for illegal actions and UI-independent regression coverage**

Add assertions that `createGame` throws for 1 and 5 players, World Travel rejects a corner, a zero-gummy player cannot start a gambling action, and `advanceTurn` does not progress after a game result. Run:

```bash
node --test tests/game-state.test.mjs tests/game-mini-games.test.mjs
```

Expected: PASS.

- [ ] **Step 4: Perform browser acceptance checks**

Run: `python3 -m http.server 8000`

Verify in a browser:

1. Main-menu Game Start opens `game.html`.
2. A 2-player game rolls two visible dice and moves the marker.
3. Start awards a gummy.
4. Each contextual tile shows its corresponding action panel.
5. Jail handles doubles and the third failed attempt.
6. World Travel rejects corners and costs exactly one gummy.
7. Victory and defeat overlays prevent more turns.

- [ ] **Step 5: Commit the complete MVP**

```bash
git add index.html public/lang/en.json public/lang/ko.json public/lang/fr.json js/game.mjs js/game-state.mjs js/game-ui.mjs game.html css/game.css tests/game-state.test.mjs tests/game-mini-games.test.mjs
git commit -m "feat: build core board game MVP"
```

## Plan self-review

- **Spec coverage:** Tasks 1-2 cover setup, two-dice turns, Start, Job, territory, Debt, Gummies, and end conditions. Task 3 covers Jail, World Travel, ordinary cards, and deck reshuffling. Task 4 covers Mafia, Blackjack, high/low dice, and rare roulette cards. Tasks 5-6 cover the asset-ready UI, existing menu entry point, translations, and browser acceptance checks.
- **Placeholder scan:** All task steps name exact files, exported interfaces, commands, and rule values; no deferred implementation markers remain.
- **Type consistency:** All later tasks use the `game` object, `game.phase`, player fields, and exported action names defined in the Public Rule Interfaces section.
