/**
 * Backend Integration Service
 * Connects the game engine with the backend API
 */

export class BackendIntegration {
  constructor(gameEngine, apiService) {
    this.game = gameEngine;
    this.api = apiService; // Use injected apiService
    this.currentSessionId = null;
    this.heartbeatInterval = null;
    this.isConnected = false;
    this.lastSyncTime = 0;
    this.syncInterval = 30000; // 30 seconds
    
    this.setupEventListeners();
    this.initializeConnection();
  }

  setupEventListeners() {
    // API events
    this.api.on('auth:success', (data) => {
      console.log('Authentication successful:', data);
      this.isConnected = true;
      this.updateOfflineBanner();
      this.syncUserData();
    });

    this.api.on('auth:error', (error) => {
      console.error('Authentication failed:', error);
      this.isConnected = false;
      this.updateOfflineBanner();
    });

    this.api.on('connection:connected', () => {
      console.log('Backend connected');
      this.isConnected = true;
      this.updateOfflineBanner();
    });

    this.api.on('connection:disconnected', () => {
      console.log('Backend disconnected');
      this.isConnected = false;
      this.updateOfflineBanner();
      this.stopHeartbeat();
    });

    this.api.on('game:session-started', (data) => {
      console.log('Game session started:', data);
      this.currentSessionId = data.sessionId;
      this.startHeartbeat();
    });

    this.api.on('game:session-ended', (data) => {
      console.log('Game session ended:', data);
      this.currentSessionId = null;
      this.stopHeartbeat();
      this.syncUserData();
    });

    this.api.on('game:era-changed', (data) => {
      console.log('🎉 Era changed!', data);
      const message = `Поздравляем! Вы достигли новой эры: ${data.newEraName}!`;
      
      if (window.telegramApp && window.telegramApp.isTelegram) {
        window.telegramApp.showToast(message);
        window.telegramApp.hapticNotification('success');
      } else {
        alert(message);
      }
      
      this.syncUserData();
    });

    this.api.on('economy:updated', (data) => {
      console.log('Economy updated:', data);
      this.syncUserData();
    });

    // Game events - using custom event listeners
    if (this.game) {
      // Listen for custom events dispatched on window
      window.addEventListener('gameStart', () => {
        this.startGameSession();
      });

      window.addEventListener('gameOver', (event) => {
        this.endGameSession(event.detail?.score || 0);
      });

      window.addEventListener('scoreUpdate', (event) => {
        this.updateScore(event.detail?.score || 0);
      });
    }
  }

  updateOfflineBanner() {
    const banner = document.getElementById('offline-banner');
    if (!banner) return;
    if (this.isConnected) banner.classList.add('hidden');
    else banner.classList.remove('hidden');
  }

  async initializeConnection() {
    try {
      const isValid = await this.api.verifyToken();
      if (isValid) {
        this.isConnected = true;
        this.updateOfflineBanner();
        this.api.connectWebSocket();
        await this.syncUserData();
      } else {
        console.log('No authentication available, running in offline mode');
        this.isConnected = false;
        this.updateOfflineBanner();
      }
    } catch (error) {
      console.error('Failed to initialize backend connection:', error);
      this.isConnected = false;
      this.updateOfflineBanner();
    }
  }

  async startGameSession() {
    if (!this.isConnected) {
      console.log('Backend not connected, skipping session start');
      return;
    }
    try {
      await this.api.startGameSession();
    } catch (error) {
      console.error('Failed to start game session:', error);
    }
  }

  async endGameSession(score) {
    if (!this.isConnected || !this.currentSessionId) {
      console.log('Backend not connected or no active session');
      return;
    }
    try {
      const duration = Date.now() - this.game.startTime;
      await this.api.endGameSession(this.currentSessionId, score, duration);
    } catch (error) {
      console.error('Failed to end game session:', error);
    }
  }

  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.heartbeatInterval = setInterval(() => {
      if (this.currentSessionId && this.isConnected) {
        this.api.sendHeartbeat(this.currentSessionId);
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async syncUserData() {
    if (!this.isConnected) return;
    try {
      const stats = await this.api.getUserStats();
      if (this.game) {
        this.game.score = stats.totalPoints || 0;
        this.game.coins = stats.totalCoins || 0;
        if (this.game.era !== (stats.currentEra || 1)) {
          this.game.setEra(stats.currentEra || 1);
        } else {
          this.game.era = stats.currentEra || 1;
        }
        this.updateUI();
      }
      if (window.economy) {
        window.economy.setUserPoints(stats.totalPoints || 0);
        window.economy.setUserCoins(stats.totalCoins || 0);
        window.economy.setUserEra(stats.currentEra || 1);
      }
      this.lastSyncTime = Date.now();
    } catch (error) {
      console.error('Failed to sync user data:', error);
      this.isConnected = false;
      this.updateOfflineBanner();
    }
  }

  updateUI() {
    const scoreEl = document.getElementById('score');
    const coinsEl = document.getElementById('coins');
    const eraEl = document.getElementById('era');
    if (scoreEl) scoreEl.textContent = this.game.score.toLocaleString();
    if (coinsEl) coinsEl.textContent = this.game.coins.toLocaleString();
    if (eraEl) eraEl.textContent = this.game.era;

    const mainMenuScore = document.getElementById('mms-score');
    const mainMenuCoins = document.getElementById('mms-coins');
    const mainMenuEra = document.getElementById('mms-era');
    if (mainMenuScore) mainMenuScore.textContent = this.game.score.toLocaleString();
    if (mainMenuCoins) mainMenuCoins.textContent = this.game.coins.toLocaleString();
    if (mainMenuEra) mainMenuEra.textContent = this.game.era;
  }

  async updateScore(score) {}

  async exchangePoints(coinsWanted) {
    if (!this.isConnected) throw new Error('Backend not connected');
    const result = await this.api.exchangePoints(coinsWanted);
    if (result.success && this.game) {
      this.game.coins = result.newStats.totalCoins;
      this.game.score = result.newStats.totalPoints;
      if (window.economy) {
        window.economy.setUserCoins(result.newStats.totalCoins);
        window.economy.setUserPoints(result.newStats.totalPoints);
      }
      this.updateUI();
    }
    return result;
  }

  async withdrawCoins(amount, tonAddress) {
    if (!this.isConnected) throw new Error('Backend not connected');
    const result = await this.api.withdrawCoins(amount, tonAddress);
    if (result.success && this.game) {
      this.game.coins = result.newStats.totalCoins;
      if (window.economy) {
        window.economy.setUserCoins(result.newStats.totalCoins);
      }
      this.updateUI();
    }
    return result;
  }

  handleNetworkError(error) {
    console.error('Network error:', error);
    const errorMessage = this.getErrorMessage(error);
    if (window.telegramApp) window.telegramApp.showToast(errorMessage, 'error');
    else alert(errorMessage);
  }

  getErrorMessage(error) {
    if (error.message.includes('NetworkError')) return 'Проблема с подключением к серверу. Проверьте интернет-соединение.';
    if (error.message.includes('401')) return 'Ошибка авторизации. Попробуйте перезагрузить игру.';
    if (error.message.includes('429')) return 'Слишком много запросов. Подождите немного.';
    return 'Произошла ошибка. Попробуйте позже.';
  }

  destroy() {
    this.stopHeartbeat();
    this.api.off('auth:success');
    this.api.off('auth:error');
    this.api.off('game:session-started');
    this.api.off('game:session-ended');
    this.api.off('game:era-changed');
    this.api.off('economy:updated');
    this.api.off('connection:connected');
    this.api.off('connection:disconnected');
  }

  isBackendConnected() { return this.isConnected; }

  getConnectionStatus() { return { connected: this.isConnected, sessionId: this.currentSessionId, lastSync: this.lastSyncTime }; }
}
