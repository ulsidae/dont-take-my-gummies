import { TILE_TYPES } from './game-state.mjs';

const DEFAULT_CHARACTERS = Object.freeze([
  { id: 'red', name: 'Ruby', avatar: 'img/cha_r.png', color: '#ef5b67' },
  { id: 'green', name: 'Mint', avatar: 'img/cha_g.png', color: '#54c99b' },
  { id: 'blue', name: 'Blue', avatar: 'img/cha_b.png', color: '#5b9ff0' },
  { id: 'yellow', name: 'Sunny', avatar: 'img/cha_y.png', color: '#f4c542' }
]);

const TILE_DETAILS = Object.freeze({
  [TILE_TYPES.START]: { label: 'Start', symbol: '★' },
  [TILE_TYPES.JAIL]: { label: 'Jail', symbol: '⛓' },
  [TILE_TYPES.MAFIA]: { label: 'Mafia', symbol: '♠' },
  [TILE_TYPES.WORLD_TRAVEL]: { label: 'World Travel', symbol: '✈' },
  [TILE_TYPES.TERRITORY]: { label: 'Territory', symbol: '⌂' },
  [TILE_TYPES.JOB]: { label: 'Job', symbol: '₩' },
  [TILE_TYPES.BLACKJACK]: { label: 'Blackjack', symbol: '♣' },
  [TILE_TYPES.DICE_GAME]: { label: 'High / Low', symbol: '⚄' },
  [TILE_TYPES.EVENT]: { label: 'Event', symbol: '✦' }
});

function makeElement(tagName, className, textContent) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (textContent !== undefined) element.textContent = textContent;
  return element;
}

function makeButton(label, className, onClick, disabled = false) {
  const button = makeElement('button', className, label);
  button.type = 'button';
  button.disabled = disabled || typeof onClick !== 'function';
  if (!button.disabled) button.addEventListener('click', onClick);
  return button;
}

function formatMoney(amount) {
  return `₩${Number(amount || 0).toLocaleString()}`;
}

function tilePosition(index) {
  if (index === 0) return { row: 7, column: 1 };
  if (index >= 1 && index <= 5) return { row: 7, column: index + 1 };
  if (index === 6) return { row: 7, column: 7 };
  if (index >= 7 && index <= 11) return { row: 13 - index, column: 7 };
  if (index === 12) return { row: 1, column: 7 };
  if (index >= 13 && index <= 17) return { row: 1, column: 19 - index };
  if (index === 18) return { row: 1, column: 1 };
  return { row: index - 17, column: 1 };
}

function playerById(game, playerId) {
  return game.players.find((player) => player.id === playerId) || null;
}

function tileClassName(tile) {
  const classes = ['tile', `tile--${tile.type}`];
  if ([TILE_TYPES.START, TILE_TYPES.JAIL, TILE_TYPES.MAFIA, TILE_TYPES.WORLD_TRAVEL].includes(tile.type)) {
    classes.push('tile--corner');
  }
  return classes.join(' ');
}

function renderMarker(player) {
  const marker = makeElement('span', 'player-marker');
  marker.style.setProperty('--player-color', player.color || '#ffffff');
  marker.title = player.name;
  marker.setAttribute('aria-label', `${player.name} marker`);

  if (player.avatar) {
    const image = makeElement('img', 'player-marker__avatar');
    image.src = player.avatar;
    image.alt = '';
    marker.append(image);
  } else {
    marker.textContent = player.name.slice(0, 1).toUpperCase();
  }

  return marker;
}

function renderTile(tile, game) {
  const details = TILE_DETAILS[tile.type] || { label: tile.type, symbol: '?' };
  const tileElement = makeElement('section', tileClassName(tile));
  const { row, column } = tilePosition(tile.index);
  tileElement.style.gridRow = String(row);
  tileElement.style.gridColumn = String(column);
  tileElement.dataset.tileIndex = String(tile.index);
  tileElement.setAttribute('aria-label', `${details.label}, tile ${tile.index + 1}`);

  const label = makeElement('span', 'tile__label', details.label);
  const symbol = makeElement('span', 'tile__symbol', details.symbol);
  tileElement.append(symbol, label);

  if (tile.ownerId) {
    const owner = playerById(game, tile.ownerId);
    const ownerIndicator = makeElement('span', 'tile__owner');
    ownerIndicator.style.setProperty('--owner-color', owner?.color || '#ffffff');
    ownerIndicator.textContent = owner ? `${owner.name}'s` : 'Owned';
    tileElement.append(ownerIndicator);
  }

  const playersHere = game.players.filter((player) => player.position === tile.index);
  if (playersHere.length > 0) {
    const markers = makeElement('span', 'tile__markers');
    playersHere.forEach((player) => markers.append(renderMarker(player)));
    tileElement.append(markers);
  }

  return tileElement;
}

function renderPlayerStatus(game) {
  const list = makeElement('ul', 'player-status-list');
  game.players.forEach((player, index) => {
    const item = makeElement('li', `player-status${index === game.activePlayerIndex ? ' player-status--active' : ''}`);
    item.style.setProperty('--player-color', player.color || '#ffffff');
    item.append(renderMarker(player));

    const status = makeElement('span', 'player-status__text');
    status.textContent = `${player.name}: Debt ₩${player.debt.toLocaleString()} · Gummies ${player.gummies}`;
    item.append(status);

    if (player.jailed) item.append(makeElement('span', 'player-status__jail', 'Jailed'));
    list.append(item);
  });
  return list;
}

function describeLogEntry(entry, game) {
  const player = playerById(game, entry.playerId);
  const name = player?.name || 'A player';

  switch (entry.type) {
    case 'territory-declined':
      return `${name} declined territory ${Number(entry.tileIndex) + 1}.`;
    case 'world-travel-declined':
      return `${name} declined World Travel.`;
    case 'mafia-cup':
      return `${name} chose cup ${entry.cup + 1}${entry.cup === entry.correctCup ? ' safely.' : ' and paid the Mafia.'}`;
    case 'dice-bet':
      return `${name} called ${entry.bet}; the dice totaled ${entry.total}${entry.total === 7 ? ' (gummy refunded).' : entry.won ? ' (Debt reduced).' : '.'}`;
    case 'blackjack':
      return `${name} played Blackjack: ${entry.playerCards.join(', ')} vs ${entry.dealerCards.join(', ')}.`;
    case 'event-card': {
      const cardName = entry.card?.id?.replaceAll('-', ' ') || 'an event card';
      return `${name} drew ${cardName}${entry.winningSlot === null ? '.' : entry.won ? ' and won the roulette!' : '.'}`;
    }
    default:
      return `${name} completed an action.`;
  }
}

function renderLog(game) {
  const section = makeElement('section', 'activity');
  section.append(makeElement('h3', 'activity__title', 'Recent activity'));
  const list = makeElement('ol', 'activity__list');
  const recentEntries = game.log.slice(-6);

  if (recentEntries.length === 0) {
    list.append(makeElement('li', 'activity__empty', 'The game begins at Start.'));
  } else {
    recentEntries.forEach((entry) => list.append(makeElement('li', '', describeLogEntry(entry, game))));
  }

  section.append(list);
  return section;
}

function renderDice(lastRoll) {
  const dice = makeElement('div', 'dice', '');
  const values = lastRoll?.dice || ['?', '?'];
  values.forEach((value) => dice.append(makeElement('span', 'die', String(value))));
  if (lastRoll) dice.append(makeElement('span', 'dice__total', `Total ${lastRoll.total}`));
  return dice;
}

function latestOutcome(game) {
  const entry = game.log.at(-1);
  return entry ? describeLogEntry(entry, game) : 'Resolve the landing tile, then continue to the next turn.';
}

function renderActionPanel(game, handlers) {
  const panel = makeElement('section', 'action-panel');
  const activePlayer = game.players[game.activePlayerIndex];
  const pending = game.pendingAction || {};
  const add = (title, message, controls = []) => {
    panel.append(makeElement('h2', 'action-panel__title', title));
    panel.append(makeElement('p', 'action-panel__message', message));
    if (controls.length > 0) {
      const buttons = makeElement('div', 'action-panel__controls');
      controls.forEach((control) => buttons.append(control));
      panel.append(buttons);
    }
  };

  switch (game.phase) {
    case 'awaiting-roll':
      add(`${activePlayer.name}'s turn`, activePlayer.jailed
        ? `You are in Jail. Roll doubles to leave, or wait out three failed attempts.`
        : 'Roll two dice and resolve the tile where you land.', [
        makeButton('Roll dice', 'button button--primary', handlers.roll)
      ]);
      break;
    case 'resolving-tile':
      add('Resolving tile', 'The landing tile is being resolved.');
      break;
    case 'awaiting-territory-choice':
      add('Claim this territory?', `Pay ${formatMoney(100_000)} Debt to add this territory to your collection.`, [
        makeButton('Buy territory', 'button button--primary', handlers.buyTerritory),
        makeButton('Decline', 'button button--quiet', handlers.declineTerritory)
      ]);
      break;
    case 'awaiting-world-travel': {
      const destinations = game.board.filter((tile) => ![
        TILE_TYPES.START,
        TILE_TYPES.JAIL,
        TILE_TYPES.MAFIA,
        TILE_TYPES.WORLD_TRAVEL
      ].includes(tile.type));
      add('World Travel', 'Spend 1 gummy to choose any non-corner destination, or end your turn here.');
      const select = makeElement('select', 'destination-select');
      select.setAttribute('aria-label', 'World Travel destination');
      destinations.forEach((tile) => {
        const option = makeElement('option', '', `${tile.index + 1}: ${TILE_DETAILS[tile.type].label}`);
        option.value = String(tile.index);
        select.append(option);
      });
      const controls = makeElement('div', 'action-panel__controls');
      controls.append(select);
      controls.append(makeButton(
        'Travel',
        'button button--primary',
        handlers.chooseWorldTravel ? () => handlers.chooseWorldTravel(Number(select.value)) : null,
        activePlayer.gummies < 1
      ));
      controls.append(makeButton('Decline', 'button button--quiet', handlers.declineWorldTravel));
      panel.append(controls);
      break;
    }
    case 'awaiting-mafia':
      add('Mafia cups', 'Pick one cup. Only one choice keeps your Debt unchanged.', [0, 1, 2].map((cup) => (
        makeButton(`Cup ${cup + 1}`, 'button button--cup', handlers.chooseMafiaCup ? () => handlers.chooseMafiaCup(cup) : null)
      )));
      break;
    case 'awaiting-blackjack':
      add('Blackjack table', 'Spend 1 gummy to play for a ₩200,000 Debt reduction.', [
        makeButton('Deal cards', 'button button--primary', handlers.startBlackjack, activePlayer.gummies < 1)
      ]);
      break;
    case 'awaiting-blackjack-action': {
      const cards = pending.playerCards || [];
      const dealerCards = pending.dealerCards || [];
      add('Blackjack', `Your cards: ${cards.join(', ')}. Dealer shows: ${dealerCards[0] ?? '?'}.`, [
        makeButton('Hit', 'button button--primary', handlers.blackjackHit),
        makeButton('Stand', 'button button--quiet', handlers.blackjackStand)
      ]);
      break;
    }
    case 'awaiting-dice-bet':
      add('High or low?', 'Spend 1 gummy. Low wins on 2–6; high wins on 8–12; 7 refunds the gummy.', [
        makeButton('Low (2–6)', 'button button--primary', handlers.chooseDiceBet ? () => handlers.chooseDiceBet('low') : null, activePlayer.gummies < 1),
        makeButton('High (8–12)', 'button button--quiet', handlers.chooseDiceBet ? () => handlers.chooseDiceBet('high') : null, activePlayer.gummies < 1)
      ]);
      break;
    case 'awaiting-dice-roll':
      add('Roll for the wager', `You chose ${pending.bet || 'a side'}.`, [
        makeButton('Roll wager dice', 'button button--primary', handlers.resolveDiceBet)
      ]);
      break;
    case 'turn-complete':
      add('Turn complete', latestOutcome(game), [
        makeButton('Next turn', 'button button--primary', handlers.nextTurn)
      ]);
      break;
    case 'game-over':
      add('Game complete', 'The result is shown on the board.');
      break;
    default:
      add('Waiting for the game', 'No action is available for this state.');
  }

  return panel;
}

function renderResultOverlay(game) {
  if (!game.result) return null;
  const player = playerById(game, game.result.playerId);
  const won = game.result.type === 'victory';
  const overlay = makeElement('section', `result-overlay result-overlay--${won ? 'victory' : 'defeat'}`);
  overlay.setAttribute('role', 'alert');
  overlay.append(makeElement('p', 'result-overlay__eyebrow', won ? 'Debt cleared' : 'Out of gummies'));
  overlay.append(makeElement('h1', '', won ? 'Victory!' : 'Defeat'));
  overlay.append(makeElement('p', '', won
    ? `${player?.name || 'The active player'} has paid off every last bit of Debt.`
    : `${player?.name || 'The active player'} has no gummies left to continue.`));
  return overlay;
}

/**
 * Render the complete board from an immutable game state.
 * `handlers` is supplied by the controller; this module never updates state itself.
 */
export function renderGame(root, game, handlers = {}) {
  root.replaceChildren();
  const shell = makeElement('div', 'game-shell');
  const board = makeElement('div', 'board');
  board.setAttribute('aria-label', 'Game board');

  game.board.forEach((tile) => board.append(renderTile(tile, game)));

  const center = makeElement('section', 'board-center');
  const activePlayer = game.players[game.activePlayerIndex];
  center.append(makeElement('p', 'board-center__eyebrow', `Active player: ${activePlayer.name} · ${game.phase.replaceAll('-', ' ')}`));
  center.append(renderPlayerStatus(game));
  center.append(renderDice(game.lastRoll));
  center.append(renderActionPanel(game, handlers));
  center.append(renderLog(game));
  board.append(center);

  shell.append(board);
  const resultOverlay = renderResultOverlay(game);
  if (resultOverlay) shell.append(resultOverlay);
  root.append(shell);
}

/**
 * Render avatar and player-count selection. Selected objects retain the supplied
 * avatar metadata so the controller can create a game without knowing UI assets.
 */
export function renderSetup(root, characters = DEFAULT_CHARACTERS, onStart = () => {}) {
  root.replaceChildren();
  const availableCharacters = characters.length > 0 ? characters : DEFAULT_CHARACTERS;
  let playerCount = 2;
  let selectedIds = availableCharacters.slice(0, playerCount).map((character) => character.id);

  const shell = makeElement('section', 'setup-screen');
  shell.append(makeElement('p', 'setup-screen__eyebrow', 'Local pass-and-play'));
  shell.append(makeElement('h1', 'setup-screen__title', "Don't Take My Gummies!"));
  shell.append(makeElement('p', 'setup-screen__intro', 'Choose two to four characters, then take turns escaping Debt with your gummies intact.'));

  const countControls = makeElement('div', 'setup-count');
  countControls.append(makeElement('span', 'setup-count__label', 'Players'));
  const countButtons = makeElement('div', 'setup-count__buttons');
  [2, 3, 4].forEach((count) => {
    const button = makeButton(String(count), 'count-button', () => {
      playerCount = count;
      selectedIds = availableCharacters.slice(0, count).map((character) => character.id);
      renderSetupWithSelection(root, availableCharacters, onStart, playerCount, selectedIds);
    });
    button.dataset.playerCount = String(count);
    if (count === playerCount) button.classList.add('count-button--selected');
    countButtons.append(button);
  });
  countControls.append(countButtons);
  shell.append(countControls);

  const grid = makeElement('div', 'character-grid');
  availableCharacters.forEach((character) => {
    const selected = selectedIds.includes(character.id);
    const card = makeButton('', `character-card${selected ? ' character-card--selected' : ''}`, () => {
      if (selected) {
        selectedIds = selectedIds.filter((id) => id !== character.id);
      } else if (selectedIds.length < playerCount) {
        selectedIds = [...selectedIds, character.id];
      }
      // Keep the renderer local so setup selections never leak into game rules.
      renderSetupWithSelection(root, availableCharacters, onStart, playerCount, selectedIds);
    });
    card.dataset.characterId = character.id;
    card.setAttribute('aria-pressed', String(selected));
    const image = makeElement('img', 'character-card__avatar');
    image.src = character.avatar;
    image.alt = '';
    const name = makeElement('span', 'character-card__name', character.name);
    card.style.setProperty('--player-color', character.color || '#ffffff');
    card.append(image, name);
    grid.append(card);
  });
  shell.append(grid);

  const selectedCharacters = selectedIds
    .map((id) => availableCharacters.find((character) => character.id === id))
    .filter(Boolean);
  const start = makeButton(`Start ${playerCount}-player game`, 'button button--primary setup-screen__start', () => onStart(selectedCharacters), selectedCharacters.length !== playerCount);
  shell.append(start);
  root.append(shell);
}

function renderSetupWithSelection(root, characters, onStart, playerCount, selectedIds) {
  root.replaceChildren();
  const shell = makeElement('section', 'setup-screen');
  shell.append(makeElement('p', 'setup-screen__eyebrow', 'Local pass-and-play'));
  shell.append(makeElement('h1', 'setup-screen__title', "Don't Take My Gummies!"));
  shell.append(makeElement('p', 'setup-screen__intro', 'Choose two to four characters, then take turns escaping Debt with your gummies intact.'));

  const countControls = makeElement('div', 'setup-count');
  countControls.append(makeElement('span', 'setup-count__label', 'Players'));
  const countButtons = makeElement('div', 'setup-count__buttons');
  [2, 3, 4].forEach((count) => {
    const button = makeButton(String(count), 'count-button', () => {
      renderSetupWithSelection(root, characters, onStart, count, characters.slice(0, count).map((character) => character.id));
    });
    button.dataset.playerCount = String(count);
    if (count === playerCount) button.classList.add('count-button--selected');
    countButtons.append(button);
  });
  countControls.append(countButtons);
  shell.append(countControls);

  const grid = makeElement('div', 'character-grid');
  characters.forEach((character) => {
    const selected = selectedIds.includes(character.id);
    const card = makeButton('', `character-card${selected ? ' character-card--selected' : ''}`, () => {
      const nextSelection = selected
        ? selectedIds.filter((id) => id !== character.id)
        : selectedIds.length < playerCount ? [...selectedIds, character.id] : selectedIds;
      renderSetupWithSelection(root, characters, onStart, playerCount, nextSelection);
    });
    card.dataset.characterId = character.id;
    card.setAttribute('aria-pressed', String(selected));
    card.style.setProperty('--player-color', character.color || '#ffffff');
    const image = makeElement('img', 'character-card__avatar');
    image.src = character.avatar;
    image.alt = '';
    card.append(image, makeElement('span', 'character-card__name', character.name));
    grid.append(card);
  });
  shell.append(grid);

  const selectedCharacters = selectedIds.map((id) => characters.find((character) => character.id === id)).filter(Boolean);
  shell.append(makeButton(`Start ${playerCount}-player game`, 'button button--primary setup-screen__start', () => onStart(selectedCharacters), selectedCharacters.length !== playerCount));
  root.append(shell);
}
