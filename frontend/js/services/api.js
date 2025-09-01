/**
 * API Service for Backend Communication
 * Handles authentication, game sessions, economy, and WebSocket connections
 */

class ApiService {
  constructor() {
    const loc = window.location;
    const defaultHttp = `${loc.protocol}//${loc.hostname}:3001`;
    this.baseUrl = (window.BACKEND_URL || defaultHttp).replace(/\/$/, '');

    const wsProtocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultWs = `${wsProtocol}//${loc.hostname}:3001`;
    this.wsUrl = (window.BACKEND_WS_URL || defaultWs).replace(/\/$/, '');

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
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
      this.userId = localStorage.getItem('user_id');
    }

    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'X-User-ID': this.userId
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  // Game sessions
  async startGameSession() {
    const response = await this.makeRequest('/api/game/session-start', {
      method: 'POST'
    });
    if (response.success) {
      this.emit('game:session-started', response);
      return response.sessionId;
    }
    return null;
  }

  async endGameSession(sessionId, score, duration) {
    const response = await this.makeRequest('/api/game/session-end', {
      method: 'POST',
      body: { sessionId, score, duration }
    });
    if (response.success) {
      this.emit('game:session-ended', response);
    }
    return response;
  }

  async sendHeartbeat(sessionId) {
    const response = await this.makeRequest('/api/game/heartbeat', {
      method: 'POST',
      body: { sessionId }
    });
    if (response.success) {
      this.emit('game:heartbeat-ack', response);
    }
    return response;
  }

  async getUserStats() {
    const response = await this.makeRequest('/api/game/user-stats');
    return response.stats;
  }

  // Economy
  async getExchangeRates() {
    return await this.makeRequest('/api/economy/exchange-rates');
  }

  async exchangePoints(coinsWanted) {
    const response = await this.makeRequest('/api/economy/exchange-points', {
      method: 'POST',
      body: { coinsWanted }
    });
    if (response.success) this.emit('economy:updated', response);
    return response;
  }

  async withdrawCoins(amount, tonAddress) {
    const response = await this.makeRequest('/api/economy/withdraw', {
      method: 'POST',
      body: { amount, tonAddress }
    });
    if (response.success) this.emit('economy:updated', response);
    return response;
  }

  // WebSocket connection
  connectWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (!this.isAuthenticated()) {
      console.warn('WebSocket connection requires authentication.');
      return;
    }

    try {
      const url = `${this.wsUrl}?userId=${encodeURIComponent(this.userId || '')}`;
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
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
        ...(this.userId ? { 'X-User-ID': this.userId } : {}),
        ...options.headers
      }
    };
    if (options.body) config.body = JSON.stringify(options.body);

    const response = await fetch(url, config);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  // Cleanup
  logout() {
    this.token = null;
    this.userId = null;
    this.disconnectWebSocket();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
  }

  isAuthenticated() {
    return !!(this.token && this.userId);
  }
}

// Create global instance
window.apiService = new ApiService();

// Auto-connect WebSocket when service is created
(async () => {
  const ok = await window.apiService.verifyToken();
  if (ok) {
    window.apiService.connectWebSocket();
  }
})();
