import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, rollStandardTurn } from '../js/game-state.mjs';

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
