const express = require('express');
const router = express.Router();
const userService = require('../services/userService');

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

// Middleware для извлечения Telegram user ID
function extractTelegramUserId(req) {
  const telegramId = req.headers['x-telegram-id'] || req.body.telegramId;

  if (!telegramId) {
    // Пытаемся получить из JWT токена или других источников
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Здесь можно добавить логику для извлечения user ID из JWT
      // Пока возвращаем тестовый ID
      return 12345;
    }

    throw new Error('Telegram User ID required');
  }

  return parseInt(telegramId);
}

// GET /api/shop/skins
router.get('/skins', async (req, res) => {
  try {
    const telegramId = extractTelegramUserId(req);

    // Получаем пользователя и его скины
    const user = await userService.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Получаем активные скины пользователя
    const userSkins = await userService.getUserSkins(telegramId);

    // Формируем список доступных скинов с информацией о владении
    const availableSkins = AVAILABLE_SKINS.map(skin => {
      const userSkin = userSkins.find(us => us.skin_id === skin.id);
      return {
        ...skin,
        owned: userSkin ? userSkin.owned : skin.defaultOwned,
        active: userSkin ? userSkin.active : skin.defaultOwned,
        canAfford: user.coins >= skin.price
      };
    });

    res.json({
      success: true,
      skins: availableSkins,
      userBalance: user.coins
    });

    console.log(`🛍️ Shop skins retrieved for Telegram user ${telegramId}`);
  } catch (error) {
    console.error('❌ Error getting shop skins:', error);
    res.status(500).json({ error: 'Failed to get shop skins' });
  }
});

// POST /api/shop/buy-skin
router.post('/buy-skin', async (req, res) => {
  try {
    const telegramId = extractTelegramUserId(req);
    const { skinId } = req.body;

    if (!skinId) {
      return res.status(400).json({ error: 'Skin ID is required' });
    }

    // Находим скин в списке доступных
    const skin = AVAILABLE_SKINS.find(s => s.id === skinId);
    if (!skin) {
      return res.status(404).json({ error: 'Skin not found' });
    }

    // Получаем пользователя
    const user = await userService.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Проверяем, есть ли уже этот скин
    const userSkins = await userService.getUserSkins(telegramId);
    const existingSkin = userSkins.find(us => us.skin_id === skinId);
    
    if (existingSkin && existingSkin.owned) {
      return res.status(400).json({ error: 'Skin already owned' });
    }

    // Проверяем баланс
    if (user.coins < skin.price) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }

    // Покупаем скин
    await userService.buySkin(telegramId, skinId, skin.price);

    // Получаем обновленные данные пользователя
    const updatedUser = await userService.findByTelegramId(telegramId);
    const updatedSkins = await userService.getUserSkins(telegramId);

    res.json({
      success: true,
      message: 'Skin purchased successfully',
      userBalance: updatedUser.coins,
      purchasedSkin: updatedSkins.find(us => us.skin_id === skinId)
    });

    console.log(`💰 Skin ${skinId} purchased for Telegram user ${telegramId}`);
  } catch (error) {
    console.error('❌ Error buying skin:', error);
    res.status(500).json({ error: 'Failed to buy skin' });
  }
});

// POST /api/shop/activate-skin
router.post('/activate-skin', async (req, res) => {
  try {
    const telegramId = extractTelegramUserId(req);
    const { skinId } = req.body;

    if (!skinId) {
      return res.status(400).json({ error: 'Skin ID is required' });
    }

    // Активируем скин
    await userService.activateSkin(telegramId, skinId);

    // Получаем обновленные активные скины
    const activeSkins = await userService.getActiveSkins(telegramId);

    res.json({
      success: true,
      message: 'Skin activated successfully',
      activeSkins
    });

    console.log(`✨ Skin ${skinId} activated for Telegram user ${telegramId}`);
  } catch (error) {
    console.error('❌ Error activating skin:', error);
    res.status(500).json({ error: 'Failed to activate skin' });
  }
});

// GET /api/shop/user-skins
router.get('/user-skins', async (req, res) => {
  try {
    const telegramId = extractTelegramUserId(req);

    // Получаем скины пользователя
    const userSkins = await userService.getUserSkins(telegramId);
    const activeSkins = await userService.getActiveSkins(telegramId);

    res.json({
      success: true,
      userSkins,
      activeSkins
    });

    console.log(`🎨 User skins retrieved for Telegram user ${telegramId}`);
  } catch (error) {
    console.error('❌ Error getting user skins:', error);
    res.status(500).json({ error: 'Failed to get user skins' });
  }
});

// POST /api/shop/reset-skins
router.post('/reset-skins', async (req, res) => {
  try {
    const telegramId = extractTelegramUserId(req);

    // Сбрасываем скины на стандартные
    await userService.resetSkinsToDefault(telegramId);

    // Получаем обновленные активные скины
    const activeSkins = await userService.getActiveSkins(telegramId);

    res.json({
      success: true,
      message: 'Skins reset to default successfully',
      activeSkins
    });

    console.log(`🔄 Skins reset to default for Telegram user ${telegramId}`);
  } catch (error) {
    console.error('❌ Error resetting skins:', error);
    res.status(500).json({ error: 'Failed to reset skins' });
  }
});

module.exports = router;
