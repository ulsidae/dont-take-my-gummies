import { TILE_TYPES } from './game-state.mjs';

const DEFAULT_CHARACTERS = Object.freeze([
  { id: 'red', name: 'Ruby', avatar: 'img/cha_r.png', color: '#ef5b67' },
  { id: 'green', name: 'Mint', avatar: 'img/cha_g.png', color: '#54c99b' },
  { id: 'blue', name: 'Blue', avatar: 'img/cha_b.png', color: '#5b9ff0' },
  { id: 'yellow', name: 'Sunny', avatar: 'img/cha_y.png', color: '#f4c542' }
]);

const HUD_CORNER_SLOTS = Object.freeze([
  'top-left',
  'bottom-right',
  'top-right',
  'bottom-left'
]);

const TILE_DETAILS = Object.freeze({
  [TILE_TYPES.START]: { labelKey: 'tileStart', symbol: '★' },
  [TILE_TYPES.JAIL]: { labelKey: 'jail', symbol: '⛓' },
  [TILE_TYPES.MAFIA]: { labelKey: 'tileMafia', symbol: '♠' },
  [TILE_TYPES.WORLD_TRAVEL]: { labelKey: 'worldTravel', symbol: '✈' },
  [TILE_TYPES.TERRITORY]: { labelKey: 'tileTerritory', symbol: '⌂' },
  [TILE_TYPES.JOB]: { labelKey: 'tileJob', symbol: '₩' },
  [TILE_TYPES.BLACKJACK]: { labelKey: 'blackjack', symbol: '♣' },
  [TILE_TYPES.DICE_GAME]: { labelKey: 'tileDiceGame', symbol: '⚄' },
  [TILE_TYPES.EVENT]: { labelKey: 'tileEvent', symbol: '✦' }
});

function translate(messages, key, replacements = {}) {
  const template = messages?.[key] ?? key;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => (
    Object.hasOwn(replacements, name) ? String(replacements[name]) : `{${name}}`
  ));
}

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

function formatMoney(amount, language = 'en') {
  return `₩${Number(amount || 0).toLocaleString(language)}`;
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

function renderMarker(player, messages) {
  const marker = makeElement('span', 'player-marker');
  marker.style.setProperty('--player-color', player.color || '#ffffff');
  marker.title = player.name;
  marker.setAttribute('aria-label', translate(messages, 'markerAria', { name: player.name }));

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

function renderTile(tile, game, messages) {
  const details = TILE_DETAILS[tile.type] || { labelKey: tile.type, symbol: '?' };
  const labelText = translate(messages, details.labelKey);
  const tileElement = makeElement('section', tileClassName(tile));
  const { row, column } = tilePosition(tile.index);
  tileElement.style.gridRow = String(row);
  tileElement.style.gridColumn = String(column);
  tileElement.dataset.tileIndex = String(tile.index);
  tileElement.setAttribute('aria-label', translate(messages, 'tileAria', { label: labelText, number: tile.index + 1 }));

  const label = makeElement('span', 'tile__label', labelText);
  const symbol = makeElement('span', 'tile__symbol', details.symbol);
  tileElement.append(symbol, label);

  if (tile.ownerId) {
    const owner = playerById(game, tile.ownerId);
    const ownerIndicator = makeElement('span', 'tile__owner');
    ownerIndicator.style.setProperty('--owner-color', owner?.color || '#ffffff');
    ownerIndicator.textContent = owner
      ? translate(messages, 'ownedBy', { name: owner.name })
      : translate(messages, 'owned');
    tileElement.append(ownerIndicator);
  }

  const playersHere = game.players.filter((player) => player.position === tile.index);
  if (playersHere.length > 0) {
    const markers = makeElement('span', 'tile__markers');
    playersHere.forEach((player) => markers.append(renderMarker(player, messages)));
    tileElement.append(markers);
  }

  return tileElement;
}

function renderArcadeHud(game, messages, language) {
  const hud = makeElement('aside', 'arcade-hud');
  hud.setAttribute('aria-label', translate(messages, 'activePlayer'));

  game.players.slice(0, HUD_CORNER_SLOTS.length).forEach((player, index) => {
    const corner = HUD_CORNER_SLOTS[index];
    const slot = makeElement(
      'section',
      `arcade-hud__slot arcade-hud__slot--${corner}${index === game.activePlayerIndex ? ' arcade-hud__slot--active' : ''}`
    );
    slot.dataset.playerSlot = corner;
    slot.dataset.playerId = player.id;
    slot.style.setProperty('--player-color', player.color || '#ffffff');
    slot.setAttribute('aria-label', translate(messages, 'playerStatus', {
      name: player.name,
      debt: translate(messages, 'debt'),
      money: formatMoney(player.debt, language),
      gummies: translate(messages, 'gummies'),
      count: player.gummies
    }));
    slot.append(renderMarker(player, messages));

    const details = makeElement('div', 'arcade-hud__details');
    details.append(makeElement('strong', 'arcade-hud__name', player.name));
    details.append(makeElement('span', 'arcade-hud__stats', translate(messages, 'playerStatus', {
      name: '',
      debt: translate(messages, 'debt'),
      money: formatMoney(player.debt, language),
      gummies: translate(messages, 'gummies'),
      count: player.gummies
    }).replace(/^\s*:\s*/, '')));
    if (player.jailed) details.append(makeElement('span', 'arcade-hud__jail', translate(messages, 'jailed')));
    slot.append(details);
    hud.append(slot);
  });

  return hud;
}

function describeLogEntry(entry, game, messages, language) {
  const player = playerById(game, entry.playerId);
  const name = player?.name || translate(messages, 'aPlayer');

  switch (entry.type) {
    case 'territory-declined':
      return translate(messages, 'logTerritoryDeclined', { name, tile: Number(entry.tileIndex) + 1 });
    case 'territory-purchased':
      return translate(messages, 'logTerritoryPurchased', { name, tile: Number(entry.tileIndex) + 1, money: formatMoney(entry.amount, language) });
    case 'territory-charge': {
      const owner = playerById(game, entry.ownerId);
      return translate(messages, 'logTerritoryCharge', {
        name,
        owner: owner?.name || translate(messages, 'aPlayer'),
        money: formatMoney(entry.amount, language)
      });
    }
    case 'territory-owned':
      return translate(messages, 'logTerritoryOwned', { name, tile: Number(entry.tileIndex) + 1 });
    case 'job':
      return translate(messages, 'logJob', { name, money: formatMoney(entry.reward, language) });
    case 'start':
      return translate(messages, entry.gummiesAwarded > 0 ? 'logStartAward' : 'logStart', { name });
    case 'jail-entered':
      return translate(messages, 'logJailEntered', { name });
    case 'jail-roll':
      return translate(messages, entry.released ? 'logJailReleased' : 'logJailFailed', { name, attempts: entry.attempts });
    case 'world-travel-declined':
      return translate(messages, 'logWorldTravelDeclined', { name });
    case 'mafia-cup':
      return translate(messages, entry.cup === entry.correctCup ? 'logMafiaSafe' : 'logMafiaPaid', { name, cup: entry.cup + 1 });
    case 'dice-bet':
      return translate(messages, entry.total === 7 ? 'logDiceRefunded' : entry.won ? 'logDiceWon' : 'logDiceLost', {
        name,
        bet: translate(messages, entry.bet),
        total: entry.total
      });
    case 'blackjack':
      return translate(messages, 'logBlackjack', { name, playerCards: entry.playerCards.join(', '), dealerCards: entry.dealerCards.join(', ') });
    case 'event-card': {
      const cardName = translate(messages, `card_${entry.card?.id}`);
      return translate(messages, entry.winningSlot !== null && entry.won ? 'logEventRouletteWon' : 'logEventCard', { name, card: cardName });
    }
    default:
      return translate(messages, 'logDefault', { name });
  }
}

function renderLog(game, messages, language) {
  const section = makeElement('section', 'activity');
  section.append(makeElement('h3', 'activity__title', translate(messages, 'recentActivity')));
  const list = makeElement('ol', 'activity__list');
  const recentEntries = game.log.slice(-6);

  if (recentEntries.length === 0) {
    list.append(makeElement('li', 'activity__empty', translate(messages, 'activityEmpty')));
  } else {
    recentEntries.forEach((entry) => list.append(makeElement('li', '', describeLogEntry(entry, game, messages, language))));
  }

  section.append(list);
  return section;
}

function renderDice(lastRoll, messages) {
  const dice = makeElement('div', 'dice', '');
  const values = lastRoll?.dice || ['?', '?'];
  values.forEach((value) => dice.append(makeElement('span', 'die', String(value))));
  if (lastRoll) dice.append(makeElement('span', 'dice__total', translate(messages, 'diceTotal', { total: lastRoll.total })));
  return dice;
}

function latestOutcome(game, messages, language) {
  const entry = game.log.at(-1);
  return entry
    ? describeLogEntry(entry, game, messages, language)
    : translate(messages, 'outcomeDefault');
}

function renderActionPanel(game, handlers, messages, language) {
  const panel = makeElement('section', 'action-panel');
  const activePlayer = game.players[game.activePlayerIndex];
  const pending = game.pendingAction || {};
  const text = (key, replacements) => translate(messages, key, replacements);
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
      add(text('turnTitle', { name: activePlayer.name }), activePlayer.jailed
        ? text('jailRollMessage')
        : text('rollMessage'), [
        makeButton(text('rollDice'), 'button button--primary', handlers.roll)
      ]);
      break;
    case 'resolving-tile':
      add(text('resolvingTile'), text('resolvingTileMessage'));
      break;
    case 'awaiting-territory-choice':
      add(text('territoryQuestion'), text('territoryMessage', { money: formatMoney(100_000, language) }), [
        makeButton(text('buy'), 'button button--primary', handlers.buyTerritory),
        makeButton(text('decline'), 'button button--quiet', handlers.declineTerritory)
      ]);
      break;
    case 'awaiting-world-travel': {
      const destinations = game.board.filter((tile) => ![
        TILE_TYPES.START,
        TILE_TYPES.JAIL,
        TILE_TYPES.MAFIA,
        TILE_TYPES.WORLD_TRAVEL
      ].includes(tile.type));
      add(text('worldTravel'), text('worldTravelMessage'));
      const select = makeElement('select', 'destination-select');
      select.setAttribute('aria-label', text('worldTravelDestination'));
      destinations.forEach((tile) => {
        const option = makeElement('option', '', text('destinationOption', {
          number: tile.index + 1,
          label: text(TILE_DETAILS[tile.type].labelKey)
        }));
        option.value = String(tile.index);
        select.append(option);
      });
      const controls = makeElement('div', 'action-panel__controls');
      controls.append(select);
      controls.append(makeButton(
        text('travel'),
        'button button--primary',
        handlers.chooseWorldTravel ? () => handlers.chooseWorldTravel(Number(select.value)) : null,
        activePlayer.gummies < 1
      ));
      controls.append(makeButton(text('decline'), 'button button--quiet', handlers.declineWorldTravel));
      panel.append(controls);
      break;
    }
    case 'awaiting-mafia':
      add(text('mafiaCups'), text('mafiaMessage'), [0, 1, 2].map((cup) => (
        makeButton(text('cup', { number: cup + 1 }), 'button button--cup', handlers.chooseMafiaCup ? () => handlers.chooseMafiaCup(cup) : null)
      )));
      break;
    case 'awaiting-blackjack':
      add(text('blackjackTable'), text('blackjackMessage', { money: formatMoney(200_000, language) }), [
        makeButton(text('dealCards'), 'button button--primary', handlers.startBlackjack, activePlayer.gummies < 1)
      ]);
      break;
    case 'awaiting-blackjack-action': {
      const cards = pending.playerCards || [];
      const dealerCards = pending.dealerCards || [];
      add(text('blackjack'), text('blackjackHand', { cards: cards.join(', '), dealerCard: dealerCards[0] ?? '?' }), [
        makeButton(text('hit'), 'button button--primary', handlers.blackjackHit),
        makeButton(text('stand'), 'button button--quiet', handlers.blackjackStand)
      ]);
      break;
    }
    case 'awaiting-dice-bet':
      add(text('highLowQuestion'), text('highLowMessage'), [
        makeButton(text('lowRange'), 'button button--primary', handlers.chooseDiceBet ? () => handlers.chooseDiceBet('low') : null, activePlayer.gummies < 1),
        makeButton(text('highRange'), 'button button--quiet', handlers.chooseDiceBet ? () => handlers.chooseDiceBet('high') : null, activePlayer.gummies < 1)
      ]);
      break;
    case 'awaiting-dice-roll':
      add(text('rollWager'), text('betChosen', { bet: pending.bet ? text(pending.bet) : text('aSide') }), [
        makeButton(text('rollWagerDice'), 'button button--primary', handlers.resolveDiceBet)
      ]);
      break;
    case 'turn-complete':
      add(text('turnComplete'), latestOutcome(game, messages, language), [
        makeButton(text('nextTurn'), 'button button--primary', handlers.nextTurn)
      ]);
      break;
    case 'game-over':
      add(text('gameComplete'), text('gameCompleteMessage'));
      break;
    default:
      add(text('waitingForGame'), text('noActionAvailable'));
  }

  return panel;
}

function renderResultOverlay(game, messages) {
  if (!game.result) return null;
  const player = playerById(game, game.result.playerId);
  const won = game.result.type === 'victory';
  const overlay = makeElement('section', `result-overlay result-overlay--${won ? 'victory' : 'defeat'}`);
  overlay.setAttribute('role', 'alert');
  const name = player?.name || translate(messages, 'activePlayer');
  overlay.append(makeElement('p', 'result-overlay__eyebrow', translate(messages, won ? 'debtCleared' : 'outOfGummies')));
  overlay.append(makeElement('h1', '', translate(messages, won ? 'victory' : 'defeat')));
  overlay.append(makeElement('p', '', translate(messages, won ? 'victoryMessage' : 'defeatMessage', { name })));
  return overlay;
}

/**
 * Render the complete board from an immutable game state.
 * `handlers` is supplied by the controller; this module never updates state itself.
 */
export function renderGame(root, game, handlers = {}, messages = {}, language = 'en') {
  root.replaceChildren();
  const shell = makeElement('div', 'game-shell');
  const board = makeElement('div', 'board');
  board.setAttribute('aria-label', translate(messages, 'gameBoard'));

  game.board.forEach((tile) => board.append(renderTile(tile, game, messages)));

  const center = makeElement('section', 'board-center');
  const activePlayer = game.players[game.activePlayerIndex];
  center.append(makeElement('p', 'board-center__eyebrow', translate(messages, 'activePlayerPhase', {
    name: activePlayer.name,
    phase: translate(messages, `phase_${game.phase}`)
  })));
  center.append(renderDice(game.lastRoll, messages));
  center.append(renderActionPanel(game, handlers, messages, language));
  center.append(renderLog(game, messages, language));
  board.append(center);

  shell.append(board, renderArcadeHud(game, messages, language));
  const resultOverlay = renderResultOverlay(game, messages);
  if (resultOverlay) shell.append(resultOverlay);
  root.append(shell);
}

/**
 * Render avatar and player-count selection. Selected objects retain the supplied
 * avatar metadata so the controller can create a game without knowing UI assets.
 */
export function renderSetup(root, characters = DEFAULT_CHARACTERS, onStart = () => {}, messages = {}) {
  root.replaceChildren();
  const availableCharacters = characters.length > 0 ? characters : DEFAULT_CHARACTERS;
  let playerCount = 2;
  let selectedIds = availableCharacters.slice(0, playerCount).map((character) => character.id);

  const shell = makeElement('section', 'setup-screen');
  shell.append(makeElement('p', 'setup-screen__eyebrow', translate(messages, 'setupEyebrow')));
  shell.append(makeElement('h1', 'setup-screen__title', translate(messages, 'title')));
  shell.append(makeElement('p', 'setup-screen__intro', translate(messages, 'setupIntro')));

  const countControls = makeElement('div', 'setup-count');
  countControls.append(makeElement('span', 'setup-count__label', translate(messages, 'playerCount')));
  const countButtons = makeElement('div', 'setup-count__buttons');
  [2, 3, 4].forEach((count) => {
    const button = makeButton(String(count), 'count-button', () => {
      playerCount = count;
      selectedIds = availableCharacters.slice(0, count).map((character) => character.id);
      renderSetupWithSelection(root, availableCharacters, onStart, playerCount, selectedIds, messages);
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
      renderSetupWithSelection(root, availableCharacters, onStart, playerCount, selectedIds, messages);
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
  const start = makeButton(translate(messages, 'startGameCount', { count: playerCount }), 'button button--primary setup-screen__start', () => onStart(selectedCharacters), selectedCharacters.length !== playerCount);
  shell.append(start);
  root.append(shell);
}

function renderSetupWithSelection(root, characters, onStart, playerCount, selectedIds, messages) {
  root.replaceChildren();
  const shell = makeElement('section', 'setup-screen');
  shell.append(makeElement('p', 'setup-screen__eyebrow', translate(messages, 'setupEyebrow')));
  shell.append(makeElement('h1', 'setup-screen__title', translate(messages, 'title')));
  shell.append(makeElement('p', 'setup-screen__intro', translate(messages, 'setupIntro')));

  const countControls = makeElement('div', 'setup-count');
  countControls.append(makeElement('span', 'setup-count__label', translate(messages, 'playerCount')));
  const countButtons = makeElement('div', 'setup-count__buttons');
  [2, 3, 4].forEach((count) => {
    const button = makeButton(String(count), 'count-button', () => {
      renderSetupWithSelection(root, characters, onStart, count, characters.slice(0, count).map((character) => character.id), messages);
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
      renderSetupWithSelection(root, characters, onStart, playerCount, nextSelection, messages);
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
  shell.append(makeButton(translate(messages, 'startGameCount', { count: playerCount }), 'button button--primary setup-screen__start', () => onStart(selectedCharacters), selectedCharacters.length !== playerCount));
  root.append(shell);
}
