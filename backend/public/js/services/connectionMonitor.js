/**
 * Connection Monitor Service
 * Отслеживает состояние соединения с backend сервером
 * Автоматически переключает между онлайн и оффлайн режимами
 */

class ConnectionMonitor {
  constructor() {
    this.isOnline = false; // Начинаем с оффлайн статуса
    this.wasOffline = false; // Флаг для отслеживания потери соединения
    this.lastCheck = Date.now();
    this.checkInterval = 30000; // Проверка каждые 30 секунд
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.healthCheckUrl = '/api/health';
    this.listeners = new Set();

    console.log('🔌 ConnectionMonitor: Constructor called');
    this.init();
  }

  init() {
    console.log('🔌 ConnectionMonitor: Initializing...');
    
    // Начинаем мониторинг
    this.startMonitoring();
    
    // Слушаем события браузера
    window.addEventListener('online', () => this.handleBrowserOnline());
    window.addEventListener('offline', () => this.handleBrowserOffline());
    
    // Слушаем события видимости страницы
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && Date.now() - this.lastCheck > 10000) {
        this.checkConnection();
      }
    });
    
    // Дополнительная проверка при загрузке страницы
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.checkConnection(), 1000);
      });
    } else {
      // DOM уже загружен
      setTimeout(() => this.checkConnection(), 1000);
    }
  }

  startMonitoring() {
    console.log('🚀 Starting connection monitoring...');
    
    // Первая проверка
    this.checkConnection();
    
    // Устанавливаем интервал проверки
    setInterval(() => {
      this.checkConnection();
    }, this.checkInterval);
    
    // Дополнительная проверка при фокусе на странице
    window.addEventListener('focus', () => {
      if (Date.now() - this.lastCheck > 15000) {
        this.checkConnection();
      }
    });
  }

  async checkConnection() {
    try {
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(this.healthCheckUrl, {
        method: 'GET',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ Backend health check successful');
        this.setOnlineStatus(true);
      } else {
        console.warn('⚠️ Backend health check failed with status:', response.status);
        this.setOnlineStatus(false);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⏰ Connection check timeout');
      } else {
        console.warn('🔴 Connection check failed:', error.message);
      }
      this.setOnlineStatus(false);
    }
  }

  setOnlineStatus(online) {
    const wasOnline = this.isOnline;
    this.isOnline = online;

    if (online) {
      this.retryAttempts = 0;
      this.lastCheck = Date.now();

      if (!wasOnline) {
        console.log('🟢 Backend connection restored!');
        this.wasOffline = true; // Устанавливаем флаг для показа баннера восстановления
        this.notifyListeners('online');
        this.syncData();
      }
    } else {
      if (wasOnline) {
        console.log('🔴 Backend connection lost!');
        this.wasOffline = true; // Устанавливаем флаг потери соединения
        this.notifyListeners('offline');
      }
    }

    // Обновляем UI
    this.updateUI();
  }

  async syncData() {
    if (!this.isOnline) return;
    
    try {
      console.log('🔄 Syncing data with backend...');
      
      // Синхронизируем статистику пользователя
      if (window.apiService) {
        await window.apiService.getUserStats();
      }
      
      // Синхронизируем активные скины
      if (window.shopManager) {
        await window.shopManager.loadSkinData();
      }
      
      console.log('✅ Data sync completed');
    } catch (error) {
      console.error('❌ Data sync failed:', error);
    }
  }

  handleBrowserOnline() {
    console.log('🌐 Browser connection restored');
    // Проверяем backend соединение
    setTimeout(() => this.checkConnection(), 1000);
  }

  handleBrowserOffline() {
    console.log('🌐 Browser connection lost');
    this.setOnlineStatus(false);
  }

  updateUI() {
    // Обновляем индикатор статуса - показываем только когда оффлайн
    const statusIndicator = document.getElementById('connection-status');
    if (statusIndicator) {
      if (this.isOnline) {
        // Онлайн - скрываем индикатор
        statusIndicator.style.display = 'none';
      } else {
        // Оффлайн - показываем индикатор
        statusIndicator.style.display = 'block';
        statusIndicator.className = 'connection-status offline';
        statusIndicator.textContent = '🔴 Оффлайн';
        statusIndicator.title = 'Нет соединения с сервером';
      }
    }

    // Обновляем основной контейнер
    const mainContainer = document.querySelector('.game-container');
    if (mainContainer) {
      mainContainer.classList.toggle('offline-mode', !this.isOnline);
    }

    // Показываем/скрываем баннеры
    this.toggleOfflineBanner();
    this.toggleOnlineBanner();
  }

  toggleOfflineBanner() {
    let banner = document.getElementById('offline-banner');
    
    if (!this.isOnline && !banner) {
      // Создаем баннер
      console.log('🔴 Creating offline banner');
      banner = document.createElement('div');
      banner.id = 'offline-banner';
      banner.className = 'offline-banner';
      banner.innerHTML = `
        <div class="offline-content">
          <div class="offline-icon">🔴</div>
          <div class="offline-text">
            <h3>Оффлайн режим</h3>
            <p>Нет соединения с сервером. Некоторые функции недоступны.</p>
            <small>Игра продолжит работать, но прогресс не сохранится</small>
          </div>
        </div>
      `;
      
      // Добавляем обработчик клика для быстрого закрытия
      banner.addEventListener('click', () => {
        console.log('👆 Offline banner clicked, removing...');
        banner.remove();
      });
      
      document.body.appendChild(banner);
      
      // Автоматически убираем баннер через 3 секунды
      setTimeout(() => {
        if (banner && banner.parentNode) {
          console.log('⏰ Auto-removing offline banner after 3 seconds');
          banner.remove();
        }
      }, 3000);
      
    } else if (this.isOnline && banner) {
      // Удаляем баннер при восстановлении соединения
      console.log('🟢 Removing offline banner - connection restored');
      banner.remove();
    }
  }

  toggleOnlineBanner() {
    // Показываем баннер восстановления только при восстановлении соединения
    if (this.isOnline && this.wasOffline) {
      let banner = document.getElementById('online-banner');

      if (!banner) {
        console.log('🟢 Creating online restoration banner');
        banner = document.createElement('div');
        banner.id = 'online-banner';
        banner.className = 'online-banner';
        banner.innerHTML = `
          <div class="online-content">
            <div class="online-icon">🟢</div>
            <div class="online-text">
              <h3>Соединение восстановлено</h3>
              <p>Связь с сервером восстановлена. Все функции доступны.</p>
            </div>
          </div>
        `;

        // Добавляем обработчик клика для быстрого закрытия
        banner.addEventListener('click', () => {
          console.log('👆 Online banner clicked, removing...');
          banner.remove();
        });

        document.body.appendChild(banner);

        // Автоматически убираем баннер через 3 секунды
        setTimeout(() => {
          if (banner && banner.parentNode) {
            console.log('⏰ Auto-removing online banner after 3 seconds');
            banner.remove();
          }
        }, 3000);
      }
    }

    // Сбрасываем флаг wasOffline после показа баннера
    if (this.isOnline) {
      this.wasOffline = false;
    }
  }

  addListener(event, callback) {
    this.listeners.add({ event, callback });
  }

  removeListener(event, callback) {
    for (const listener of this.listeners) {
      if (listener.event === event && listener.callback === callback) {
        this.listeners.delete(listener);
        break;
      }
    }
  }

  notifyListeners(event) {
    for (const listener of this.listeners) {
      if (listener.event === event) {
        try {
          listener.callback();
        } catch (error) {
          console.error('Listener error:', error);
        }
      }
    }
  }

  // Публичные методы
  getStatus() {
    return {
      isOnline: this.isOnline,
      lastCheck: this.lastCheck,
      retryAttempts: this.retryAttempts
    };
  }

  forceCheck() {
    this.checkConnection();
  }

  isBackendOnline() {
    return this.isOnline;
  }
}

// Экспортируем для использования
window.ConnectionMonitor = ConnectionMonitor;
