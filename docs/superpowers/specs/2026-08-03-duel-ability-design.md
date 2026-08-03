# Duel Ability Design

## Purpose and scope

Add an MVP player-versus-player duel action to the fast, Monopoly-style party game. A duel lets one player risk gummies to challenge another player to a weighted roulette gamble. This feature is intentionally limited to game-state rules and an asset-ready UI; final character, entity, and visual assets will be supplied later by the design team.

## Player flow

1. At the start of their turn, a player whose duel cooldown is `0` may choose either the normal turn action or **Challenge Player**.
2. Choosing a challenge ends the challenger’s turn. The challenger chooses a target and commits at least one gummy as their initial stake.
3. The target chooses **Accept** or **Decline**.
4. On decline, the challenger’s initial stake is refunded. The target pays the decline penalty for the current round, and the challenger’s four-turn cooldown begins.
5. On acceptance, both players select final gummy stakes. Each player must stake at least one gummy; the challenger’s previously committed gummy counts toward their final stake.
6. The game builds the roulette wheel from the two final stakes, animates the result, transfers the gummy pot to the winner, starts the challenger’s cooldown, and proceeds to the next turn.

## Roulette and payout rules

The roulette uses explicit colored slots so its odds are transparent.

- The wheel begins with one free base slot for each duelist. Base slots affect probability only; they are not part of the gummy pot.
- Every gummy in a player’s final stake adds one slot in that player’s color.
- A player’s chance of winning is their slot count divided by all slot counts.
- Example: if Player A stakes 2 gummies and Player B stakes 1, the wheel has 3 A slots and 2 B slots. Player A has a 60% win chance and Player B has a 40% win chance.
- The winner receives the entire gummy pot, equal to the sum of both final stakes.

## Decline penalty

The target may always decline a valid challenge, but pays money based on the current round.

| Round | Money penalty |
| --- | ---: |
| 1-3 | 10,000 |
| 4-6 | 20,000 |
| 7 and later | 30,000 |

The penalty does not transfer to the challenger unless a later game-wide economy rule explicitly adds that behavior; it is deducted from the target’s money balance.

## Cooldown rules

- Any issued challenge starts a cooldown for its challenger, whether accepted or declined.
- A player may not issue a duel while their cooldown is positive.
- The cooldown lasts four of that player’s future turns. It decreases by one at the start of each of their own turns and never becomes negative.
- Cooldown does not prevent a player from being challenged by another player.

## State and component boundaries

Add the following game-state concepts:

- `roundNumber`: the completed/current round used to select the decline penalty tier.
- `player.duelCooldown`: a non-negative integer owned by each player.
- `pendingDuel`: challenger ID, target ID, initial challenger stake, and response state.
- `activeDuel`: final stakes, generated slot list, result, and payout state after acceptance.

Keep rules separate from presentation:

- A duel rules module validates eligibility and stakes, calculates penalties, builds slots, resolves a winner, transfers gummies, refunds a declined stake, and updates cooldown.
- UI components only collect choices and display derived state (target selection, accept/decline, wager controls, roulette, and result).
- Character or entity visuals are read through a small asset mapping such as `player.avatar` or `character.icon`; no game rule should contain image paths. Until final assets arrive, use player names, colors, and simple symbols as placeholders.

## Validation and edge cases

- The challenger must have at least one gummy and a zero cooldown before issuing a duel.
- A target may accept only if they have at least one gummy available to stake.
- Stakes must be whole numbers from 1 through the player’s current gummy balance. The challenger’s final stake cannot be less than the initial committed gummy.
- State updates must be atomic: no gummies move until valid accepted stakes are confirmed, and a decline refunds the exact initial stake.
- After a decline penalty or a duel payout, run the existing defeat check if a player has reached zero gummies (and apply the project’s normal money/debt rules as applicable).

## MVP UI

Use a compact sequence of panels or modals:

1. **Challenge Player** target picker, available only when the active player is eligible.
2. Target response panel showing the current decline penalty.
3. Wager panel showing each player’s stake, total pot, slot counts, and calculated win chances.
4. Roulette result panel showing colored slots, the winner, gummy transfer, and the challenger’s remaining cooldown.

The first implementation uses CSS colors, names, and simple symbols. It must expose clear image/character props or asset mappings so final designer-provided visuals can replace placeholders without changing the rules or flow.

## Test plan

Automated tests should cover:

- challenge eligibility and four-own-turn cooldown timing;
- every decline-penalty tier and the refund path;
- minimum, maximum, and invalid stake validation;
- slot lists and displayed odds for asymmetric stakes;
- payout conservation (the winner receives exactly the two stakes);
- defeat evaluation after a gummy loss; and
- UI state transitions for accept, decline, and roulette resolution.
