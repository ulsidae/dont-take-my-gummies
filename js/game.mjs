import {
  advanceTurn,
  blackjackHit,
  blackjackStand,
  buyTerritory,
  chooseDiceBet,
  chooseMafiaCup,
  chooseWorldTravel,
  createGame,
  declineTerritory,
  declineWorldTravel,
  resolveDiceBet,
  resolveJailTurn,
  resolveTile,
  rollStandardTurn,
  startBlackjack
} from './game-state.mjs';
import { renderGame, renderSetup } from './game-ui.mjs';

const root = document.querySelector('#game-root');
const supportedLanguages = new Set(['en', 'ko', 'fr']);
const savedLanguage = globalThis.localStorage?.getItem('lang');
let language = supportedLanguages.has(savedLanguage) ? savedLanguage : 'ko';

async function fetchMessages(selectedLanguage) {
  const response = await fetch(`public/lang/${selectedLanguage}.json`);
  if (!response.ok) throw new Error(`Unable to load ${selectedLanguage} translations.`);
  return response.json();
}

let messages;
try {
  messages = await fetchMessages(language);
} catch (error) {
  console.error('Game language load failed', error);
  language = 'ko';
  messages = await fetchMessages(language);
}

document.documentElement.lang = language;
document.title = messages.gamePageTitle || messages.title || document.title;
let game = null;

function rerender() {
  const handlers = {
    roll: () => {
      const activePlayer = game.players[game.activePlayerIndex];
      game = activePlayer.jailed ? resolveJailTurn(game) : resolveTile(rollStandardTurn(game));
      rerender();
    },
    buyTerritory: () => {
      game = buyTerritory(game);
      rerender();
    },
    declineTerritory: () => {
      game = declineTerritory(game);
      rerender();
    },
    chooseWorldTravel: (destinationIndex) => {
      game = chooseWorldTravel(game, destinationIndex);
      rerender();
    },
    declineWorldTravel: () => {
      game = declineWorldTravel(game);
      rerender();
    },
    chooseMafiaCup: (cupIndex) => {
      game = chooseMafiaCup(game, cupIndex);
      rerender();
    },
    startBlackjack: () => {
      game = startBlackjack(game);
      rerender();
    },
    blackjackHit: () => {
      game = blackjackHit(game);
      rerender();
    },
    blackjackStand: () => {
      game = blackjackStand(game);
      rerender();
    },
    chooseDiceBet: (bet) => {
      game = chooseDiceBet(game, bet);
      rerender();
    },
    resolveDiceBet: () => {
      game = resolveDiceBet(game);
      rerender();
    },
    nextTurn: () => {
      game = advanceTurn(game);
      rerender();
    }
  };

  renderGame(root, game, handlers, messages, language);
}

function startGame(players) {
  game = createGame({ players });
  rerender();
}

renderSetup(root, undefined, startGame, messages);
