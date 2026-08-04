import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceTurn,
  buyTerritory,
  chooseWorldTravel,
  createGame,
  drawEventCard,
  evaluateResult,
  resolveTile,
  resolveJailTurn,
  rollStandardTurn
} from '../js/game-state.mjs';

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

test('creates the exact approved 24-tile board sequence', () => {
  const game = createGame({ players, random: () => 0 });

  assert.deepEqual(game.board.map((tile) => tile.type), [
    'start', 'territory', 'job', 'event', 'territory', 'blackjack',
    'jail', 'territory', 'job', 'dice-game', 'territory', 'event',
    'mafia', 'territory', 'job', 'blackjack', 'territory', 'event',
    'world-travel', 'territory', 'job', 'dice-game', 'territory', 'event'
  ]);
});

test('creates four positive, four negative, and two rare event cards', () => {
  const game = createGame({ players, random: () => 0 });
  const composition = game.eventDeck.reduce((counts, card) => {
    if (card.kind) counts.rare += 1;
    else if ((card.type === 'debt' && card.amount < 0) || (card.type === 'gummies' && card.amount > 0)) counts.positive += 1;
    else counts.negative += 1;
    return counts;
  }, { positive: 0, negative: 0, rare: 0 });

  assert.deepEqual(composition, { positive: 4, negative: 4, rare: 2 });
});

test('rejects player counts outside the supported two-to-four range', () => {
  assert.throws(() => createGame({ players: players.slice(0, 1) }), RangeError);
  assert.throws(() => createGame({ players: [...players, { id: 'blue' }, { id: 'yellow' }, { id: 'purple' }] }), RangeError);
});

test('moves by two dice and awards a gummy when passing Start', () => {
  const game = createGame({ players, random: () => 0 });
  const nearStart = { ...game, players: [{ ...game.players[0], position: 22 }, game.players[1]] };
  const moved = rollStandardTurn(nearStart);
  assert.deepEqual(moved.lastRoll.dice, [1, 1]);
  assert.equal(moved.players[0].position, 0);
  assert.equal(moved.players[0].gummies, 4);
});

test('routes jailed players through the jail turn instead of normal movement', () => {
  const values = [0, 0.2];
  const game = { ...createGame({ players, random: () => 0.5 }), random: () => values.shift() };
  const jailed = { ...game, players: [{ ...game.players[0], jailed: true }, game.players[1]] };
  const resolved = rollStandardTurn(jailed);

  assert.equal(resolved.players[0].position, 0);
  assert.equal(resolved.players[0].jailAttempts, 1);
  assert.equal(resolved.phase, 'turn-complete');
});

test('buying an unowned territory adds debt and records its owner', () => {
  const game = createGame({ players, random: () => 0 });
  const atTerritory = {
    ...game,
    players: [{ ...game.players[0], position: 1 }, game.players[1]],
    phase: 'resolving-tile'
  };
  const offered = resolveTile(atTerritory);
  const bought = buyTerritory(offered);

  assert.equal(bought.players[0].debt, 1_100_000);
  assert.equal(bought.board[1].ownerId, 'red');
});

test('landing on an opponent territory adds ₩50,000 debt', () => {
  const game = createGame({ players, random: () => 0 });
  const owned = { ...game.board[1], ownerId: 'red' };
  const visitor = {
    ...game,
    activePlayerIndex: 1,
    board: [game.board[0], owned, ...game.board.slice(2)],
    players: [game.players[0], { ...game.players[1], position: 1 }],
    phase: 'resolving-tile'
  };

  assert.equal(resolveTile(visitor).players[1].debt, 1_050_000);
});

test('automatic tile outcomes replace stale prior-player feedback', () => {
  const created = createGame({ players, random: () => 0 });
  const staleLog = [{ type: 'territory-declined', playerId: 'red', tileIndex: 1 }];
  const jobGame = {
    ...created,
    activePlayerIndex: 1,
    players: [created.players[0], { ...created.players[1], position: 2 }],
    phase: 'resolving-tile',
    log: staleLog
  };
  const jobResolved = resolveTile(jobGame);

  assert.equal(jobResolved.phase, 'turn-complete');
  assert.deepEqual(jobResolved.log.at(-1), {
    type: 'job',
    playerId: 'green',
    reward: 50_000
  });

  const startGame = {
    ...created,
    activePlayerIndex: 1,
    players: [created.players[0], { ...created.players[1], position: 22 }],
    log: staleLog
  };
  const startResolved = resolveTile(rollStandardTurn(startGame));

  assert.equal(startResolved.phase, 'turn-complete');
  assert.deepEqual(startResolved.log.at(-1), {
    type: 'start',
    playerId: 'green',
    gummiesAwarded: 1
  });
});

test('territory charges and purchases record the just-completed action', () => {
  const created = createGame({ players, random: () => 0 });
  const staleLog = [{ type: 'world-travel-declined', playerId: 'red' }];
  const ownedTile = { ...created.board[1], ownerId: 'red' };
  const visitor = {
    ...created,
    activePlayerIndex: 1,
    board: [created.board[0], ownedTile, ...created.board.slice(2)],
    players: [created.players[0], { ...created.players[1], position: 1 }],
    phase: 'resolving-tile',
    log: staleLog
  };
  const charged = resolveTile(visitor);

  assert.deepEqual(charged.log.at(-1), {
    type: 'territory-charge',
    playerId: 'green',
    ownerId: 'red',
    tileIndex: 1,
    amount: 50_000
  });

  const offered = resolveTile({
    ...created,
    activePlayerIndex: 1,
    players: [created.players[0], { ...created.players[1], position: 1 }],
    phase: 'resolving-tile',
    log: staleLog
  });
  const bought = buyTerritory(offered);

  assert.deepEqual(bought.log.at(-1), {
    type: 'territory-purchased',
    playerId: 'green',
    tileIndex: 1,
    amount: 100_000
  });
});

test('landing in Jail and failed Jail turns record current-player outcomes', () => {
  const created = createGame({ players, random: () => 0 });
  const staleLog = [{ type: 'territory-declined', playerId: 'red', tileIndex: 1 }];
  const landed = resolveTile({
    ...created,
    activePlayerIndex: 1,
    players: [created.players[0], { ...created.players[1], position: 6 }],
    phase: 'resolving-tile',
    log: staleLog
  });

  assert.deepEqual(landed.log.at(-1), {
    type: 'jail-entered',
    playerId: 'green'
  });

  const rolls = [0, 0.2];
  const failed = resolveJailTurn({
    ...landed,
    phase: 'awaiting-roll',
    random: () => rolls.shift()
  });

  assert.deepEqual(failed.log.at(-1), {
    type: 'jail-roll',
    playerId: 'green',
    dice: [1, 2],
    released: false,
    attempts: 1
  });
});

test('declares victory at zero debt and defeat at zero gummies', () => {
  const game = createGame({ players, random: () => 0 });
  const jobLanding = {
    ...game,
    players: [{ ...game.players[0], position: 2, debt: 40_000 }, game.players[1]],
    phase: 'resolving-tile',
    random: () => 0
  };
  const noGummies = {
    ...game,
    players: [{ ...game.players[0], gummies: 0 }, game.players[1]]
  };

  assert.equal(resolveTile(jobLanding).result.type, 'victory');
  assert.equal(evaluateResult(noGummies).result.type, 'defeat');
});

test('does not advance after a game result is recorded', () => {
  const game = createGame({ players, random: () => 0 });
  const finished = {
    ...game,
    phase: 'game-over',
    result: { type: 'victory', playerId: 'red' }
  };

  assert.equal(advanceTurn(finished), finished);
});

test('doubles release a jailed player and move by that roll', () => {
  const game = createGame({ players, random: () => 0 });
  const jailed = { ...game, players: [{ ...game.players[0], jailed: true, jailAttempts: 1 }, game.players[1]] };
  const released = resolveJailTurn(jailed);

  assert.equal(released.players[0].jailed, false);
  assert.equal(released.players[0].jailAttempts, 0);
  assert.equal(released.players[0].position, 2);
});

test('a failed jail roll ends the turn and counts one attempt', () => {
  const values = [0, 0.2];
  const game = { ...createGame({ players, random: () => 0.5 }), random: () => values.shift() };
  const jailed = { ...game, players: [{ ...game.players[0], jailed: true }, game.players[1]] };
  const failed = resolveJailTurn(jailed);

  assert.equal(failed.players[0].jailed, true);
  assert.equal(failed.players[0].jailAttempts, 1);
  assert.deepEqual(failed.lastRoll.dice, [1, 2]);
  assert.equal(failed.phase, 'turn-complete');
});

test('third failed jail attempt releases without moving', () => {
  const values = [0, 0.2];
  const game = { ...createGame({ players, random: () => 0.5 }), random: () => values.shift() };
  const jailed = { ...game, players: [{ ...game.players[0], jailed: true, jailAttempts: 2, position: 6 }, game.players[1]] };
  const released = resolveJailTurn(jailed);

  assert.equal(released.players[0].jailed, false);
  assert.equal(released.players[0].jailAttempts, 0);
  assert.equal(released.players[0].position, 6);
  assert.equal(released.phase, 'turn-complete');
  assert.deepEqual(released.log.at(-1), {
    type: 'jail-roll',
    playerId: 'red',
    dice: [1, 2],
    released: true,
    attempts: 3
  });
});

test('World Travel spends one gummy and resolves a non-corner destination once', () => {
  const game = createGame({ players, random: () => 0 });
  const waiting = { ...game, players: [{ ...game.players[0], position: 18 }, game.players[1]], phase: 'awaiting-world-travel' };
  const travelled = chooseWorldTravel(waiting, 2);

  assert.equal(travelled.players[0].gummies, 2);
  assert.equal(travelled.players[0].position, 2);
  assert.equal(travelled.phase, 'turn-complete');
  assert.equal(chooseWorldTravel(travelled, 1), travelled);
});

test('World Travel rejects corners and players without a gummy', () => {
  const game = createGame({ players, random: () => 0 });
  const waiting = { ...game, phase: 'awaiting-world-travel' };
  const noGummies = {
    ...waiting,
    players: [{ ...waiting.players[0], gummies: 0 }, waiting.players[1]]
  };

  assert.throws(() => chooseWorldTravel(waiting, 0), RangeError);
  assert.throws(() => chooseWorldTravel(noGummies, 1), RangeError);
});

test('World Travel immediately defeats a player who spends their final gummy', () => {
  const game = createGame({ players, random: () => 0 });
  const waiting = {
    ...game,
    phase: 'awaiting-world-travel',
    players: [{ ...game.players[0], gummies: 1 }, game.players[1]]
  };
  const travelled = chooseWorldTravel(waiting, 1);

  assert.equal(travelled.players[0].position, 1);
  assert.equal(travelled.players[0].gummies, 0);
  assert.equal(travelled.phase, 'game-over');
  assert.equal(travelled.result.type, 'defeat');
  assert.equal(travelled.pendingAction, null);
});

test('drawEventCard reshuffles the discard pile after drawing the final card', () => {
  const game = createGame({ players, random: () => 0 });
  const finalCard = { id: 'final', type: 'gummies', amount: 1 };
  const drawn = drawEventCard({ ...game, eventDeck: [finalCard], eventDiscard: [] });
  const reshuffled = drawEventCard(drawn);

  assert.equal(drawn.players[0].gummies, 4);
  assert.deepEqual(drawn.eventDiscard, [finalCard]);
  assert.equal(reshuffled.players[0].gummies, 5);
  assert.deepEqual(reshuffled.eventDiscard, [finalCard]);
  assert.equal(reshuffled.eventDeck.length, 0);
});

test('creates an event deck shuffled with the game random source', () => {
  const game = createGame({ players, random: () => 0 });

  assert.equal(game.eventDeck[0].id, 'debt-relief');
});
