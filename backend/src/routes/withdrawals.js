const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const authMiddleware = require('../middleware/authMiddleware');
const { run, get } = require('../database/sqlite-connection');

// POST /api/withdrawals/request - Запрос на вывод монет
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { amount, tonAddress } = req.body;
    const telegramId = req.user.telegramId;

    // Валидация входных данных
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Неверная сумма для вывода' 
      });
    }

    if (!tonAddress || !tonAddress.startsWith('EQ') || tonAddress.length !== 48) {
      return res.status(400).json({ 
        success: false, 
        error: 'Неверный TON адрес' 
      });
    }

    // Проверяем баланс пользователя
    const user = await userService.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Пользователь не найден' 
      });
    }

    if (user.coins < amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Недостаточно монет для вывода' 
      });
    }

    // Минимальная сумма для вывода
    const MIN_WITHDRAWAL = 1000;
    if (amount < MIN_WITHDRAWAL) {
      return res.status(400).json({ 
        success: false, 
        error: `Минимальная сумма для вывода: ${MIN_WITHDRAWAL} монет` 
      });
    }

    // Создаем запрос на вывод
    const withdrawalId = await run(
      `INSERT INTO withdrawals (user_id, amount, ton_address, status, created_at) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [user.id, amount, tonAddress, 'pending']
    );

    // Списываем монеты с баланса пользователя
    await userService.spendCoins(telegramId, amount);

    console.log(`✅ Withdrawal request created: ${amount} coins from ${telegramId} to ${tonAddress}`);

    res.json({
      success: true,
      message: 'Запрос на вывод создан',
      withdrawalId: withdrawalId.lastID,
      amount,
      tonAddress,
      newBalance: user.coins - amount
    });

  } catch (error) {
    console.error('❌ Error creating withdrawal request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка создания запроса на вывод' 
    });
  }
});

// GET /api/withdrawals/history - История выводов пользователя
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;
    
    // Получаем историю через userService
    const withdrawals = await userService.getUserWithdrawals(telegramId);

    res.json({
      success: true,
      withdrawals: withdrawals
    });

  } catch (error) {
    console.error('❌ Error getting withdrawal history:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Ошибка получения истории выводов' 
    });
  }
});

// GET /api/withdrawals/stats - Статистика выводов (для админов)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Проверяем, является ли пользователь админом
    const telegramId = req.user.telegramId;
    const user = await userService.findByTelegramId(telegramId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Доступ запрещен' 
      });
    }

    // Получаем статистику через userService
    const stats = await userService.getWithdrawalStats();

    res.json({
      success: true,
      stats: {
        totalWithdrawals: stats.total,
        totalAmount: stats.completed,
        pendingAmount: stats.pending,
        recentWithdrawals: stats.recent
      }
    });

  } catch (error) {
    console.error('❌ Error getting withdrawal stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка получения статистики выводов' 
    });
  }
});

// POST /api/withdrawals/process - Обработка вывода (для админов)
router.post('/process', authMiddleware, async (req, res) => {
  try {
    const { withdrawalId, action, txHash } = req.body;
    const telegramId = req.user.telegramId;

    // Обрабатываем вывод через userService
    const result = await userService.processWithdrawal(withdrawalId, action, telegramId, txHash);

    res.json({
      success: true,
      message: result.message,
      withdrawalId,
      newStatus: result.newStatus
    });

  } catch (error) {
    console.error('❌ Error processing withdrawal:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Ошибка обработки вывода' 
    });
  }
});

module.exports = router;
