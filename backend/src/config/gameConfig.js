/**
 * Game Configuration
 * Defines core game mechanics, economy, and progression.
 */

// Этапы развития (Эры)
const ERAS = [
  { id: 1, name: "Каменный век", pointsToUnlock: 0, exchangeRate: 1000 },
  { id: 2, name: "Бронзовый век", pointsToUnlock: 10_000_000, exchangeRate: 2000 },
  { id: 3, name: "Железный век", pointsToUnlock: 50_000_000, exchangeRate: 4000 },
  { id: 4, name: "Античность", pointsToUnlock: 150_000_000, exchangeRate: 8000 },
  { id: 5, name: "Средневековье", pointsToUnlock: 300_000_000, exchangeRate: 16000 },
  { id: 6, name: "Возрождение", pointsToUnlock: 500_000_000, exchangeRate: 32000 },
  { id: 7, name: "Новое время", pointsToUnlock: 750_000_000, exchangeRate: 64000 },
  { id: 8, name: "Промышленная революция", pointsToUnlock: 1_000_000_000, exchangeRate: 128000 },
  { id: 9, name: "Век электричества", pointsToUnlock: 1_500_000_000, exchangeRate: 256000 },
  { id: 10, name: "Атомный век", pointsToUnlock: 2_500_000_000, exchangeRate: 512000 },
  { id: 11, name: "Космическая эра", pointsToUnlock: 5_000_000_000, exchangeRate: 1024000 },
  { id: 12, name: "Информационный век", pointsToUnlock: 10_000_000_000, exchangeRate: 2048000 },
  { id: 13, name: "Эра нанотехнологий", pointsToUnlock: 20_000_000_000, exchangeRate: 4096000 },
  { id: 14, name: "Эра сингулярности", pointsToUnlock: 50_000_000_000, exchangeRate: 8192000 },
];

// Ограничения безопасности
const SECURITY_LIMITS = {
  MAX_SCORE_PER_RUN: 30000,
  DAILY_COIN_EXCHANGE_LIMIT: 100,
  MAX_POINTS_PER_SECOND: 50, // Anti-cheat: max points per second of gameplay
};

// Экономика
const ECONOMY_CONFIG = {
  TOTAL_COIN_SUPPLY: 850_000_000,
};

module.exports = {
  ERAS,
  SECURITY_LIMITS,
  ECONOMY_CONFIG,
};

