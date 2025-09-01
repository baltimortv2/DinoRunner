/**
 * API Client for Dino Runner Backend
 */

class ApiClient {
  constructor() {
    // Определяем базовый URL в зависимости от окружения
    this.baseURL = window.location.origin;
    this.isOnline = true;
  }

  // Проверка подключения к backend
  async checkConnection() {
    try {
      const response = await fetch(`${this.baseURL}/api/health`);
      this.isOnline = response.ok;
      return this.isOnline;
    } catch (error) {
      console.warn('Backend connection failed:', error);
      this.isOnline = false;
      return false;
    }
  }

  // Общие методы для API запросов
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, finalOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Аутентификация через Telegram
  async authenticateTelegram(initData) {
    return this.request('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData })
    });
  }

  // Получение статистики пользователя
  async getUserStats() {
    return this.request('/game/user-stats');
  }

  // Начало игровой сессии
  async startGameSession() {
    return this.request('/game/session-start', {
      method: 'POST'
    });
  }

  // Завершение игровой сессии
  async endGameSession(sessionData) {
    return this.request('/game/session-end', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  }

  // Получение таблицы лидеров
  async getLeaderboard() {
    return this.request('/game/leaderboard');
  }

  // Получение курсов обмена
  async getExchangeRates() {
    return this.request('/economy/exchange-rates');
  }

  // Обмен очков на монеты
  async exchangePoints(points, era) {
    return this.request('/economy/exchange-points', {
      method: 'POST',
      body: JSON.stringify({ points, era })
    });
  }

  // Вывод монет
  async withdrawCoins(amount, wallet) {
    return this.request('/economy/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, wallet })
    });
  }

  // Получение списка скинов
  async getSkins() {
    return this.request('/shop/skins');
  }

  // Покупка скина
  async buySkin(skinId, skinType) {
    return this.request('/shop/purchase', {
      method: 'POST',
      body: JSON.stringify({ skinId, skinType })
    });
  }

  // Активация скина
  async activateSkin(skinId, skinType) {
    return this.request('/shop/activate', {
      method: 'POST',
      body: JSON.stringify({ skinId, skinType })
    });
  }

  // Получение реферальной ссылки
  async getReferralLink() {
    return this.request('/referrals/link');
  }

  // Получение статистики рефералов
  async getReferralStats() {
    return this.request('/referrals/stats');
  }

  // Регистрация реферала
  async registerReferral(referrerId) {
    return this.request('/referrals/register', {
      method: 'POST',
      body: JSON.stringify({ referrerId })
    });
  }
}

// Создаем глобальный экземпляр API клиента
window.apiClient = new ApiClient();

// Экспортируем для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiClient;
}
