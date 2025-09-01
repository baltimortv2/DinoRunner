const express = require('express');
const router = express.Router();

// In-memory хранилище для скинов пользователей
const userSkins = new Map(); // userId -> { ownedSkins: [...], activeSkins: {...} }

// Доступные скины в магазине
const AVAILABLE_SKINS = [
  // Characters
  { id: 'char-standart', name: 'Персонаж: Стандартный', price: 0, type: 'character', packName: 'standart', defaultOwned: true },
  { id: 'char-sonic', name: 'Персонаж: Sonic', price: 500, type: 'character', packName: 'sonic', defaultOwned: false },
  { id: 'char-mario', name: 'Персонаж: Mario', price: 500, type: 'character', packName: 'mario', defaultOwned: false },
  { id: 'char-pacman', name: 'Персонаж: Pac-Man', price: 800, type: 'character', packName: 'pacman', defaultOwned: false },
  { id: 'char-premium', name: 'Персонаж: Premium', price: 1000, type: 'character', packName: 'premium', defaultOwned: false },
  { id: 'char-batman', name: 'Персонаж: Batman', price: 1200, type: 'character', packName: 'batman', defaultOwned: false },
  { id: 'char-joker', name: 'Персонаж: Joker', price: 1200, type: 'character', packName: 'joker', defaultOwned: false },
  { id: 'char-supersonic', name: 'Персонаж: SuperSonic', price: 1500, type: 'character', packName: 'supersonic', defaultOwned: false },
  // Ground
  { id: 'ground-standart', name: 'Земля: Стандарт', price: 0, type: 'ground', packName: 'standart', defaultOwned: true },
  { id: 'ground-sonic', name: 'Земля: Sonic', price: 200, type: 'ground', packName: 'sonic', defaultOwned: false },
  { id: 'ground-mario', name: 'Земля: Mario', price: 200, type: 'ground', packName: 'mario', defaultOwned: false },
  { id: 'ground-pacman', name: 'Земля: Pac-Man', price: 200, type: 'ground', packName: 'pacman', defaultOwned: false },
  { id: 'ground-premium', name: 'Земля: Premium', price: 300, type: 'ground', packName: 'premium', defaultOwned: false },
  { id: 'ground-batman', name: 'Земля: Batman', price: 300, type: 'ground', packName: 'batman', defaultOwned: false },
  { id: 'ground-joker', name: 'Земля: Joker', price: 300, type: 'ground', packName: 'joker', defaultOwned: false },
  { id: 'ground-supersonic', name: 'Земля: SuperSonic', price: 300, type: 'ground', packName: 'supersonic', defaultOwned: false },
  // Enemies: ground
  { id: 'enemies-ground-standart', name: 'Наземные враги: Стандарт', price: 0, type: 'enemiesGround', packName: 'standart', defaultOwned: true },
  { id: 'enemies-ground-sonic', name: 'Наземные враги: Sonic', price: 250, type: 'enemiesGround', packName: 'sonic', defaultOwned: false },
  { id: 'enemies-ground-mario', name: 'Наземные враги: Mario', price: 250, type: 'enemiesGround', packName: 'mario', defaultOwned: false },
  { id: 'enemies-ground-pacman', name: 'Наземные враги: Pac-Man', price: 250, type: 'enemiesGround', packName: 'pacman', defaultOwned: false },
  { id: 'enemies-ground-premium', name: 'Наземные враги: Premium', price: 400, type: 'enemiesGround', packName: 'premium', defaultOwned: false },
  { id: 'enemies-ground-batman', name: 'Наземные враги: Batman', price: 400, type: 'enemiesGround', packName: 'batman', defaultOwned: false },
  { id: 'enemies-ground-joker', name: 'Наземные враги: Joker', price: 400, type: 'enemiesGround', packName: 'joker', defaultOwned: false },
  { id: 'enemies-ground-supersonic', name: 'Наземные враги: SuperSonic', price: 450, type: 'enemiesGround', packName: 'supersonic', defaultOwned: false },
  // Enemies: air
  { id: 'enemies-air-standart', name: 'Воздушные враги: Стандарт', price: 0, type: 'enemiesAir', packName: 'standart', defaultOwned: true },
  { id: 'enemies-air-sonic', name: 'Воздушные враги: Sonic', price: 200, type: 'enemiesAir', packName: 'sonic', defaultOwned: false },
  { id: 'enemies-air-mario', name: 'Воздушные враги: Mario', price: 200, type: 'enemiesAir', packName: 'mario', defaultOwned: false },
  { id: 'enemies-air-pacman', name: 'Воздушные враги: Pac-Man', price: 200, type: 'enemiesAir', packName: 'pacman', defaultOwned: false },
  { id: 'enemies-air-premium', name: 'Воздушные враги: Premium', price: 350, type: 'enemiesAir', packName: 'premium', defaultOwned: false },
  { id: 'enemies-air-batman', name: 'Воздушные враги: Batman', price: 350, type: 'enemiesAir', packName: 'batman', defaultOwned: false },
  { id: 'enemies-air-joker', name: 'Воздушные враги: Joker', price: 350, type: 'enemiesAir', packName: 'joker', defaultOwned: false },
  { id: 'enemies-air-supersonic', name: 'Воздушные враги: SuperSonic', price: 350, type: 'enemiesAir', packName: 'supersonic', defaultOwned: false },
  // Clouds
  { id: 'clouds-standart', name: 'Облака: Стандарт', price: 0, type: 'clouds', packName: 'standart', defaultOwned: true },
  { id: 'clouds-mario', name: 'Облака: Mario', price: 150, type: 'clouds', packName: 'mario', defaultOwned: false },
  { id: 'clouds-premium', name: 'Облака: Premium', price: 250, type: 'clouds', packName: 'premium', defaultOwned: false },
  { id: 'clouds-pacman', name: 'Облака: Pac-Man', price: 150, type: 'clouds', packName: 'pacman', defaultOwned: false },
  { id: 'clouds-batman', name: 'Облака: Batman', price: 250, type: 'clouds', packName: 'batman', defaultOwned: false },
  { id: 'clouds-joker', name: 'Облака: Joker', price: 250, type: 'clouds', packName: 'joker', defaultOwned: false },
  { id: 'clouds-supersonic', name: 'Облака: SuperSonic', price: 250, type: 'clouds', packName: 'supersonic', defaultOwned: false },
];

// Для доступа к пользовательской экономике используем глобальный Map
// который создается в economy.js
const globalEconomyMaps = global.economyMaps || { userEconomy: new Map() };
const userEconomy = globalEconomyMaps.userEconomy;

// Middleware для извлечения user_id
function extractUserId(req) {
  const userId = req.headers['x-user-id'] || 'demo-user';
  return userId;
}

// Инициализация пользователя скинов
function initUserSkins(userId) {
  if (!userSkins.has(userId)) {
    // Стандартные скины по умолчанию
    const defaultOwnedSkins = AVAILABLE_SKINS.filter(s => s.defaultOwned).map(s => s.id);
    const defaultActiveSkins = {
      character: 'standart',
      ground: 'standart',
      enemiesGround: 'standart',
      enemiesAir: 'standart',
      clouds: 'standart'
    };
    
    userSkins.set(userId, {
      ownedSkins: defaultOwnedSkins,
      activeSkins: defaultActiveSkins
    });
  }
  return userSkins.get(userId);
}

// GET /api/shop/skins
router.get('/skins', (req, res) => {
  const userId = extractUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const userSkinsData = initUserSkins(userId);
  
  // Возвращаем список скинов с информацией о владении
  const skinsWithOwnership = AVAILABLE_SKINS.map(skin => ({
    ...skin,
    owned: userSkinsData.ownedSkins.includes(skin.id),
    active: userSkinsData.activeSkins[skin.type] === skin.packName
  }));
  
  res.json({
    success: true,
    skins: skinsWithOwnership,
    activeSkins: userSkinsData.activeSkins
  });
});

// POST /api/shop/purchase
router.post('/purchase', (req, res) => {
  const { skinId } = req.body;
  const userId = extractUserId(req);
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!skinId) {
    return res.status(400).json({ error: 'Skin ID is required' });
  }
  
  const skin = AVAILABLE_SKINS.find(s => s.id === skinId);
  if (!skin) {
    return res.status(404).json({ error: 'Skin not found' });
  }
  
  const userSkinsData = initUserSkins(userId);
  
  // Проверяем, не владеет ли уже пользователь этим скином
  if (userSkinsData.ownedSkins.includes(skinId)) {
    return res.status(400).json({ error: 'Skin already owned' });
  }
  
  // Проверяем баланс пользователя
  const userEconData = userEconomy.get(userId) || { points: 0, coins: 0, era: 1 };
  if (userEconData.coins < skin.price) {
    return res.status(400).json({ 
      error: 'Insufficient coins',
      required: skin.price,
      available: userEconData.coins
    });
  }
  
  // Выполняем покупку
  userEconData.coins -= skin.price;
  userSkinsData.ownedSkins.push(skinId);
  
  userEconomy.set(userId, userEconData);
  userSkins.set(userId, userSkinsData);
  
  res.json({
    success: true,
    message: 'Skin purchased successfully',
    purchasedSkin: skin,
    newBalance: userEconData.coins
  });
});

// POST /api/shop/activate
router.post('/activate', (req, res) => {
  const { skinId } = req.body;
  const userId = extractUserId(req);
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!skinId) {
    return res.status(400).json({ error: 'Skin ID is required' });
  }
  
  const skin = AVAILABLE_SKINS.find(s => s.id === skinId);
  if (!skin) {
    return res.status(404).json({ error: 'Skin not found' });
  }
  
  const userSkinsData = initUserSkins(userId);
  
  // Проверяем владение скином
  if (!userSkinsData.ownedSkins.includes(skinId)) {
    return res.status(400).json({ error: 'Skin not owned' });
  }
  
  // Активируем скин
  userSkinsData.activeSkins[skin.type] = skin.packName;
  userSkins.set(userId, userSkinsData);
  
  res.json({
    success: true,
    message: 'Skin activated successfully',
    activatedSkin: skin,
    activeSkins: userSkinsData.activeSkins
  });
});

// GET /api/shop/user-skins
router.get('/user-skins', (req, res) => {
  const userId = extractUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const userSkinsData = initUserSkins(userId);
  
  res.json({
    success: true,
    ownedSkins: userSkinsData.ownedSkins,
    activeSkins: userSkinsData.activeSkins
  });
});

module.exports = router;
