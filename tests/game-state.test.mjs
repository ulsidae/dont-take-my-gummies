import test from 'node:test';
import assert from 'node:assert/strict';
import {
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

test('moves by two dice and awards a gummy when passing Start', () => {
  const game = createGame({ players, random: () => 0 });
  const nearStart = { ...game, players: [{ ...game.players[0], position: 22 }, game.players[1]] };
  const moved = rollStandardTurn(nearStart);
  assert.deepEqual(moved.lastRoll.dice, [1, 1]);
  assert.equal(moved.players[0].position, 0);
  assert.equal(moved.players[0].gummies, 4);
});

test('routes jailed players through the jail turn instead of normal movement', () => {
  const values = [...Array(7).fill(0.5), 0, 0.2];
  const game = createGame({ players, random: () => values.shift() });
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

test('doubles release a jailed player and move by that roll', () => {
  const game = createGame({ players, random: () => 0 });
  const jailed = { ...game, players: [{ ...game.players[0], jailed: true, jailAttempts: 1 }, game.players[1]] };
  const released = resolveJailTurn(jailed);

  assert.equal(released.players[0].jailed, false);
  assert.equal(released.players[0].jailAttempts, 0);
  assert.equal(released.players[0].position, 2);
});

test('a failed jail roll ends the turn and counts one attempt', () => {
  const values = [...Array(7).fill(0.5), 0, 0.2];
  const game = createGame({ players, random: () => values.shift() });
  const jailed = { ...game, players: [{ ...game.players[0], jailed: true }, game.players[1]] };
  const failed = resolveJailTurn(jailed);

  assert.equal(failed.players[0].jailed, true);
  assert.equal(failed.players[0].jailAttempts, 1);
  assert.deepEqual(failed.lastRoll.dice, [1, 2]);
  assert.equal(failed.phase, 'turn-complete');
});

test('third failed jail attempt releases without moving', () => {
  const values = [...Array(7).fill(0.5), 0, 0.2];
  const game = createGame({ players, random: () => values.shift() });
  const jailed = { ...game, players: [{ ...game.players[0], jailed: true, jailAttempts: 2, position: 6 }, game.players[1]] };
  const released = resolveJailTurn(jailed);

  assert.equal(released.players[0].jailed, false);
  assert.equal(released.players[0].jailAttempts, 0);
  assert.equal(released.players[0].position, 6);
  assert.equal(released.phase, 'turn-complete');
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
