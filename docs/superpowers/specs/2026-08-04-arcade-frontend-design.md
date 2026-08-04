# Arcade Front-End Update Design

## Entry flow

The existing menu remains the mandatory entry screen. The flow is:

`Menu -> Game Start -> Player selection -> Board game`

Direct navigation to `game.html` remains technically possible for local development, but all user-facing game entry points use the existing menu's Game Start action.

## Language behavior

- Korean is the default language for a first-time player.
- Korean and English are fully supported on the menu, player setup, and board game.
- French stays visible in Settings but is disabled and labeled "Coming soon"; it does not switch the game into an incomplete locale.

## Visual direction

Use the approved clean arcade layout rather than a detailed illustrated board-game table. The temporary visual system uses flat, high-contrast colors, candy-chip/dice/roulette motifs, simple gambling icons, and playful debt-pressure styling. The background stays deliberately neutral and replaceable so the designer can later add final art without touching layout or game logic.

## Player HUD

Player status appears in fixed viewport corners:

- Player 1: top-left
- Player 2: bottom-right
- Player 3: top-right
- Player 4: bottom-left

Each HUD card displays temporary avatar, player name, Debt, Gummies, and current jail state. The active player is visually highlighted. Unused corners remain empty in smaller games.

## Board and responsive layout

Keep the existing square perimeter board and central game controls. The board stays central while the corner HUD overlays the play area with safe spacing. Small-screen layouts retain all status cards and activity feedback in compact, scrollable forms; they must not hide game-critical information.

## Asset readiness

The UI continues to obtain avatars, colors, and future illustration hooks from player/asset data rather than from game rules. Final background and character artwork can therefore replace CSS placeholders and image mappings without changing gameplay modules.
