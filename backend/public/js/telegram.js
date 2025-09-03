/**
 * Telegram WebApp SDK Integration
 * Обеспечивает интеграцию с Telegram Mini App API
 */

export function initializeTelegram() {
  const isTelegram = !!(window.Telegram && window.Telegram.WebApp);
  const webApp = isTelegram ? window.Telegram.WebApp : null;

  if (isTelegram) {
    console.log('✅ Telegram WebApp SDK инициализирован');
    webApp.expand();
    webApp.ready();
    
    // Скрываем главную кнопку по умолчанию
    webApp.MainButton.hide();

    // Применяем тему при инициализации
    applyTheme();

    webApp.onEvent('themeChanged', applyTheme);
    webApp.onEvent('viewportChanged', handleViewportChange);
  } else {
    console.log('⚠️ Приложение запущено вне Telegram');
  }

  function applyTheme() {
    if (!isTelegram) return;
    
    const themeParams = webApp.themeParams;
    document.documentElement.style.setProperty('--tg-bg-color', themeParams.bg_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-text-color', themeParams.text_color || '#000000');
    document.documentElement.style.setProperty('--tg-hint-color', themeParams.hint_color || '#999999');
    document.documentElement.style.setProperty('--tg-link-color', themeParams.link_color || '#2481cc');
    document.documentElement.style.setProperty('--tg-button-color', themeParams.button_color || '#2481cc');
    document.documentElement.style.setProperty('--tg-button-text-color', themeParams.button_text_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-secondary-bg-color', themeParams.secondary_bg_color || '#f1f1f1');
    document.body.classList.add('telegram-webapp');
  }

  function handleViewportChange() {
    if (window.game && window.game.environment) {
      window.game.environment.updateCanvasSize();
    }
  }

  return {
    isTelegram,
    webApp,
    
    hapticImpact(style = 'medium') {
      if (!isTelegram) return;
      webApp.HapticFeedback.impactOccurred(style);
    },

    hapticNotification(type = 'success') {
      if (!isTelegram) return;
      webApp.HapticFeedback.notificationOccurred(type);
    },

    hapticSelectionChange() {
      if (!isTelegram) return;
      webApp.HapticFeedback.selectionChanged();
    },

    showToast(message) {
      if (!isTelegram) {
        alert(message);
        return;
      }
      webApp.showAlert(message);
    },

    getUserData() {
      if (!isTelegram || !webApp.initDataUnsafe?.user) {
        return {
          id: null,
          first_name: 'Гость',
          last_name: '',
          username: null,
          language_code: 'ru',
          is_premium: false
        };
      }
      return webApp.initDataUnsafe.user;
    },
    
    getInitData() {
      return isTelegram ? webApp.initData : null;
    },

    isPremium() {
      return isTelegram ? (webApp.initDataUnsafe?.user?.is_premium || false) : false;
    }
  };
}
