/**
 * Connection Monitor Service
 * Отслеживает состояние соединения с backend сервером
 * Автоматически переключает между онлайн и оффлайн режимами
 */

export class ConnectionMonitor {
  constructor(apiService) {
    this.apiService = apiService; // Используем переданный сервис
    this.healthCheckUrl = '/api/health';
    this.isOnline = true;
    this.lastCheck = Date.now();
    this.checkInterval = 5000; // Проверяем каждые 5 секунд
    this.offlineThreshold = 10000; // Считаем оффлайн после 10 секунд без ответа
    this.retryInterval = null;
    this.offlineBanner = null;
    this.connectionBanner = null;
    this.gamePaused = false;
    this.lastScore = 0;
    
    this.startMonitoring();
  }

  startMonitoring() {
    this.retryInterval = setInterval(() => {
      this.checkConnection();
    }, this.checkInterval);
  }

  stopMonitoring() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }

  async checkConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const isOk = await this.apiService.healthCheck(controller.signal);
      clearTimeout(timeoutId);
      
      if (isOk) {
        this.handleConnectionRestored();
      } else {
        this.handleConnectionLost();
      }
    } catch (error) {
      this.handleConnectionLost();
    }
  }

  handleConnectionLost() {
    if (this.isOnline) {
      console.log('🔴 Connection lost');
      this.isOnline = false;
      this.lastCheck = Date.now();
      
      // Показываем оффлайн баннер
      this.showOfflineBanner();
      
      // Если игра идет, ставим на паузу
      this.pauseGameIfRunning();
      
      // Синхронизируем данные
      this.syncDataOnOffline();
    }
  }

  handleConnectionRestored() {
    if (!this.isOnline) {
      console.log('🟢 Connection restored');
      this.isOnline = true;
      
      // Скрываем оффлайн баннер
      this.hideOfflineBanner();
      
      // Показываем баннер восстановления
      this.showConnectionRestoredBanner();
      
      // Синхронизируем данные с сервером
      this.syncDataOnRestore();
    }
  }

  showOfflineBanner() {
    if (this.offlineBanner) return;
    
    this.offlineBanner = document.createElement('div');
    this.offlineBanner.className = 'offline-banner';
    this.offlineBanner.innerHTML = `
      <div class="offline-content">
        <span class="offline-icon">📡</span>
        <span class="offline-text">OFFLINE</span>
      </div>
    `;
    
    document.body.appendChild(this.offlineBanner);
    
    // Анимация появления
    setTimeout(() => {
      this.offlineBanner.classList.add('show');
    }, 100);
  }

  hideOfflineBanner() {
    if (this.offlineBanner) {
      this.offlineBanner.classList.remove('show');
      setTimeout(() => {
        if (this.offlineBanner && this.offlineBanner.parentNode) {
          this.offlineBanner.parentNode.removeChild(this.offlineBanner);
        }
        this.offlineBanner = null;
      }, 300);
    }
  }

  showConnectionRestoredBanner() {
    if (this.connectionBanner) return;
    
    this.connectionBanner = document.createElement('div');
    this.connectionBanner.className = 'connection-restored-banner';
    this.connectionBanner.innerHTML = `
      <div class="connection-content">
        <span class="connection-icon">✅</span>
        <span class="connection-text">Соединение восстановлено</span>
      </div>
    `;
    
    document.body.appendChild(this.connectionBanner);
    
    // Анимация появления
    setTimeout(() => {
      this.connectionBanner.classList.add('show');
    }, 100);
    
    // Автоматически скрываем через 3 секунды
    setTimeout(() => {
      this.hideConnectionRestoredBanner();
    }, 3000);
  }

  hideConnectionRestoredBanner() {
    if (this.connectionBanner) {
      this.connectionBanner.classList.remove('show');
      setTimeout(() => {
        if (this.connectionBanner && this.connectionBanner.parentNode) {
          this.connectionBanner.parentNode.removeChild(this.connectionBanner);
        }
        this.connectionBanner = null;
      }, 300);
    }
  }

  pauseGameIfRunning() {
    // Проверяем, идет ли игра
    const gameCanvas = document.getElementById('game-canvas');
    if (gameCanvas && !gameCanvas.classList.contains('hidden')) {
      // Если игра активна, ставим на паузу
      if (window.gameInstance && window.gameInstance.isRunning()) {
        window.gameInstance.pause();
        this.gamePaused = true;
        console.log('🎮 Game paused due to connection loss');
      }
    }
  }

  resumeGameIfPaused() {
    if (this.gamePaused && window.gameInstance) {
      window.gameInstance.resume();
      this.gamePaused = false;
      console.log('🎮 Game resumed after connection restored');
    }
  }

  async syncDataOnOffline() {
    // Сохраняем текущий счет
    if (window.gameInstance && window.gameInstance.getScore) {
      this.lastScore = window.gameInstance.getScore();
    }
    
    // Пытаемся сохранить данные локально
    try {
      const gameData = {
        score: this.lastScore,
        timestamp: Date.now(),
        offline: true
      };
      localStorage.setItem('dinoRunner_offline_data', JSON.stringify(gameData));
    } catch (error) {
      console.warn('Failed to save offline data:', error);
    }
  }

  async syncDataOnRestore() {
    try {
      // Синхронизируем данные с сервером
      if (this.apiService) { 
        await this.apiService.getUserStats(); 
      }
      
      // Восстанавливаем игру если она была на паузе
      this.resumeGameIfPaused();
      
      // Очищаем локальные данные
      localStorage.removeItem('dinoRunner_offline_data');
      
    } catch (error) {
      console.error('Failed to sync data on restore:', error);
    }
  }

  isBackendConnected() {
    return this.isOnline;
  }

  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      lastCheck: this.lastCheck,
      gamePaused: this.gamePaused
    };
  }
}
