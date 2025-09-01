/**
 * ИНСТРУМЕНТЫ РАЗРАБОТЧИКА
 *
 * ВНИМАНИЕ: Этот файл предназначен ТОЛЬКО для разработки!
 * Полностью удалить перед релизом игры.
 *
 * Для удаления инструментов разработчика:
 * 1. Удалить этот файл
 * 2. Удалить подключение в index.html: <script src="./js/devTools.js"></script>
 * 3. Удалить все упоминания window.DEV_TOOLS из основного кода
 */

(function() {
  'use strict';

  // Инициализация инструментов разработчика
  window.DEV_TOOLS = {
    // Состояние инициализации
    initialized: false,

    // Модификаторы игры
    scoreMultiplier: 1,
    startingCoins: 500,
    startingEra: 1,
    godMode: false,
    infiniteCoins: false,

    // Управление игрой
    game: null,
    skinShop: null,

    init: function(game, skinShop) {
      this.game = game;
      this.skinShop = skinShop;
      this.setupEventListeners();
      this.initialized = true;
      console.log('🎮 Инструменты разработчика инициализированы');
      console.log('💡 Используйте window.DEV_TOOLS для управления игрой');
    },

    setupEventListeners: function() {
      const self = this;

      // Модификаторы
      document.getElementById('dev-score-mult').addEventListener('input', function() {
        self.scoreMultiplier = parseFloat(this.value) || 1;
        console.log('🎯 Множитель очков установлен:', self.scoreMultiplier);
      });

      document.getElementById('dev-coins').addEventListener('input', function() {
        self.startingCoins = parseInt(this.value) || 500;
        console.log('💰 Стартовые монеты установлены:', self.startingCoins);
      });

      document.getElementById('dev-era').addEventListener('input', function() {
        self.startingEra = parseInt(this.value) || 1;
        console.log('⭐ Стартовый этап установлен:', self.startingEra);
      });

      document.getElementById('dev-godmode').addEventListener('change', function() {
        self.godMode = this.checked;
        console.log('🛡️ God Mode:', self.godMode ? 'ВКЛ' : 'ВЫКЛ');
      });

      document.getElementById('dev-infinite-coins').addEventListener('change', function() {
        self.infiniteCoins = this.checked;
        console.log('💎 Бесконечные монеты:', self.infiniteCoins ? 'ВКЛ' : 'ВЫКЛ');
      });

      // Управление игрой
      document.getElementById('dev-reset-score').addEventListener('click', function() {
        if (self.game) {
          self.game.score = 0;
          self.game._scoreAccum = 0;
          document.getElementById('score').textContent = '0';
          console.log('🔄 Очки сброшены');
        }
      });

      document.getElementById('dev-reset-coins').addEventListener('click', function() {
        if (self.game) {
          self.game.coins = 0;
          document.getElementById('coins').textContent = '0';
          if (self.skinShop) {
            document.getElementById('shop-coins').textContent = '0';
          }
          try {
            const u = JSON.parse(localStorage.getItem('econ-user')||'{}');
            u.coins = 0; localStorage.setItem('econ-user', JSON.stringify(u));
          } catch {}
          console.log('🔄 Монеты сброшены');
        }
      });

      document.getElementById('dev-set-coins-1000').addEventListener('click', function() {
        if (self.game) {
          self.game.coins = 1000;
          document.getElementById('coins').textContent = '1000';
          if (self.skinShop) {
            document.getElementById('shop-coins').textContent = '1000';
          }
          try { const u = JSON.parse(localStorage.getItem('econ-user')||'{}'); u.coins = 1000; localStorage.setItem('econ-user', JSON.stringify(u)); } catch {}
          console.log('💰 Монеты установлены: 1000');
        }
      });

      document.getElementById('dev-set-coins-10000').addEventListener('click', function() {
        if (self.game) {
          self.game.coins = 10000;
          document.getElementById('coins').textContent = '10000';
          if (self.skinShop) {
            document.getElementById('shop-coins').textContent = '10000';
          }
          try { const u = JSON.parse(localStorage.getItem('econ-user')||'{}'); u.coins = 10000; localStorage.setItem('econ-user', JSON.stringify(u)); } catch {}
          console.log('💰 Монеты установлены: 10000');
        }
      });

      document.getElementById('dev-set-era-5').addEventListener('click', function() {
        if (self.game) {
          self.game.era = 5;
          document.getElementById('era').textContent = '5';
          try { const u = JSON.parse(localStorage.getItem('econ-user')||'{}'); u.era = 5; localStorage.setItem('econ-user', JSON.stringify(u)); } catch {}
          console.log('⭐ Этап установлен: 5');
        }
      });

      document.getElementById('dev-set-era-10').addEventListener('click', function() {
        if (self.game) {
          self.game.era = 10;
          document.getElementById('era').textContent = '10';
          try { const u = JSON.parse(localStorage.getItem('econ-user')||'{}'); u.era = 10; localStorage.setItem('econ-user', JSON.stringify(u)); } catch {}
          console.log('⭐ Этап установлен: 10');
        }
      });

      document.getElementById('dev-max-progress').addEventListener('click', function() {
        if (self.game) {
          self.game.score = 25000;
          self.game._scoreAccum = 25000;
          self.game.coins = 50000;
          self.game.era = 10;
          document.getElementById('score').textContent = '25000';
          document.getElementById('coins').textContent = '50000';
          document.getElementById('era').textContent = '10';
          if (self.skinShop) {
            document.getElementById('shop-coins').textContent = '50000';
          }
          console.log('🏆 Максимальный прогресс установлен');
        }
      });

      // Диагностика
      document.getElementById('dev-log-state').addEventListener('click', function() {
        if (self.game) {
          console.log('🎮 Состояние игры:', {
            score: self.game.score,
            coins: self.game.coins,
            era: self.game.era,
            gameSpeed: self.game.gameSpeed,
            running: self.game.running,
            paused: self.game.paused,
            gameOver: self.game.gameOver
          });
        }
      });

      document.getElementById('dev-test-assets').addEventListener('click', function() {
        if (self.game && self.game.assetPack) {
          console.log('🎨 Состояние ассетов:', {
            loaded: self.game.assetPack.isLoaded(),
            assets: Object.keys(self.game.assetPack.assets || {})
          });
        }
      });

      document.getElementById('dev-clear-storage').addEventListener('click', function() {
        localStorage.clear();
        console.log('🗑️ localStorage очищен');
        if (confirm('localStorage очищен. Перезагрузить страницу?')) {
          location.reload();
        }
      });
    }
  };

  // Dev tools будут инициализированы через кнопку в меню
  console.log('🔧 Dev Tools загружены. Для активации нажмите "Dev Tools" в меню игры.');

})();
