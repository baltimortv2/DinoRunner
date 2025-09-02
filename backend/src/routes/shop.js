const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

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

// Middleware для извлечения user_id
function extractUserId(req) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    throw new Error('User ID required');
  }
  return userId;
}

// Инициализация пользователя скинов в базе данных
async function initUserSkins(userId) {
  try {
    // Проверяем, есть ли пользователь
    const userResult = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    // Проверяем, есть ли уже скины у пользователя
    const skinsResult = await pool.query('SELECT COUNT(*) as count FROM user_skins WHERE user_id = $1', [userId]);
    
    if (parseInt(skinsResult.rows[0].count) === 0) {
      // Создаем стандартные скины
      const defaultSkins = AVAILABLE_SKINS.filter(s => s.defaultOwned);
      
      for (const skin of defaultSkins) {
        await pool.query(
          'INSERT INTO user_skins (user_id, skin_id, owned, active, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [userId, skin.id, true, true]
        );
      }
      
      // Устанавливаем активные скины по умолчанию
      await pool.query(
        'UPDATE users SET active_character = $1, active_ground = $2, active_enemies_ground = $3, active_enemies_air = $4, active_clouds = $5 WHERE telegram_id = $6',
        ['standart', 'standart', 'standart', 'standart', 'standart', userId]
      );
    }
  } catch (error) {
    console.error('Error initializing user skins:', error);
    throw error;
  }
}

// GET /api/shop/skins
router.get('/skins', async (req, res) => {
  try {
    const userId = extractUserId(req);
    
    // Инициализируем скины пользователя
    await initUserSkins(userId);
    
    // Получаем скины пользователя
    const userSkinsResult = await pool.query(
      'SELECT skin_id, owned, active FROM user_skins WHERE user_id = $1',
      [userId]
    );
    
    const userSkinsMap = new Map();
    userSkinsResult.rows.forEach(row => {
      userSkinsMap.set(row.skin_id, { owned: row.owned, active: row.active });
    });
    
    // Возвращаем список скинов с информацией о владении
    const skinsWithOwnership = AVAILABLE_SKINS.map(skin => ({
      ...skin,
      owned: userSkinsMap.has(skin.id) ? userSkinsMap.get(skin.id).owned : false,
      active: userSkinsMap.has(skin.id) ? userSkinsMap.get(skin.id).active : false
    }));
    
    res.json({
      success: true,
      skins: skinsWithOwnership
    });
  } catch (error) {
    console.error('Get skins error:', error);
    res.status(500).json({ error: 'Failed to get skins' });
  }
});

// POST /api/shop/purchase
router.post('/purchase', async (req, res) => {
  try {
    const { skinId } = req.body;
    const userId = extractUserId(req);
    
    if (!skinId) {
      return res.status(400).json({ error: 'Skin ID required' });
    }
    
    // Находим скин
    const skin = AVAILABLE_SKINS.find(s => s.id === skinId);
    if (!skin) {
      return res.status(404).json({ error: 'Skin not found' });
    }
    
    if (skin.price === 0) {
      return res.status(400).json({ error: 'Cannot purchase free skin' });
    }
    
    // Проверяем баланс пользователя
    const userResult = await pool.query(
      'SELECT coins FROM users WHERE telegram_id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userCoins = userResult.rows[0].coins;
    
    if (userCoins < skin.price) {
      return res.status(400).json({ 
        error: 'Insufficient coins',
        required: skin.price,
        available: userCoins
      });
    }
    
    // Проверяем, не куплен ли уже скин
    const existingSkinResult = await pool.query(
      'SELECT owned FROM user_skins WHERE user_id = $1 AND skin_id = $2',
      [userId, skinId]
    );
    
    if (existingSkinResult.rows.length > 0 && existingSkinResult.rows[0].owned) {
      return res.status(400).json({ error: 'Skin already owned' });
    }
    
    // Начинаем транзакцию
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Списываем монеты
      await client.query(
        'UPDATE users SET coins = coins - $1 WHERE telegram_id = $2',
        [skin.price, userId]
      );
      
      // Добавляем скин пользователю
      if (existingSkinResult.rows.length > 0) {
        await client.query(
          'UPDATE user_skins SET owned = true WHERE user_id = $1 AND skin_id = $2',
          [userId, skinId]
        );
      } else {
        await client.query(
          'INSERT INTO user_skins (user_id, skin_id, owned, active, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [userId, skinId, true, false]
        );
      }
      
      await client.query('COMMIT');
      
      // Получаем обновленный баланс
      const newBalanceResult = await pool.query(
        'SELECT coins FROM users WHERE telegram_id = $1',
        [userId]
      );
      
      res.json({
        success: true,
        message: 'Skin purchased successfully',
        skin: skin,
        newBalance: newBalanceResult.rows[0].coins
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Purchase skin error:', error);
    res.status(500).json({ error: 'Failed to purchase skin' });
  }
});

// POST /api/shop/activate
router.post('/activate', async (req, res) => {
  try {
    const { skinId } = req.body;
    const userId = extractUserId(req);
    
    if (!skinId) {
      return res.status(400).json({ error: 'Skin ID required' });
    }
    
    // Находим скин
    const skin = AVAILABLE_SKINS.find(s => s.id === skinId);
    if (!skin) {
      return res.status(404).json({ error: 'Skin not found' });
    }
    
    // Проверяем, есть ли скин у пользователя
    const userSkinResult = await pool.query(
      'SELECT owned FROM user_skins WHERE user_id = $1 AND skin_id = $2',
      [userId, skinId]
    );
    
    if (userSkinResult.rows.length === 0 || !userSkinResult.rows[0].owned) {
      return res.status(400).json({ error: 'Skin not owned' });
    }
    
    // Активируем скин
    await pool.query(
      'UPDATE user_skins SET active = false WHERE user_id = $1 AND type = $2',
      [userId, skin.type]
    );
    
    await pool.query(
      'UPDATE user_skins SET active = true WHERE user_id = $1 AND skin_id = $2',
      [userId, skinId]
    );
    
    // Обновляем активные скины в таблице users
    const updateField = `active_${skin.type.replace('enemies', 'enemies_')}`;
    await pool.query(
      `UPDATE users SET ${updateField} = $1 WHERE telegram_id = $2`,
      [skin.packName, userId]
    );
    
    res.json({
      success: true,
      message: 'Skin activated successfully',
      skin: skin
    });
  } catch (error) {
    console.error('Activate skin error:', error);
    res.status(500).json({ error: 'Failed to activate skin' });
  }
});

// GET /api/shop/user-skins
router.get('/user-skins', async (req, res) => {
  try {
    const userId = extractUserId(req);
    
    // Получаем активные скины пользователя
    const userResult = await pool.query(
      'SELECT active_character, active_ground, active_enemies_ground, active_enemies_air, active_clouds FROM users WHERE telegram_id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const activeSkins = userResult.rows[0];
    
    res.json({
      success: true,
      activeSkins: {
        character: activeSkins.active_character,
        ground: activeSkins.active_ground,
        enemiesGround: activeSkins.active_enemies_ground,
        enemiesAir: activeSkins.active_enemies_air,
        clouds: activeSkins.active_clouds
      }
    });
  } catch (error) {
    console.error('Get user skins error:', error);
    res.status(500).json({ error: 'Failed to get user skins' });
  }
});

module.exports = router;
