import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buyTerritory,
  createGame,
  evaluateResult,
  resolveTile,
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
