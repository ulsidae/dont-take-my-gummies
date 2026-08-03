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
