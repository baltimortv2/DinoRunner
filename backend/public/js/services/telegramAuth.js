/**
 * Telegram WebApp Authentication Service
 * Обеспечивает безопасную аутентификацию пользователей через Telegram
 */

export class TelegramAuthService {
  constructor(apiService) {
    this.isTelegram = false;
    this.userData = null;
    this.initData = null;
    this.authToken = null;
    this.isAuthenticated = false;
    this.apiService = apiService; // Сохраняем экземпляр apiService
    
    this.init();
  }

  init() {
    console.log('🔐 TelegramAuthService: Initializing...');
    
    // Проверяем, запущена ли игра в Telegram (несколько способов)
    const hasTelegram = !!window.Telegram;
    const hasWebApp = !!(window.Telegram && window.Telegram.WebApp);
    const hasInitData = !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe);
    const hasUser = !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user);
    
    console.log('🔍 Telegram detection:', {
      hasTelegram,
      hasWebApp,
      hasInitData,
      hasUser
    });
    
    // Дополнительные проверки для Telegram
    if (hasTelegram && hasWebApp) {
      console.log('🔍 Telegram WebApp object found');
      console.log('🔍 WebApp properties:', Object.keys(window.Telegram.WebApp));
      
      // Проверяем различные способы получения данных пользователя
      if (window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        console.log('✅ User data available in initDataUnsafe.user');
        this.isTelegram = true;
        this.initData = window.Telegram.WebApp.initData;
        this.userData = this.extractUserData();
        
        console.log('📱 Telegram WebApp detected');
        console.log('👤 User data:', this.userData);
        
        // Валидируем initData
        this.validateInitData();
      } else if (window.Telegram.WebApp.initData) {
        console.log('🔍 initData available, trying to parse...');
        // Попробуем получить данные из initData
        this.isTelegram = true;
        this.initData = window.Telegram.WebApp.initData;
        
        // Попробуем извлечь данные пользователя
        this.userData = this.extractUserDataFromInitData();
        
        if (this.userData) {
          console.log('📱 Telegram WebApp detected via initData');
          console.log('👤 User data:', this.userData);
          this.validateInitData();
        } else {
          console.log('⚠️ Could not extract user data, falling back to development mode');
          this.setupDevelopmentMode();
        }
      } else {
        console.log('⚠️ No user data available, falling back to development mode');
        this.setupDevelopmentMode();
      }
    } else {
      console.log('🌐 Running outside Telegram - development mode');
      this.setupDevelopmentMode();
    }
  }

  extractUserData() {
    console.log('🔍 Extracting user data from initDataUnsafe.user...');
    console.log('🔍 isTelegram:', this.isTelegram);
    console.log('🔍 window.Telegram:', !!window.Telegram);
    console.log('🔍 window.Telegram.WebApp:', !!(window.Telegram && window.Telegram.WebApp));
    console.log('🔍 window.Telegram.WebApp.initDataUnsafe:', !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe));
    console.log('🔍 window.Telegram.WebApp.initDataUnsafe.user:', !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user));
    
    if (!this.isTelegram || !window.Telegram?.WebApp?.initDataUnsafe?.user) {
      console.log('⚠️ Cannot extract user data - missing required objects');
      return null;
    }

    const user = window.Telegram.WebApp.initDataUnsafe.user;
    console.log('🔍 Raw user object:', user);
    
    const userData = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      languageCode: user.language_code,
      isPremium: user.is_premium || false,
      photoUrl: user.photo_url || null
    };
    
    console.log('🔍 Extracted user data:', userData);
    return userData;
  }
  
  extractUserDataFromInitData() {
    console.log('🔍 Extracting user data from initData...');
    
    if (!this.initData) {
      console.log('⚠️ No initData available');
      return null;
    }
    
    try {
      // Пробуем распарсить initData как URLSearchParams
      const urlParams = new URLSearchParams(this.initData);
      const userStr = urlParams.get('user');
      
      if (userStr) {
        console.log('🔍 Found user parameter in initData:', userStr);
        const user = JSON.parse(decodeURIComponent(userStr));
        console.log('🔍 Parsed user object:', user);
        
        const userData = {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          languageCode: user.language_code,
          isPremium: user.is_premium || false,
          photoUrl: user.photo_url || null
        };
        
        console.log('🔍 Extracted user data from initData:', userData);
        return userData;
      } else {
        console.log('⚠️ No user parameter found in initData');
        return null;
      }
    } catch (error) {
      console.error('❌ Error parsing initData:', error);
      return null;
    }
  }

  async validateInitData() {
    if (!this.initData) {
      console.warn('⚠️ No initData available');
      return false;
    }

    try {
      console.log('🔍 Validating Telegram initData...');
      
      // Отправляем initData на backend для валидации через apiService
      const result = await this.apiService.authenticateTelegram({
        initData: this.initData
      });

      if (result.success) {
        this.authToken = result.token;
        this.isAuthenticated = true;
        console.log('✅ Telegram authentication successful');
        
        // Уведомляем о успешной аутентификации
        this.notifyAuthSuccess();
        return true;
      } else {
        console.error('❌ Telegram authentication failed:', result.error);
        this.isAuthenticated = false;
        return false;
      }
    } catch (error) {
      console.error('❌ Validation error:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  setupDevelopmentMode() {
    // Для разработки создаем тестового пользователя
    this.userData = {
      id: 12345,
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      languageCode: 'ru',
      isPremium: false,
      photoUrl: null
    };
    
    this.isAuthenticated = true;
    this.authToken = 'dev-token-' + Date.now();
    
    console.log('🧪 Development mode: Test user created');
    
    // Уведомляем о успешной аутентификации в development mode
    this.notifyAuthSuccess();
  }

  getUserData() {
    return this.userData;
  }

  getAuthToken() {
    return this.authToken;
  }

  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  isRunningInTelegram() {
    return this.isTelegram;
  }

  // Получение данных пользователя с backend
  async fetchUserData() {
    if (!this.isAuthenticated) {
      console.warn('⚠️ User not authenticated');
      return null;
    }

    try {
      const response = await this.apiService.getUserProfile(this.authToken);

      if (response.success) {
        const userData = response.profile;
        console.log('📊 User data fetched:', userData);
        return userData;
      } else {
        console.error('❌ Failed to fetch user data:', response.error);
        // Fallback на тестовые данные, если backend недоступен
        console.warn('⚠️ User not authenticated or backend unavailable, returning mock data');
        return { 
          success: true, 
          profile: {
            telegramId: 12345,
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            stats: {
              totalScore: 0,
              totalCoins: 100,
              gamesPlayed: 0,
              bestScore: 0,
              currentEra: 1
            }
          } 
        };
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      return null;
    }
  }

  // Обновление профиля пользователя
  async updateUserProfile(profileData) {
    if (!this.isAuthenticated) {
      console.warn('⚠️ User not authenticated');
      return false;
    }

    try {
      const response = await this.apiService.updateUserProfile(this.authToken, profileData);

      if (response.success) {
        console.log('✅ User profile updated');
        return true;
      } else {
        console.error('❌ Failed to update profile:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      return false;
    }
  }

  // Уведомление об успешной аутентификации
  notifyAuthSuccess() {
    // Создаем событие для других сервисов
    const event = new CustomEvent('telegram-auth-success', {
      detail: {
        userData: this.userData,
        token: this.authToken
      }
    });
    window.dispatchEvent(event);
  }

  // Выход из аккаунта
  logout() {
    this.authToken = null;
    this.isAuthenticated = false;
    this.userData = null;
    
    console.log('🚪 User logged out');
    
    // Уведомляем о выходе
    const event = new CustomEvent('telegram-auth-logout');
    window.dispatchEvent(event);
  }
}
