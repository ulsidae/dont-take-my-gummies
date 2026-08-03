export const TILE_TYPES = Object.freeze({
  START: 'start',
  JAIL: 'jail',
  MAFIA: 'mafia',
  WORLD_TRAVEL: 'world-travel',
  TERRITORY: 'territory',
  JOB: 'job',
  BLACKJACK: 'blackjack',
  DICE_GAME: 'dice-game',
  EVENT: 'event'
});

const BOARD_TYPES = [
  'start', 'territory', 'job', 'event', 'territory', 'blackjack',
  'jail', 'territory', 'job', 'dice-game', 'territory', 'event',
  'mafia', 'territory', 'job', 'blackjack', 'territory', 'event',
  'world-travel', 'territory', 'job', 'dice-game', 'territory', 'event'
];

const STARTING_DEBT = 1_000_000;
const STARTING_GUMMIES = 3;
const EVENT_CARDS = Object.freeze([
  { id: 'job-bonus', type: 'debt', amount: -50_000 },
  { id: 'debt-relief', type: 'debt', amount: -100_000 },
  { id: 'gummy-find', type: 'gummies', amount: 1 },
  { id: 'gummy-gift', type: 'gummies', amount: 1 },
  { id: 'late-fee', type: 'debt', amount: 50_000 },
  { id: 'repair-bill', type: 'debt', amount: 100_000 },
  { id: 'medical-bill', type: 'debt', amount: 150_000 },
  { id: 'gummy-loss', type: 'gummies', amount: -1 }
]);

function createBoard() {
  return BOARD_TYPES.map((type, index) => ({
    index,
    type,
    ownerId: null
  }));
}

function createPlayer(player) {
  return {
    ...player,
    position: 0,
    debt: STARTING_DEBT,
    gummies: STARTING_GUMMIES,
    jailAttempts: 0,
    jailed: false,
    territoryIds: []
  };
}

function shuffleCards(cards, random) {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function createGame({ players, random = Math.random }) {
  if (players.length < 2 || players.length > 4) {
    throw new RangeError('A game requires between 2 and 4 players.');
  }

  return {
    players: players.map(createPlayer),
    activePlayerIndex: 0,
    board: createBoard(),
    eventDeck: shuffleCards(EVENT_CARDS.map((card) => ({ ...card })), random),
    eventDiscard: [],
    phase: 'awaiting-roll',
    pendingAction: null,
    lastRoll: null,
    log: [],
    result: null,
    random
  };
}

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

export function rollStandardTurn(game) {
  if (getActivePlayer(game).jailed) {
    return resolveJailTurn(game);
  }

  const dice = [rollDie(game.random), rollDie(game.random)];
  const movement = dice[0] + dice[1];
  const activePlayer = getActivePlayer(game);
  const nextPosition = (activePlayer.position + movement) % game.board.length;
  const passedStart = activePlayer.position + movement >= game.board.length;
  const movedPlayer = {
    ...activePlayer,
    position: nextPosition,
    gummies: activePlayer.gummies + (passedStart ? 1 : 0)
  };
  const players = game.players.map((player, index) => (
    index === game.activePlayerIndex ? movedPlayer : player
  ));

  return {
    ...game,
    players,
    phase: 'resolving-tile',
    lastRoll: { dice, total: movement }
  };
}

function replaceActivePlayer(game, player) {
  return {
    ...game,
    players: game.players.map((currentPlayer, index) => (
      index === game.activePlayerIndex ? player : currentPlayer
    ))
  };
}

function finishTurn(game) {
  const evaluated = evaluateResult(game);
  return evaluated.result === null ? { ...evaluated, phase: 'turn-complete' } : evaluated;
}

export function evaluateResult(game) {
  if (game.result !== null) {
    return game;
  }

  const activePlayer = getActivePlayer(game);
  let type = null;

  if (activePlayer.debt === 0) {
    type = 'victory';
  } else if (activePlayer.gummies === 0) {
    type = 'defeat';
  }

  return type === null
    ? game
    : {
        ...game,
        phase: 'game-over',
        pendingAction: null,
        result: { type, playerId: activePlayer.id }
      };
}

export function resolveTile(game) {
  const activePlayer = getActivePlayer(game);
  const tileIndex = activePlayer.position;
  const tile = game.board[tileIndex];

  if (tile.type === TILE_TYPES.JOB) {
    const reward = 50_000 + Math.floor(game.random() * 100_001);
    return finishTurn(replaceActivePlayer(game, applyDebt(activePlayer, -reward)));
  }

  if (tile.type === TILE_TYPES.TERRITORY) {
    if (tile.ownerId === null) {
      return {
        ...game,
        phase: 'awaiting-territory-choice',
        pendingAction: { type: 'territory', tileIndex }
      };
    }

    if (tile.ownerId !== activePlayer.id) {
      return finishTurn(replaceActivePlayer(game, applyDebt(activePlayer, 50_000)));
    }
  }

  if (tile.type === TILE_TYPES.JAIL) {
    const jailedPlayer = { ...activePlayer, jailed: true, jailAttempts: 0 };
    return finishTurn(replaceActivePlayer(game, jailedPlayer));
  }

  if (tile.type === TILE_TYPES.WORLD_TRAVEL) {
    return {
      ...game,
      phase: 'awaiting-world-travel',
      pendingAction: { type: 'world-travel' }
    };
  }

  if (tile.type === TILE_TYPES.EVENT) {
    return drawEventCard(game);
  }

  return finishTurn(game);
}

export function buyTerritory(game) {
  if (game.phase !== 'awaiting-territory-choice' || game.pendingAction?.type !== 'territory') {
    return game;
  }

  const tileIndex = game.pendingAction.tileIndex;
  const tile = game.board[tileIndex];
  const activePlayer = getActivePlayer(game);

  if (tile?.type !== TILE_TYPES.TERRITORY || tile.ownerId !== null) {
    return game;
  }

  const boughtPlayer = {
    ...applyDebt(activePlayer, 100_000),
    territoryIds: [...activePlayer.territoryIds, tileIndex]
  };
  const boughtGame = {
    ...replaceActivePlayer(game, boughtPlayer),
    board: game.board.map((currentTile, index) => (
      index === tileIndex ? { ...currentTile, ownerId: activePlayer.id } : currentTile
    )),
    pendingAction: null
  };

  return finishTurn(boughtGame);
}

export function declineTerritory(game) {
  if (game.phase !== 'awaiting-territory-choice' || game.pendingAction?.type !== 'territory') {
    return game;
  }

  const tileIndex = game.pendingAction.tileIndex;
  const declinedGame = {
    ...game,
    phase: 'turn-complete',
    pendingAction: null,
    log: [...game.log, { type: 'territory-declined', playerId: getActivePlayer(game).id, tileIndex }]
  };

  return evaluateResult(declinedGame);
}

export function resolveJailTurn(game) {
  const activePlayer = getActivePlayer(game);

  if (!activePlayer.jailed || game.result !== null) {
    return game;
  }

  const dice = [rollDie(game.random), rollDie(game.random)];
  const total = dice[0] + dice[1];
  const lastRoll = { dice, total };

  if (dice[0] !== dice[1]) {
    const jailAttempts = activePlayer.jailAttempts + 1;
    const releasedPlayer = jailAttempts === 3
      ? { ...activePlayer, jailed: false, jailAttempts: 0 }
      : { ...activePlayer, jailAttempts };

    return finishTurn({
      ...replaceActivePlayer(game, releasedPlayer),
      lastRoll
    });
  }

  const nextPosition = (activePlayer.position + total) % game.board.length;
  const passedStart = activePlayer.position + total >= game.board.length;
  const releasedPlayer = {
    ...activePlayer,
    jailed: false,
    jailAttempts: 0,
    position: nextPosition,
    gummies: activePlayer.gummies + (passedStart ? 1 : 0)
  };

  return resolveTile({
    ...replaceActivePlayer(game, releasedPlayer),
    phase: 'resolving-tile',
    lastRoll
  });
}

export function chooseWorldTravel(game, destinationIndex) {
  if (game.phase !== 'awaiting-world-travel') {
    return game;
  }

  const destination = game.board[destinationIndex];
  const activePlayer = getActivePlayer(game);

  if (destination === undefined || [
    TILE_TYPES.START,
    TILE_TYPES.JAIL,
    TILE_TYPES.MAFIA,
    TILE_TYPES.WORLD_TRAVEL
  ].includes(destination.type)) {
    throw new RangeError('World Travel destination must be a non-corner tile.');
  }

  if (activePlayer.gummies < 1) {
    throw new RangeError('World Travel requires one gummy.');
  }

  const travelledPlayer = {
    ...activePlayer,
    position: destinationIndex,
    gummies: activePlayer.gummies - 1
  };

  const travelledGame = evaluateResult({
    ...replaceActivePlayer(game, travelledPlayer),
    phase: 'resolving-tile',
    pendingAction: null
  });

  return travelledGame.result === null ? resolveTile(travelledGame) : travelledGame;
}

export function declineWorldTravel(game) {
  if (game.phase !== 'awaiting-world-travel') {
    return game;
  }

  const declinedGame = {
    ...game,
    phase: 'turn-complete',
    pendingAction: null,
    log: [...game.log, { type: 'world-travel-declined', playerId: getActivePlayer(game).id }]
  };

  return evaluateResult(declinedGame);
}

export function drawEventCard(game) {
  const eventDeck = game.eventDeck.length === 0
    ? shuffleCards(game.eventDiscard, game.random)
    : game.eventDeck;
  const [card, ...remainingDeck] = eventDeck;

  if (card === undefined) {
    return finishTurn(game);
  }

  const activePlayer = getActivePlayer(game);
  const updatedPlayer = card.type === 'debt'
    ? applyDebt(activePlayer, card.amount)
    : card.type === 'gummies'
      ? applyGummies(activePlayer, card.amount)
      : activePlayer;
  const drawnGame = {
    ...replaceActivePlayer(game, updatedPlayer),
    eventDeck: remainingDeck,
    eventDiscard: [...(game.eventDeck.length === 0 ? [] : game.eventDiscard), card],
    log: [...game.log, { type: 'event-card', playerId: activePlayer.id, card }]
  };

  return finishTurn(drawnGame);
}

export function advanceTurn(game) {
  if (game.result !== null || game.phase !== 'turn-complete') {
    return game;
  }

  return {
    ...game,
    activePlayerIndex: (game.activePlayerIndex + 1) % game.players.length,
    phase: 'awaiting-roll',
    pendingAction: null,
    lastRoll: null
  };
}
