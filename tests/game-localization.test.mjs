import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, resolveTile } from '../js/game-state.mjs';
import { renderGame, renderSetup } from '../js/game-ui.mjs';

const players = [
  { id: 'red', name: 'Ruby', avatar: 'img/cha_r.png', color: '#ef5b67' },
  { id: 'green', name: 'Mint', avatar: 'img/cha_g.png', color: '#54c99b' }
];

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName;
    this.children = [];
    this.dataset = {};
    this.style = { setProperty() {} };
    this.classList = { add() {} };
    this.textContent = '';
  }

  append(...children) {
    this.children.push(...children);
  }

  replaceChildren(...children) {
    this.children = [...children];
  }

  setAttribute() {}
  addEventListener() {}
}

function allText(element) {
  return [element.textContent, ...element.children.flatMap((child) => (
    child instanceof FakeElement ? [allText(child)] : []
  ))].filter(Boolean).join(' ');
}

async function readDictionary(language) {
  return JSON.parse(await readFile(new URL(`../public/lang/${language}.json`, import.meta.url), 'utf8'));
}

test('game entry loads the selected dictionary and updates the document language', async () => {
  const originalDocument = globalThis.document;
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;
  const root = new FakeElement('main');
  const requested = [];

  globalThis.document = {
    documentElement: { lang: 'en' },
    querySelector: () => root,
    createElement: (tagName) => new FakeElement(tagName)
  };
  globalThis.localStorage = { getItem: () => 'ko' };
  globalThis.fetch = async (url) => {
    requested.push(url);
    return { ok: true, json: () => readDictionary('ko') };
  };

  try {
    await import(`../js/game.mjs?localization-test=${Date.now()}`);
    assert.deepEqual(requested, ['public/lang/ko.json']);
    assert.equal(globalThis.document.documentElement.lang, 'ko');
    assert.match(allText(root), /플레이어 수/);
    assert.match(allText(root), /게임 시작/);
  } finally {
    globalThis.document = originalDocument;
    globalThis.fetch = originalFetch;
    globalThis.localStorage = originalLocalStorage;
  }
});

test('dynamic turn feedback is rendered from the selected dictionary', async () => {
  const originalDocument = globalThis.document;
  const root = new FakeElement('main');
  globalThis.document = { createElement: (tagName) => new FakeElement(tagName) };

  try {
    const french = await readDictionary('fr');
    const created = createGame({ players, random: () => 0 });
    const resolved = resolveTile({
      ...created,
      players: [{ ...created.players[0], position: 2 }, created.players[1]],
      phase: 'resolving-tile'
    });

    renderGame(root, resolved, {}, french, 'fr');
    const text = allText(root);
    assert.match(text, /Tour terminé/);
    assert.match(text, /Ruby a gagné ₩50[  ]000 grâce à son travail\./);
    assert.doesNotMatch(text, /Turn complete|completed an action/);
  } finally {
    globalThis.document = originalDocument;
  }
});
