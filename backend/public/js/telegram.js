/**
 * Telegram WebApp SDK Integration
 * Обеспечивает интеграцию с Telegram Mini App API
 */

class TelegramWebApp {
    constructor() {
        this.isTelegram = false;
        this.webApp = null;
        this.init();
    }

    init() {
        // Проверяем, запущено ли приложение в Telegram
        if (window.Telegram && window.Telegram.WebApp) {
            this.webApp = window.Telegram.WebApp;
            this.isTelegram = true;
            this.setupTelegram();
            console.log('✅ Telegram WebApp SDK инициализирован');
        } else {
            console.log('⚠️ Приложение запущено вне Telegram');
        }
    }

    setupTelegram() {
        if (!this.isTelegram) return;

        // Настройка темы
        this.applyTheme();
        
        // Настройка viewport
        this.webApp.expand();
        this.webApp.ready();

        // Настройка MainButton
        this.setupMainButton();

        // Настройка BackButton
        this.setupBackButton();

        // Настройка Haptic feedback
        this.setupHaptic();

        // Слушаем изменения темы
        this.webApp.onEvent('themeChanged', () => {
            this.applyTheme();
        });

        // Слушаем изменения viewport
        this.webApp.onEvent('viewportChanged', () => {
            this.handleViewportChange();
        });
    }

    applyTheme() {
        if (!this.isTelegram) return;

        const theme = this.webApp.colorScheme; // 'light' или 'dark'
        const themeParams = this.webApp.themeParams;
        
        // Применяем цвета Telegram
        document.documentElement.style.setProperty('--tg-bg-color', themeParams.bg_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-text-color', themeParams.text_color || '#000000');
        document.documentElement.style.setProperty('--tg-hint-color', themeParams.hint_color || '#999999');
        document.documentElement.style.setProperty('--tg-link-color', themeParams.link_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-button-color', themeParams.button_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-button-text-color', themeParams.button_text_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-secondary-bg-color', themeParams.secondary_bg_color || '#f1f1f1');

        // Добавляем класс к body для Telegram WebApp
        document.body.classList.add('telegram-webapp');

        // Обновляем тему игры
        this.updateGameTheme(theme);
    }

    updateGameTheme(theme) {
        // Переключаем тему игры в зависимости от темы Telegram
        const gameTheme = theme === 'dark' ? 'dark' : 'light';
        
        // Обновляем тему в игре
        if (window.game && window.game.setTheme) {
            window.game.setTheme(gameTheme);
        }

        // Обновляем UI элементы
        this.updateUITheme(theme);
    }

    updateUITheme(theme) {
        const isDark = theme === 'dark';
        
        // Обновляем стили модальных окон
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (isDark) {
                modal.classList.add('theme-dark');
                modal.classList.remove('theme-light');
            } else {
                modal.classList.add('theme-light');
                modal.classList.remove('theme-dark');
            }
        });

        // Обновляем кнопки
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            if (isDark) {
                btn.classList.add('theme-dark');
                btn.classList.remove('theme-light');
            } else {
                btn.classList.add('theme-light');
                btn.classList.remove('theme-dark');
            }
        });
    }

    setupMainButton() {
        if (!this.isTelegram) return;

        // Настройка главной кнопки
        this.webApp.MainButton.setText('🎮 Играть');
        this.webApp.MainButton.show();
        
        this.webApp.MainButton.onClick(() => {
            this.handleMainButtonClick();
        });
    }

    setupBackButton() {
        if (!this.isTelegram) return;

        // Показываем BackButton когда нужно
        this.webApp.BackButton.onClick(() => {
            this.handleBackButtonClick();
        });
    }

    setupHaptic() {
        if (!this.isTelegram) return;

        // Настройка haptic feedback
        this.webApp.HapticFeedback.impactOccurred('medium');
    }

    handleMainButtonClick() {
        // Обработка клика по главной кнопке
        if (window.game && window.game.isPaused) {
            window.game.resume();
        } else if (window.game && !window.game.isRunning) {
            window.game.start();
        }
    }

    handleBackButtonClick() {
        // Обработка клика по кнопке назад
        if (window.game && window.game.isRunning) {
            window.game.pause();
        } else {
            // Возврат в главное меню
            this.showMainMenu();
        }
    }

    handleViewportChange() {
        // Обработка изменений viewport
        if (window.game && window.game.environment) {
            window.game.environment.updateCanvasSize();
        }
    }

    showMainMenu() {
        // Показать главное меню
        const mainMenu = document.getElementById('main-menu');
        const app = document.getElementById('app');
        
        if (mainMenu && app) {
            mainMenu.style.display = 'block';
            app.classList.add('overlay-open');
            this.hideMainButton();
            this.showBackButton();
        }
    }

    hideMainMenu() {
        // Скрыть главное меню
        const mainMenu = document.getElementById('main-menu');
        const app = document.getElementById('app');
        
        if (mainMenu && app) {
            mainMenu.style.display = 'none';
            app.classList.remove('overlay-open');
            this.showMainButton();
            this.hideBackButton();
        }
    }

    showMainButton() {
        if (!this.isTelegram) return;
        this.webApp.MainButton.show();
    }

    hideMainButton() {
        if (!this.isTelegram) return;
        this.webApp.MainButton.hide();
    }

    showBackButton() {
        if (!this.isTelegram) return;
        this.webApp.BackButton.show();
    }

    hideBackButton() {
        if (!this.isTelegram) return;
        this.webApp.BackButton.hide();
    }

    // Haptic feedback методы
    hapticImpact(style = 'medium') {
        if (!this.isTelegram) return;
        this.webApp.HapticFeedback.impactOccurred(style);
    }

    hapticNotification(type = 'success') {
        if (!this.isTelegram) return;
        this.webApp.HapticFeedback.notificationOccurred(type);
    }

    hapticSelectionChange() {
        if (!this.isTelegram) return;
        this.webApp.HapticFeedback.selectionChanged();
    }

    // ShareMessage для реферальных ссылок
    shareReferralLink(referralCode) {
        if (!this.isTelegram) {
            // Fallback для браузера
            this.copyToClipboard(referralCode);
            return;
        }

        const shareText = `🎮 Играй в Dino Runner и зарабатывай монеты!\n\nИспользуй мою реферальную ссылку:\n${referralCode}\n\nПолучи 10% бонус от моих обменов!`;
        
        this.webApp.showPopup({
            title: 'Поделиться',
            message: shareText,
            buttons: [
                {
                    type: 'default',
                    text: 'Поделиться',
                    id: 'share'
                },
                {
                    type: 'cancel',
                    text: 'Отмена'
                }
            ]
        }, (buttonId) => {
            if (buttonId === 'share') {
                this.webApp.switchInlineQuery(shareText, ['users', 'groups', 'channels']);
            }
        });
    }

    // Копирование в буфер обмена (fallback)
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Ссылка скопирована!');
        } catch (err) {
            console.error('Ошибка копирования:', err);
        }
    }

    // Показать toast уведомление
    showToast(message, duration = 3000) {
        if (!this.isTelegram) {
            // Fallback для браузера
            alert(message);
            return;
        }

        this.webApp.showAlert(message);
    }

    // Получить данные пользователя
    getUserData() {
        if (!this.isTelegram) {
            return {
                id: null,
                first_name: 'Гость',
                last_name: '',
                username: null,
                language_code: 'ru',
                is_premium: false
            };
        }

        return {
            id: this.webApp.initDataUnsafe?.user?.id,
            first_name: this.webApp.initDataUnsafe?.user?.first_name,
            last_name: this.webApp.initDataUnsafe?.user?.last_name,
            username: this.webApp.initDataUnsafe?.user?.username,
            language_code: this.webApp.initDataUnsafe?.user?.language_code,
            is_premium: this.webApp.initDataUnsafe?.user?.is_premium
        };
    }

    // Получить initData для валидации на сервере
    getInitData() {
        if (!this.isTelegram) return null;
        return this.webApp.initData;
    }

    // Проверить, является ли пользователь премиум
    isPremium() {
        if (!this.isTelegram) return false;
        return this.webApp.initDataUnsafe?.user?.is_premium || false;
    }

    // Получить язык пользователя
    getLanguage() {
        if (!this.isTelegram) return 'ru';
        return this.webApp.initDataUnsafe?.user?.language_code || 'ru';
    }

    // Показать popup с подтверждением
    showConfirm(title, message, onConfirm, onCancel) {
        if (!this.isTelegram) {
            const result = confirm(message);
            if (result && onConfirm) onConfirm();
            if (!result && onCancel) onCancel();
            return;
        }

        this.webApp.showPopup({
            title: title,
            message: message,
            buttons: [
                {
                    type: 'default',
                    text: 'Да',
                    id: 'confirm'
                },
                {
                    type: 'cancel',
                    text: 'Нет'
                }
            ]
        }, (buttonId) => {
            if (buttonId === 'confirm' && onConfirm) {
                onConfirm();
            } else if (onCancel) {
                onCancel();
            }
        });
    }

    // Показать popup с вводом
    showInput(title, message, placeholder, onConfirm, onCancel) {
        if (!this.isTelegram) {
            const result = prompt(message, placeholder);
            if (result !== null && onConfirm) onConfirm(result);
            if (result === null && onCancel) onCancel();
            return;
        }

        this.webApp.showPopup({
            title: title,
            message: message,
            buttons: [
                {
                    type: 'default',
                    text: 'Ок',
                    id: 'confirm'
                },
                {
                    type: 'cancel',
                    text: 'Отмена'
                }
            ]
        }, (buttonId) => {
            if (buttonId === 'confirm' && onConfirm) {
                onConfirm(placeholder);
            } else if (onCancel) {
                onCancel();
            }
        });
    }
}

// Создаем глобальный экземпляр
window.telegramApp = new TelegramWebApp();
