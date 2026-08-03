import test from 'node:test';
import assert from 'node:assert/strict';
import {
  blackjackHit,
  blackjackStand,
  chooseDiceBet,
  chooseMafiaCup,
  createGame,
  drawEventCard,
  resolveDiceBet,
  resolveTile,
  startBlackjack
} from '../js/game-state.mjs';

const players = [
  { id: 'red', name: 'Red', avatar: 'img/cha_r.png', color: '#ef5b67' },
  { id: 'green', name: 'Green', avatar: 'img/cha_g.png', color: '#54c99b' }
];

function withRandom(game, values) {
  return { ...game, random: () => values.shift() };
}

test('landing on Mafia awaits a randomly selected cup', () => {
  const game = createGame({ players, random: () => 0 });
  const landed = resolveTile({
    ...game,
    players: [{ ...game.players[0], position: 12 }, game.players[1]],
    phase: 'resolving-tile'
  });

  assert.equal(landed.phase, 'awaiting-mafia');
  assert.equal(landed.pendingAction.correctCup, 0);
});

test('a wrong Mafia cup adds ₩150,000 Debt', () => {
  const game = {
    ...createGame({ players, random: () => 0 }),
    phase: 'awaiting-mafia',
    pendingAction: { correctCup: 0 }
  };

  assert.equal(chooseMafiaCup(game, 1).players[0].debt, 1_150_000);
});

test('a correct Mafia cup leaves Debt unchanged', () => {
  const game = {
    ...createGame({ players, random: () => 0 }),
    phase: 'awaiting-mafia',
    pendingAction: { correctCup: 1 }
  };

  assert.equal(chooseMafiaCup(game, 1).players[0].debt, 1_000_000);
});

test('a correct high bet reduces debt by ₩200,000', () => {
  const game = { ...createGame({ players, random: () => 0.99 }), phase: 'awaiting-dice-bet' };
  const selected = chooseDiceBet(game, 'high');
  const resolved = resolveDiceBet(selected);

  assert.equal(resolved.players[0].debt, 800_000);
  assert.equal(resolved.players[0].gummies, 2);
});

test('a seven refunds the gummy without changing Debt', () => {
  const game = withRandom(
    { ...createGame({ players, random: () => 0 }), phase: 'awaiting-dice-bet' },
    [0, 0.99]
  );
  const resolved = resolveDiceBet(chooseDiceBet(game, 'low'));

  assert.equal(resolved.lastRoll.total, 7);
  assert.equal(resolved.players[0].debt, 1_000_000);
  assert.equal(resolved.players[0].gummies, 3);
});

test('dice bets require a valid side and one gummy', () => {
  const game = { ...createGame({ players, random: () => 0 }), phase: 'awaiting-dice-bet' };
  const noGummies = { ...game, players: [{ ...game.players[0], gummies: 0 }, game.players[1]] };

  assert.throws(() => chooseDiceBet(game, 'seven'), RangeError);
  assert.throws(() => chooseDiceBet(noGummies, 'low'), RangeError);
});

test('Blackjack dealer draws below 17 and a player win reduces Debt', () => {
  const game = withRandom(createGame({ players, random: () => 0 }), [0.9, 0.7, 0.9, 0.4, 0.1]);
  const started = startBlackjack({ ...game, phase: 'awaiting-blackjack' });
  const resolved = blackjackStand(started);

  assert.deepEqual(resolved.pendingAction.dealerCards, [10, 5, 2]);
  assert.equal(resolved.players[0].debt, 800_000);
  assert.equal(resolved.players[0].gummies, 2);
});

test('a Blackjack hit draws one card and a bust loses the gummy', () => {
  const game = withRandom(createGame({ players, random: () => 0 }), [0.9, 0.5, 0.4, 0.4, 0.9]);
  const started = startBlackjack({ ...game, phase: 'awaiting-blackjack' });
  const busted = blackjackHit(started);

  assert.deepEqual(busted.pendingAction.playerCards, [10, 6, 10]);
  assert.equal(busted.players[0].gummies, 2);
  assert.equal(busted.players[0].debt, 1_000_000);
  assert.equal(busted.phase, 'turn-complete');
});

test('a Blackjack tie refunds the gummy', () => {
  const game = withRandom(createGame({ players, random: () => 0 }), [0.9, 0.7, 0.9, 0.7]);
  const started = startBlackjack({ ...game, phase: 'awaiting-blackjack' });
  const resolved = blackjackStand(started);

  assert.equal(resolved.players[0].gummies, 3);
  assert.equal(resolved.players[0].debt, 1_000_000);
});

test('Blackjack treats an Ace as 11 only when it does not bust the hand', () => {
  const game = withRandom(createGame({ players, random: () => 0 }), [0.9, 0.7, 0, 0.4, 0]);
  const started = startBlackjack({ ...game, phase: 'awaiting-blackjack' });
  const resolved = blackjackStand(started);

  assert.deepEqual(resolved.pendingAction.dealerCards, [1, 5, 1]);
  assert.equal(resolved.players[0].debt, 800_000);
});

test('spending a final gummy on a dice bet immediately defeats the player', () => {
  const created = createGame({ players, random: () => 0 });
  const game = {
    ...created,
    phase: 'awaiting-dice-bet',
    players: [{ ...created.players[0], gummies: 1 }, created.players[1]]
  };
  const selected = chooseDiceBet(game, 'low');

  assert.equal(selected.phase, 'game-over');
  assert.equal(selected.result.type, 'defeat');
});

test('a rare debt-clear card only wins on its 1-in-100 roulette slot', () => {
  const game = createGame({ players, random: () => 0 });
  const rare = { ...game, eventDeck: [{ kind: 'debt-clear-roulette' }], eventDiscard: [] };
  const resolved = drawEventCard(rare);

  assert.equal(resolved.players[0].debt, 0);
  assert.equal(resolved.result.type, 'victory');
});

test('rare roulette losses do not change resources and a debt-double win doubles Debt', () => {
  const game = createGame({ players, random: () => 0 });
  const failed = drawEventCard({
    ...game,
    random: () => 0.01,
    eventDeck: [{ kind: 'debt-clear-roulette' }],
    eventDiscard: []
  });
  const doubled = drawEventCard({
    ...game,
    eventDeck: [{ kind: 'debt-double-roulette' }],
    eventDiscard: []
  });

  assert.equal(failed.players[0].debt, 1_000_000);
  assert.equal(doubled.players[0].debt, 2_000_000);
});
