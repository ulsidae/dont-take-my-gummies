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

export function createGame({ players, random = Math.random }) {
  if (players.length < 2 || players.length > 4) {
    throw new RangeError('A game requires between 2 and 4 players.');
  }

  return {
    players: players.map(createPlayer),
    activePlayerIndex: 0,
    board: createBoard(),
    eventDeck: [],
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
