// Простая экономика на фронтенде (dev). Позже будет заменена бэкендом.

const GLOBAL_KEY = 'econ-global';
const USER_KEY = 'econ-user';

const TOTAL_SUPPLY = 850_000_000; // общий пул монет

// Тир-сетка: до cumulativeIssued -> rate(points:1 coin)
const TIERS = [
  { upTo: 10_000_000, rate: 1_000 },
  { upTo: 50_000_000, rate: 2_000 },
  { upTo: 100_000_000, rate: 4_000 },
  { upTo: 200_000_000, rate: 8_000 },
  { upTo: 300_000_000, rate: 16_000 },
  { upTo: 400_000_000, rate: 32_000 },
  { upTo: 500_000_000, rate: 64_000 },
  { upTo: 600_000_000, rate: 128_000 },
  { upTo: 675_000_000, rate: 256_000 },
  { upTo: 725_000_000, rate: 512_000 },
  { upTo: 775_000_000, rate: 1_024_000 },
  { upTo: 815_000_000, rate: 2_048_000 },
  { upTo: 835_000_000, rate: 4_096_000 },
  { upTo: 850_000_000, rate: 8_192_000 },
];

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function initGlobal() {
  const g = readLocal(GLOBAL_KEY, null);
  if (g && typeof g.issued === 'number') return g;
  const init = { issued: 0, totalSupply: TOTAL_SUPPLY };
  writeLocal(GLOBAL_KEY, init);
  return init;
}

function initUser() {
  const u = readLocal(USER_KEY, null);
  if (u && typeof u.points === 'number' && typeof u.coins === 'number') {
    // Гарантируем наличие поля era
    if (typeof u.era !== 'number') { u.era = 1; writeLocal(USER_KEY, u); }
    return u;
  }
  const init = { points: 0, coins: 0, coinsPurchased: 0, era: 1 };
  writeLocal(USER_KEY, init);
  return init;
}

let GLOBAL = initGlobal();
let USER = initUser();

function getTierForIssued(issued) {
  for (let i = 0; i < TIERS.length; i++) {
    if (issued < TIERS[i].upTo) {
      const prevCap = i === 0 ? 0 : TIERS[i - 1].upTo;
      return { index: i + 1, rate: TIERS[i].rate, cap: TIERS[i].upTo, remainingInTier: TIERS[i].upTo - issued, from: prevCap };
    }
  }
  // Пул исчерпан
  return { index: TIERS.length, rate: TIERS[TIERS.length - 1].rate, cap: TOTAL_SUPPLY, remainingInTier: 0, from: TIERS[TIERS.length - 1].upTo };
}

export function getCurrentRate() {
  GLOBAL = initGlobal();
  return getTierForIssued(GLOBAL.issued);
}

export function getGlobal() {
  GLOBAL = initGlobal();
  return { ...GLOBAL };
}

export function getUser() {
  USER = initUser();
  return { ...USER };
}

export function setUserCoins(coins) {
  USER = initUser();
  USER.coins = Math.max(0, Math.floor(coins || 0));
  writeLocal(USER_KEY, USER);
}

export function setUserEra(era) {
  const e = Math.max(1, Math.floor(era || 1));
  USER = initUser();
  USER.era = e;
  writeLocal(USER_KEY, USER);
}

export function addUserPoints(points) {
  const p = Math.max(0, Math.floor(points || 0));
  if (p <= 0) return;
  USER = initUser();
  USER.points += p;
  writeLocal(USER_KEY, USER);
}

export function spendUserPoints(points) {
  const p = Math.max(0, Math.floor(points || 0));
  USER = initUser();
  if (p > USER.points) return false;
  USER.points -= p;
  writeLocal(USER_KEY, USER);
  return true;
}

export function mintCoinsToUser(coins) {
  const c = Math.max(0, Math.floor(coins || 0));
  if (c <= 0) return false;
  GLOBAL = initGlobal();
  USER = initUser();
  if (GLOBAL.issued + c > TOTAL_SUPPLY) return false;
  GLOBAL.issued += c;
  USER.coins += c;
  USER.coinsPurchased = (USER.coinsPurchased || 0) + c;
  writeLocal(GLOBAL_KEY, GLOBAL);
  writeLocal(USER_KEY, USER);
  return true;
}

export function exchangeCoins(coinsWanted) {
  const c = Math.max(1, Math.floor(Number(coinsWanted || 1)));
  const { rate } = getCurrentRate();
  const cost = c * rate;
  USER = initUser();
  if (cost > USER.points) {
    return { ok: false, reason: 'not_enough_points', cost, rate };
  }
  if (!spendUserPoints(cost)) {
    return { ok: false, reason: 'spend_failed', cost, rate };
  }
  if (!mintCoinsToUser(c)) {
    // откат очков при неудаче минта
    addUserPoints(cost);
    return { ok: false, reason: 'mint_failed', cost, rate };
  }
  return { ok: true, cost, rate };
}


