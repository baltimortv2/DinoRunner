/**
 * API Service for Backend Communication
 * Handles authentication, game sessions, economy, and WebSocket connections
 */

class ApiService {
  constructor() {
    const loc = window.location;
    // Используем тот же origin, чтобы не упираться в CSP
    const sameOrigin = `${loc.protocol}//${loc.host}`;
    this.baseUrl = (window.BACKEND_URL || sameOrigin).replace(/\/$/, '');

    const wsProtocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    const sameWs = `${wsProtocol}//${loc.host}`;
    this.wsUrl = (window.BACKEND_WS_URL || sameWs).replace(/\/$/, '');

    this.token = null;
    this.userId = null;
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    // Event listeners
    this.listeners = {
      'auth:success': [],
      'auth:error': [],
      'game:session-started': [],
      'game:session-ended': [],
      'game:heartbeat-ack': [],
      'game:era-changed': [],
      'economy:updated': [],
      'connection:connected': [],
      'connection:disconnected': [],
      'connection:error': []
    };
  }

  async healthCheck(signal) {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        cache: 'no-cache',
        signal,
      });
      return response.ok;
    } catch (error) {
      console.warn('Health check request failed:', error.name);
      return false;
    }
  }

  async authenticateTelegram(authData) {
    return this.makeRequest('/api/auth/telegram/validate', {
      method: 'POST',
      body: authData,
    });
  }

  async getUserProfile(token) {
    return this.makeRequest('/api/user/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async updateUserProfile(token, profileData) {
    return this.makeRequest('/api/user/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: profileData,
    });
  }

  /**
   * Создание запроса на вывод монет
   */
  async createWithdrawal(amount, tonAddress) {
    return this.makeRequest('/api/withdrawals/request', {
      method: 'POST',
      body: { amount, tonAddress }
    });
  }

  /**
   * Получение истории выводов пользователя
   */
  async getWithdrawalHistory() {
    return this.makeRequest('/api/withdrawals/history');
  }

  /**
   * Получение статистики выводов (для админов)
   */
  async getWithdrawalStats() {
    return this.makeRequest('/api/withdrawals/stats');
  }

  /**
   * Обработка вывода (для админов)
   */
  async processWithdrawal(withdrawalId, action, txHash = null) {
    return this.makeRequest('/api/withdrawals/process', {
      method: 'POST',
      body: { withdrawalId, action, txHash }
    });
  }

  // Event system
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    if (!callback) { this.listeners[event] = []; return; }
    const index = this.listeners[event].indexOf(callback);
    if (index > -1) {
      this.listeners[event].splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // Authentication
  async authenticate(initData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Authentication failed');
      }

      const data = await response.json();
      this.token = data.token;
      this.userId = data.user.id;
      
      // Store auth data
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('user_id', this.userId);
      
      this.emit('auth:success', data);
      return data;
    } catch (error) {
      console.error('Authentication error:', error);
      this.emit('auth:error', error);
      throw error;
    }
  }

  async verifyToken() {
    try {
      // Для разработки - всегда возвращаем true
      // В продакшене здесь должна быть проверка JWT токена
      console.log('🔐 Development mode: skipping token verification');
      
      // Создаем тестового пользователя
      this.userId = 12345; // Тестовый ID
      this.token = 'dev-token-' + Date.now();
      
      // Эмулируем успешную аутентификацию
      this.emit('auth:success', {
        user: {
          id: this.userId,
          telegramId: this.userId,
          username: 'test_user',
          firstName: 'Test',
          lastName: 'User',
          points: 0,
          coins: 100,
          era: 1,
          gamesPlayed: 0,
          bestScore: 0
        },
        token: this.token
      });
      
      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  // Game sessions
  async startGameSession() {
    try {
      const response = await this.makeRequest('/api/game/session-start', {
        method: 'POST'
      });
      if (response.success) {
        this.emit('game:session-started', response);
        return response.sessionId;
      }
      return null;
    } catch (error) {
      console.warn('Failed to start game session, using mock session:', error);
      // Создаем тестовую сессию для разработки
      const mockSessionId = 'dev-session-' + Date.now();
      this.emit('game:session-started', { sessionId: mockSessionId });
      return mockSessionId;
    }
  }

  async endGameSession(sessionId, score, duration) {
    try {
      const response = await this.makeRequest('/api/game/session-end', {
        method: 'POST',
        body: { sessionId, score, duration }
      });
      if (response.success) {
        this.emit('game:session-ended', response);
      }
      return response;
    } catch (error) {
      console.warn('Failed to end game session:', error);
      // Эмулируем успешное завершение для разработки
      return { success: true, message: 'Session ended (dev mode)' };
    }
  }

  async sendHeartbeat(sessionId) {
    try {
      const response = await this.makeRequest('/api/game/heartbeat', {
        method: 'POST',
        body: { sessionId }
      });
      if (response.success) {
        this.emit('game:heartbeat-ack', response);
      }
      return response;
    } catch (error) {
      console.warn('Failed to send heartbeat, using mock response:', error);
      // Эмулируем успешный heartbeat для разработки
      return { success: true, message: 'Heartbeat sent (dev mode)' };
    }
  }

  async getUserStats() {
    try {
      const response = await this.makeRequest('/api/game/user-stats');
      return response.stats || response;
    } catch (error) {
      console.warn('Failed to get user stats from backend, using default:', error);
      // Возвращаем тестовые данные для разработки
      return {
        totalPoints: 0,
        totalCoins: 100,
        currentEra: 1,
        gamesPlayed: 0,
        bestScore: 0
      };
    }
  }

  // Economy
  async getExchangeRates() {
    try {
      return await this.makeRequest('/api/economy/exchange-rates');
    } catch (error) {
      console.warn('Failed to get exchange rates, using mock data:', error);
      // Возвращаем тестовые курсы для разработки
      return {
        success: true,
        rates: {
          pointsToCoins: 1000,
          coinsToPoints: 1
        }
      };
    }
  }

  async exchangePoints(coinsWanted) {
    try {
      const response = await this.makeRequest('/api/economy/exchange-points', {
        method: 'POST',
        body: { coinsWanted }
      });
      if (response.success) this.emit('economy:updated', response);
      return response;
    } catch (error) {
      console.warn('Failed to exchange points, using mock response:', error);
      // Эмулируем успешный обмен для разработки
      const mockResponse = {
        success: true,
        newStats: {
          totalPoints: 0,
          totalCoins: 100 + coinsWanted
        }
      };
      this.emit('economy:updated', mockResponse);
      return mockResponse;
    }
  }

  async withdrawCoins(amount, tonAddress) {
    try {
      const response = await this.makeRequest('/api/economy/withdraw', {
        method: 'POST',
        body: { amount, tonAddress }
      });
      if (response.success) this.emit('economy:updated', response);
      return response;
    } catch (error) {
      console.warn('Failed to withdraw coins, using mock response:', error);
      // Эмулируем успешный вывод для разработки
      const mockResponse = {
        success: true,
        newStats: {
          totalCoins: 100 - amount
        }
      };
      this.emit('economy:updated', mockResponse);
      return mockResponse;
    }
  }

  // WebSocket connection
  connectWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    
    // Для разработки - всегда разрешаем WebSocket соединение
    console.log('🔌 Development mode: WebSocket connection enabled');

    try {
      // Для разработки - используем тестовый userId
      const userId = this.userId || '12345';
      const url = `${this.wsUrl}?userId=${encodeURIComponent(userId)}`;
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connection:connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.emit('connection:disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('connection:error', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.emit('connection:error', error);
    }
  }

  disconnectWebSocket() {
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    this.isConnected = false;
  }

  sendWebSocketMessage(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket not connected, message not sent:', { type, payload });
    }
  }

  handleWebSocketMessage(data) {
    const { type, payload } = data;
    switch (type) {
      case 'game:session-started':
        this.emit('game:session-started', payload);
        break;
      case 'game:session-validated':
        this.emit('game:session-ended', payload);
        break;
      case 'game:heartbeat-ack':
        this.emit('game:heartbeat-ack', payload);
        break;
      case 'game:era-changed':
        this.emit('game:era-changed', payload);
        break;
      case 'economy:updated':
        this.emit('economy:updated', payload);
        break;
      default:
        console.log('Unknown WebSocket message type:', type);
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connectWebSocket();
    }, delay);
  }

  // Utility methods
  async makeRequest(endpoint, options = {}) {
    // Проверяем статус соединения
    if (window.connectionMonitor && !window.connectionMonitor.isBackendOnline()) {
      throw new Error('Backend offline');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    // Добавляем токен аутентификации, если он есть
    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (options.body) config.body = JSON.stringify(options.body);

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Request to ${endpoint} failed:`, error);
      throw error;
    }
  }

  // Cleanup
  logout() {
    this.token = null;
    this.userId = null;
    this.disconnectWebSocket();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
  }

  /**
   * Установка токена аутентификации
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  /**
   * Установка ID пользователя
   */
  setUserId(userId) {
    this.userId = userId;
    localStorage.setItem('user_id', userId);
  }

  /**
   * Загрузка токена из localStorage
   */
  loadStoredAuth() {
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');
    
    if (token) this.token = token;
    if (userId) this.userId = userId;
    
    return { token, userId };
  }

  isAuthenticated() {
    // Проверяем наличие токена
    return !!this.token;
  }

  /**
   * Получение токена аутентификации
   */
  getToken() {
    return this.token;
  }

  /**
   * Получение ID пользователя
   */
  getUserId() {
    return this.userId;
  }

  // Методы для работы с ConnectionMonitor
  setupConnectionListeners() {
    if (window.connectionMonitor) {
      window.connectionMonitor.addListener('online', () => {
        console.log('🟢 API Service: Backend connection restored');
        this.isOnline = true;
      });
      
      window.connectionMonitor.addListener('offline', () => {
        console.log('🔴 API Service: Backend connection lost');
        this.isOnline = false;
      });
    }
  }

  /**
   * Подключение к WebSocket
   */
  connectWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.onopen = () => {
        console.log('🟢 WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connection:connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔴 WebSocket disconnected');
        this.isConnected = false;
        this.emit('connection:disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('connection:error', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }

  /**
   * Отключение от WebSocket
   */
  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  /**
   * Попытка переподключения к WebSocket
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  }

  /**
   * Обработка сообщений WebSocket
   */
  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'auth:success':
        this.emit('auth:success', data);
        break;
      case 'game:session-started':
        this.emit('game:session-started', data);
        break;
      case 'game:session-ended':
        this.emit('game:session-ended', data);
        break;
      case 'game:heartbeat-ack':
        this.emit('game:heartbeat-ack', data);
        break;
      case 'game:era-changed':
        this.emit('game:era-changed', data);
        break;
      case 'economy:updated':
        this.emit('economy:updated', data);
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }

  // Проверка соединения с таймаутом
  async checkConnectionWithTimeout(timeout = 3000) {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(false);
      }, timeout);

      this.checkConnection()
        .then(() => {
          clearTimeout(timeoutId);
          resolve(true);
        })
        .catch(() => {
          clearTimeout(timeoutId);
          resolve(false);
        });
    });
  }

  /**
   * Отправка сообщения через WebSocket
   */
  sendWebSocketMessage(type, data = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = { type, ...data };
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  /**
   * Получение статуса WebSocket соединения
   */
  getWebSocketStatus() {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }

  // Проверка статуса backend соединения
  isBackendOnline() {
    // Проверяем через ConnectionMonitor, если он доступен
    if (window.connectionMonitor) {
      return window.connectionMonitor.isBackendOnline();
    }
    // Fallback к внутреннему статусу
    return this.isOnline;
  }

  /**
   * Проверка соединения с backend
   */
  async checkConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      console.warn('Backend connection check failed:', error);
      return false;
    }
  }

  /**
   * Проверка токена аутентификации
   */
  async verifyToken() {
    if (!this.token) return false;
    
    try {
      const response = await this.makeRequest('/api/auth/verify');
      return response.success;
    } catch (error) {
      console.warn('Token verification failed:', error);
      return false;
    }
  }
}

// Create and export a single instance
export const apiService = new ApiService();

  // Auto-connect WebSocket when service is created
  (async () => {
    // Загружаем сохраненную аутентификацию
    apiService.loadStoredAuth();
    
    const ok = await apiService.verifyToken();
    if (ok) {
      apiService.connectWebSocket();
    }
    
    // Настраиваем слушатели соединения после инициализации
    if (window.connectionMonitor) {
      apiService.setupConnectionListeners();
    }
  })();
