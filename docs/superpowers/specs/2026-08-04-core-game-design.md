# Core Game MVP Design

## Goal

Build the playable MVP before adding the future duel ability. The game is a local, pass-and-play, Monopoly-style party game for 2-4 players. Players race to eliminate Debt while protecting their gummy supply.

## Technical approach

Keep the project as a static GitHub Pages site using plain HTML, CSS, and JavaScript. No framework or build tooling is required.

- Add `game.html` as the game screen and link the main menu's **Game Start** action to it.
- Keep game state and rules independent from DOM updates so that the UI always renders derived state.
- Use focused modules for game rules/state, board rendering, and UI interactions.
- Preserve the existing menu, settings, language support, and character images.
- Use a small character/image asset mapping (for example, `player.avatar`) rather than image paths inside game rules. Final artwork can replace placeholders without altering the core system.

## Player setup and resources

At the start screen, the players choose 2-4 existing character avatars. Each player starts with:

- **Debt:** ₩1,000,000
- **Gummies:** 3
- **Board position:** Start
- **Jail status:** not jailed, with zero failed jail attempts
- **Owned territories:** none

Debt has a lower bound of ₩0. There is no separate cash balance: costs add to Debt and rewards reduce it.

## Win and loss conditions

- A player wins immediately when their Debt reaches ₩0.
- A player loses immediately when their Gummies reach 0.
- After every state-changing event, evaluate both conditions before the next player acts.

## Board layout

The board is a 24-tile square perimeter, with six tiles on each side. The center contains active-player information, two dice, contextual actions, and the event log.

| Tile type | Count | Rule |
| --- | ---: | --- |
| Start | 1 | Landing on or passing this tile grants 1 gummy. |
| Jail | 1 | Uses the jail rules below. |
| Mafia | 1 | Mandatory three-cup shell game; a wrong choice adds ₩150,000 Debt. |
| World Travel | 1 | Optionally spend 1 gummy to move to any non-corner tile and resolve it. Declining ends the turn. |
| Territory | 8 | Buy or trigger territory rules below. |
| Job | 4 | Reduce Debt by a random ₩50,000-₩150,000. |
| Blackjack | 2 | Spend 1 gummy to play blackjack for a Debt reduction. |
| Roll-the-Dice | 2 | Spend 1 gummy to predict a two-dice total for a Debt reduction. |
| Event Card | 2 | Draw one ordinary positive/negative event. |
| Debt-Clear Roulette | 1 | A 1-in-100 result sets Debt to ₩0; all other results do nothing. |
| Debt-Double Roulette | 1 | A 1-in-100 result doubles current Debt; all other results do nothing. |
| **Total** | **24** | |

Corner tiles occupy the four board corners: Start, Jail, Mafia, and World Travel.

## Turn flow

1. If the active player is jailed, resolve the jail flow instead of a normal turn.
2. Otherwise, roll two dice and move clockwise by their combined total.
3. Award one gummy for each Start crossing or landing.
4. Resolve the landing tile, including any required choice or mini-game.
5. Evaluate victory and defeat conditions.
6. If the game has not ended, advance to the next non-defeated player.

## Tile rules

### Territory

- Landing on an unowned territory offers its purchase.
- Buying it adds ₩100,000 Debt and records the active player as owner.
- Landing on another player's territory adds ₩50,000 Debt to the visitor.
- Landing on a player's own territory has no effect.

### Job

Reduce the active player's Debt by a random whole amount from ₩50,000 through ₩150,000. Clamp the result to ₩0.

### Jail

- On each jailed turn, roll two dice.
- A double releases the player immediately and moves them by that roll's total; resolve the destination normally.
- A non-double ends the jailed turn and adds one failed attempt.
- After the third failed attempt, release the player without moving. They resume normal movement on their next turn.

### Mafia

Present three cups. The player chooses one cup. The correct cup has no effect; either wrong cup adds ₩150,000 Debt. This mini-game is mandatory.

### World Travel

- The active player may decline, ending the turn on the World Travel tile.
- If they have at least 1 gummy, they may spend exactly 1 gummy to choose any non-corner tile.
- Move to the selected tile and immediately resolve that destination once. Do not chain another World Travel action.

### Blackjack

- Require 1 gummy to start; players who do not have one cannot play.
- Deal blackjack against a dealer. The player can hit or stand; the dealer draws until at least 17.
- A player win reduces Debt by ₩200,000.
- A player loss does not refund the spent gummy and has no additional Debt effect.
- A tie refunds the gummy and does not change Debt.

### Roll-the-Dice

- Require 1 gummy to start.
- The player selects **low** (2-6) or **high** (8-12), then rolls two dice.
- A correct selection reduces Debt by ₩200,000.
- A wrong selection loses the gummy with no additional Debt effect.
- A total of 7 refunds the gummy and does not change Debt.

### Ordinary event cards

The two Event Card tiles draw from one shared shuffled deck. The MVP deck contains four positive and four negative cards, using only changes of 1 gummy or ₩50,000-₩150,000 Debt. Reshuffle the discard pile when the deck becomes empty.

### Extreme roulette tiles

- **Debt-Clear Roulette:** create 100 equal outcome slots. One slot wins, setting current Debt to ₩0; the other 99 end the turn unchanged.
- **Debt-Double Roulette:** create 100 equal outcome slots. One slot doubles current Debt; the other 99 end the turn unchanged.
- Display the chance clearly and resolve from the exact generated outcome list so the animation and game result agree.

## State model

The rules layer owns one game object with:

- ordered players, active-player index, turn phase, and result log;
- board tiles, territory owners, and positions;
- event deck and discard pile;
- dice results and pending mini-game/action state;
- per-player Debt, gummies, jail state, selected character, and owned territory IDs.

Use pure helper functions where practical for dice, movement, Start crossings, debt changes, gummy validation, tile resolution, jail attempts, and win/loss evaluation. The UI sends player choices to these rules and re-renders the returned state.

## UI and asset readiness

The MVP game screen includes:

- a 2-4 player setup screen using the current colored character images;
- the 24-tile square board with visible player markers and territory ownership;
- a center panel for active player, Debt, gummies, jail status, dice, and roll control;
- focused overlays/panels for purchase decisions, card draws, Blackjack, Roll-the-Dice, Mafia, World Travel, and extreme roulette results;
- an activity log and an end-game victory/defeat screen.

Use names, colors, and simple symbols as placeholders. UI components consume image/avatar fields from the player data so the designer can later provide final character and entity art without rewriting game mechanics.

## Validation and edge cases

- Require an integer gummy balance of at least 1 before any gummy-spending action.
- Reject World Travel targets that are corners.
- Clamp Debt to ₩0 after reductions; never permit a negative Debt display or state value.
- Resolve every tile effect once per landing. World Travel resolves its selected destination once and cannot chain.
- Keep a player at zero gummies only long enough to record the result, then end the game immediately.
- Do not process normal movement for a jailed player unless they roll doubles.

## Test plan

Automated tests should cover:

- setup validation for 2-4 players;
- two-dice movement and Start-crossing gummy awards;
- Job bounds and Debt clamping;
- territory purchase, ownership, and visitor penalty;
- all jail paths, including doubles and third failed attempt;
- World Travel validation, gummy spending, and destination resolution;
- Blackjack outcomes, dice-game high/low and seven outcomes, and Mafia outcomes;
- ordinary-card deck draw/discard/reshuffle behavior;
- 1-in-100 extreme roulette outcomes and unchanged outcomes;
- insufficient-gummy handling; and
- immediate victory and defeat evaluation after every relevant state change.

## Future duel extension

The duel ability is deliberately out of scope for this MVP. Its previously approved design can be added later as a new turn action using the same game-state boundaries, player resource model, and asset mapping.
