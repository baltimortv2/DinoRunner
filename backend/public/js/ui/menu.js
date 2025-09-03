// Все экономические функции теперь через backend API
// import { getCurrentRate, getUser, exchangeCoins, setUserCoins } from '../utils/economy.js';

export function initMenu(game, skinShop) {
  const menu = document.getElementById('menu');
  const btnMenu = document.getElementById('btn-menu');
  const btnPause = document.getElementById('btn-pause');
  const btnClose = document.getElementById('btn-close-menu');
  const btnSound = document.getElementById('btn-sound');
  const btnExchange = document.getElementById('btn-exchange');
  const btnReferrals = document.getElementById('btn-referrals');
  const btnSkins = document.getElementById('btn-skins');
  const btnShopBottom = document.getElementById('btn-shop-bottom');
  const btnWithdraw = document.getElementById('btn-withdraw');
  const modalOverlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal');
  const btnTheme = document.getElementById('btn-theme');
  const btnDevTools = document.getElementById('btn-dev-tools');
  const btnLeaderboard = document.getElementById('btn-leaderboard');
  const lbPanel = document.getElementById('leaderboard-panel');
  const lbBody = document.getElementById('leaderboard-body');
  const btnMenuBottom = document.getElementById('btn-menu-bottom');
  const btnMainMenuBottom = document.getElementById('btn-mainmenu-bottom');

  function openMenu() {
    if (game.running && !game.paused) {
      game.pause();
      game._wasPausedByMenu = true; // Флаг что пауза была активирована меню
    }
    window.uiManager.switchScene(window.uiManager.SCENES.MENU);
  }
  
  function closeMenu() {
    window.uiManager.goBack();
    if (game._wasPausedByMenu && game.paused && game.running) {
      game._wasPausedByMenu = false;
      game.resumeWithCountdown();
    }
  }

  if (btnMenu) {
    btnMenu.addEventListener('click', openMenu);
    btnMenu.addEventListener('touchend', (e) => { e.preventDefault(); openMenu(); }, { passive: false });
  }
  const btnCloseMenu = document.getElementById('btn-close-menu');
  if (btnCloseMenu) {
    btnCloseMenu.addEventListener('click', closeMenu);
    btnCloseMenu.addEventListener('touchend', (e) => { e.preventDefault(); closeMenu(); }, { passive: false });
  }

  function updatePauseButton() {
    if (!btnPause) return;
    const icon = btnPause.querySelector('.btn-icon');
    const text = btnPause.querySelector('span:last-child');
    if (icon && text) {
      icon.textContent = game.paused ? '▶️' : '⏸️';
      text.textContent = game.paused ? 'Продолжить' : 'Пауза';
    }
    btnPause.setAttribute('aria-pressed', game.paused ? 'true' : 'false');
  }

  if (btnPause) {
    btnPause.addEventListener('click', () => {
      if (game.paused) {
        game._wasPausedByMenu = false;
        closeMenu();
        game.resumeWithCountdown();
      } else {
        game._wasPausedByMenu = false;
        game.pause();
      }
      updatePauseButton();
    });
    btnPause.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (game.paused) {
        game._wasPausedByMenu = false;
        closeMenu();
        game.resumeWithCountdown();
      } else {
        game._wasPausedByMenu = false;
        game.pause();
      }
      updatePauseButton();
    }, { passive: false });
  }

  game.soundEnabled = true;
  if (btnSound?.querySelector('.menu-text')) {
    btnSound.querySelector('.menu-text').textContent = `Звук: ${game.soundEnabled ? 'вкл' : 'выкл'}`;
  }
  updatePauseButton();
  
  btnSound?.addEventListener('click', () => {
    game.soundEnabled = !game.soundEnabled;
    const t = btnSound.querySelector('.menu-text');
    if (t) t.textContent = `Звук: ${game.soundEnabled ? 'вкл' : 'выкл'}`;
    if (game.soundEnabled) {
      game.initAudio();
      if (game.audioContext && game.audioContext.state === 'suspended') {
        game.audioContext.resume();
      }
    }
  });

  function openModal(title, contentHtml, onOpen) {
    if (!modal || !modalOverlay) return;
    modal.innerHTML = `<div class="modal-header"><h3 id="modal-title">${title}</h3></div><div class="window-header"><h4 class="window-subtitle">Общее окно</h4></div><div id="modal-content" style="padding:20px;">${contentHtml}</div><div style="padding: 16px; border-top: 1px solid rgba(42,58,74,0.3); display: flex; justify-content: flex-end;"><button id="btn-close" class="btn btn-secondary">Закрыть</button></div>`;
    modalOverlay.classList.remove('hidden');
    if (game.running && !game.paused) { game.pause(); game._wasPausedByMenu = true; updatePauseButton(); }
    const close = () => {
      modalOverlay.classList.add('hidden');
      if (game._wasPausedByMenu && game.paused && game.running) { game._wasPausedByMenu = false; game.resumeWithCountdown(); updatePauseButton(); }
    };
    const btnClose = document.getElementById('btn-close');
    if (btnClose) btnClose.onclick = close;
    if (typeof onOpen === 'function') onOpen(close);
  }

  // ЛИДЕРБОРД В ЛЕВОЙ ПАНЕЛИ
  async function openLeaderboardPanel() {
    if (!lbPanel || !lbBody) return;
    lbPanel.classList.remove('hidden');
    lbBody.innerHTML = '<div class="loader"></div>';

    // Если оффлайн, показать OFFLINE
    if (!window.apiService || !window.apiService.isAuthenticated() || !window.BackendIntegration?.prototype?.isBackendConnected?.call?.({})) {
      lbBody.innerHTML = '<p style="margin:12px 0; opacity:.85;">OFFLINE · таблица недоступна</p>';
      return;
    }

    try {
      const response = await window.apiService.makeRequest('/api/game/leaderboard?limit=15');
      if (!response.success || !Array.isArray(response.leaderboard)) {
        lbBody.innerHTML = '<p style="margin:12px 0; color: var(--error-color);">Не удалось загрузить лидеров</p>';
        return;
      }
      if (response.leaderboard.length === 0) {
        lbBody.innerHTML = '<p style="margin:12px 0; opacity:.85;">Пока пусто. Станьте первым!</p>';
        return;
      }
      const rows = response.leaderboard.map((p, i) => `
        <tr>
          <td class="leaderboard-rank">${p.rank}</td>
          <td class="leaderboard-username">${p.displayName || `user_${p.userId}`}</td>
          <td class="leaderboard-score">${(p.points || 0).toLocaleString('ru-RU')}</td>
          <td class="leaderboard-coins">${(p.coins || 0).toLocaleString('ru-RU')}</td>
          <td style="text-align:center;">${p.era || 1}</td>
        </tr>
      `).join('');
      lbBody.innerHTML = `
        <table class="leaderboard-table">
          <thead>
            <tr><th>#</th><th>Игрок</th><th>Очки</th><th>Монеты</th><th style="text-align:center;">Эра</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    } catch (e) {
      console.error('LB error', e);
      lbBody.innerHTML = '<p style="margin:12px 0; color: var(--error-color);">Ошибка загрузки</p>';
    }
  }
  document.getElementById('lb-close')?.addEventListener('click', () => {
    if (lbPanel) {
      lbPanel.classList.add('hidden');
      // Если лидерборд был открыт из главного меню, вернемся к нему
      if (lbPanel._openedFromMainMenu) {
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) {
          mainMenu.classList.remove('hidden');
          document.getElementById('app')?.classList.add('overlay-open');
        }
        lbPanel._openedFromMainMenu = false; // Сбрасываем флаг
      }
    }
  });

  // Кнопка из главного меню и из меню
  if (btnLeaderboard) {
    const openFromMain = () => {
      const mm = document.getElementById('main-menu');
      if (mm && !mm.classList.contains('hidden')) {
        // Запоминаем, что лидерборд открыт из главного меню
        openLeaderboardPanel();
        // Добавляем флаг к панели лидерборда
        const lbPanel = document.getElementById('leaderboard-panel');
        if (lbPanel) lbPanel._openedFromMainMenu = true;
        mm.classList.add('hidden');
      } else {
        openLeaderboardPanel();
      }
    };
    btnLeaderboard.addEventListener('click', openFromMain);
    btnLeaderboard.addEventListener('touchend', (e) => { e.preventDefault(); openFromMain(); }, { passive: false });
  }

  // РЕФЕРАЛЫ
  const renderReferrals = async () => {
    // Проверяем онлайн статус
    if (!window.apiService || !window.apiService.isAuthenticated()) {
      const offlineHtml = `
        <div style="text-align:center; padding:20px;">
          <h3 style="color:#ef4444; margin-bottom:16px;">ОФФЛАЙН</h3>
          <p>Реферальная система недоступна без авторизации</p>
        </div>`;
      openModal('👥 Реферальная система', offlineHtml);
      return;
    }

    // Показываем загрузчик
    openModal('👥 Реферальная система', '<div class="loader"></div>');

    try {
      const stats = await window.apiService.makeRequest('/api/referrals/stats');
      if (!stats.success) {
        throw new Error(stats.error || 'Failed to load stats');
      }

      const { referralLink, referrals } = stats;

      let referralsHtml = '<p style="opacity:0.7;">У вас пока нет рефералов. Пригласите друзей!</p>';
      if (referrals && referrals.length > 0) {
        referralsHtml = `
          <table class="leaderboard-table">
            <thead>
              <tr><th>Игрок</th><th>Принес очков</th></tr>
            </thead>
            <tbody>
              ${referrals.map(r => `
                <tr>
                  <td class="leaderboard-username">${r.first_name || r.username}</td>
                  <td class="leaderboard-score">${(r.total_earned || 0).toLocaleString('ru-RU')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }

      const html = `
        <div style="display:grid; gap:14px;">
          <div class="hud-item" style="justify-content:space-between;">
            <span>Ваша реферальная ссылка</span>
            <span style="font-size:12px; opacity:0.8;">Макс. 10 рефералов</span>
          </div>
          <div style="display:flex; gap:8px;">
            <input id="ref-link" value="${referralLink}" readonly style="flex:1; padding:12px; border:1px solid rgba(42,58,74,0.3); border-radius:8px; background:rgba(42,58,74,0.1); color:inherit; font-family:monospace;">
          </div>
          <div style="display:flex; gap:8px;">
            <button id="copy-ref" class="btn btn-primary">Копировать</button>
            <button id="share-ref" class="btn btn-success">📤 Поделиться</button>
          </div>
          <div id="ref-stats" style="padding:12px; background:rgba(42,58,74,0.1); border-radius:8px;">
            ${referralsHtml}
          </div>
        </div>`;
        
      // Обновляем содержимое модального окна без его повторного открытия
      const modalContent = document.getElementById('modal-content');
      if(modalContent) {
          modalContent.innerHTML = html;
      }

      // Навешиваем обработчики на новые кнопки
      const btnCopy = document.getElementById('copy-ref');
      const btnShare = document.getElementById('share-ref');
      const inputLink = document.getElementById('ref-link');

      if (btnCopy && inputLink) {
        btnCopy.onclick = async () => {
          try { 
            await navigator.clipboard.writeText(inputLink.value); 
            btnCopy.textContent = 'Скопировано'; 
            setTimeout(() => { btnCopy.textContent = 'Копировать'; }, 1200);
            if (window.telegramApp?.isTelegram) window.telegramApp.hapticNotification('success');
          } catch(e) { console.error('Failed to copy', e); }
        };
      }

      if (btnShare && inputLink) {
        btnShare.onclick = () => {
            const shareText = `🎮 Присоединяйся ко мне в Dino Runner! Моя ссылка: ${inputLink.value}`;
            if (window.telegramApp?.isTelegram && navigator.share) {
                navigator.share({ title: 'Dino Runner', text: shareText });
            } else {
                navigator.clipboard.writeText(shareText);
                alert('Ссылка скопирована в буфер обмена!');
            }
        };
      }

    } catch (error) {
      console.error('Referral error', error);
      const errorHtml = `<p style="margin:12px 0; color: var(--error-color);">Ошибка загрузки данных. Попробуйте позже.</p>`;
      const modalContent = document.getElementById('modal-content');
      if(modalContent) {
          modalContent.innerHTML = errorHtml;
      }
    }
  };
  btnReferrals?.addEventListener('click', renderReferrals);
  btnReferrals?.addEventListener('touchend', (e) => { e.preventDefault(); renderReferrals(); }, { passive: false });

  // Обмен/Вывод — с проверкой оффлайн
  const renderExchange = async () => {
    // Проверяем оффлайн статус
    if (window.backendIntegration && !window.backendIntegration.isBackendConnected()) {
      const html = `
        <div style="text-align:center; padding:20px;">
          <h3 style="color:#ef4444; margin-bottom:16px;">ОФФЛАЙН</h3>
          <p>Функция обмена недоступна без подключения к серверу</p>
          <p style="opacity:0.7; font-size:14px;">Подключитесь к интернету для использования этой функции</p>
        </div>
      `;
      openModal('💱 Обмен очков на монеты', html);
      return;
    }

    // Получаем курс и данные пользователя через backend API
    let rate = 1000; // Дефолтный курс
    let userPoints = 0;
    
    try {
      if (window.backendIntegration && window.backendIntegration.isBackendConnected()) {
        const ratesResponse = await window.apiService.makeRequest('/api/economy/exchange-rates');
        rate = ratesResponse.currentRate?.rate || 1000;
        
        const userStats = await window.apiService.getUserStats();
        userPoints = userStats.totalPoints || 0;
      }
    } catch (error) {
      console.error('Failed to fetch exchange data:', error);
    }
    const html = `
      <div style="display:grid; gap:14px;">
        <div class="hud-item" style="justify-content:space-between;">
          <span>Текущий курс</span>
          <strong>${rate.toLocaleString('ru-RU')} очков → 1 монета</strong>
        </div>
        <div class="hud-item" style="justify-content:space-between;">
          <span>Ваши очки</span>
          <strong id="ex-points">${userPoints.toLocaleString('ru-RU')}</strong>
        </div>
        <div style="display:grid; gap:8px;">
          <label style="display:flex; align-items:center; gap:8px;">
            <span>Сколько монет получить</span>
            <input id="ex-amount" type="number" min="1" step="1" value="1" style="width:120px;">
          </label>
          <div style="display:flex; gap:8px;">
            <button class="btn" data-q="1">+1</button>
            <button class="btn" data-q="5">+5</button>
            <button class="btn" data-q="10">+10</button>
            <button class="btn" data-q="50">+50</button>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span>Стоимость в очках</span>
          <strong id="ex-cost">${rate}</strong>
        </div>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button id="ex-cancel" class="btn">Назад</button>
          <button id="ex-confirm" class="btn btn-success">Обменять</button>
        </div>
      </div>`;
    openModal('💱 Обмен очков на монеты', html, (close) => {
      const amount = document.getElementById('ex-amount');
      const cost = document.getElementById('ex-cost');
      document.querySelectorAll('#modal-body [data-q]')?.forEach((b) => {
        b.addEventListener('click', () => {
          const add = Number(b.getAttribute('data-q')) || 0;
          amount.value = String(Math.max(1, Math.floor(Number(amount.value||1)+add)));
          updateCost();
        });
      });
      const btnBack = document.getElementById('ex-cancel');
      const btnOk = document.getElementById('ex-confirm');
      const updateCost = () => { const n = Math.max(1, Math.floor(Number(amount?.value || 1))); if (cost) cost.textContent = (n * rate).toLocaleString('ru-RU'); };
      amount?.addEventListener('input', updateCost);
      btnBack?.addEventListener('click', () => close());
      btnOk?.addEventListener('click', async () => {
        const coinsWanted = Math.max(1, Math.floor(Number(amount?.value || 1)));
        try {
          if (window.apiService && window.apiService.isAuthenticated()) {
            const result = await window.apiService.exchangePoints(coinsWanted);
            if (result.success) {
              game.score = result.newStats.totalPoints;
              game._scoreAccum = game.score;
              game.coins = result.newStats.totalCoins;
              const sEl = document.getElementById('score'); if (sEl) sEl.textContent = String(game.score);
              const cEl = document.getElementById('coins'); if (cEl) cEl.textContent = String(game.coins);
              const sc = document.getElementById('shop-coins'); if (sc) sc.textContent = String(game.coins);
              close();
              if (window.telegramApp?.isTelegram) window.telegramApp.hapticNotification('success');
              setTimeout(() => alert(`Получено монет: ${coinsWanted}`), 0);
            } else {
              alert(`Ошибка обмена: ${result.error || 'Неизвестная ошибка'}`);
            }
          } else {
            alert('Обмен очков недоступен в оффлайн режиме');
            return;
          }
        } catch (error) {
          console.error('Exchange error:', error);
          alert(`Ошибка обмена: ${error.message || 'Проблема с подключением'}`);
        }
      });
      updateCost();
    });
  };
  btnExchange?.addEventListener('click', renderExchange);
  btnExchange?.addEventListener('touchend', (e) => { e.preventDefault(); renderExchange(); }, { passive: false });

  const renderWithdraw = () => {
    // Проверяем оффлайн статус
    if (window.backendIntegration && !window.backendIntegration.isBackendConnected()) {
      const html = `
        <div style="text-align:center; padding:20px;">
          <h3 style="color:#ef4444; margin-bottom:16px;">ОФФЛАЙН</h3>
          <p>Функция вывода недоступна без подключения к серверу</p>
          <p style="opacity:0.7; font-size:14px;">Подключитесь к интернету для использования этой функции</p>
        </div>
      `;
      openModal('💰 Вывод монет (beta)', html);
      return;
    }

    const html = `
      <div style="display:grid; gap:12px;">
        <label>Сумма к выводу (монеты):
          <input id="wd-amount" type="number" min="1" step="1" value="10" style="width:140px; margin-left:8px;">
        </label>
        <label>TON адрес (beta):
          <input id="wd-address" type="text" placeholder="EQ..." style="width:100%; margin-left:8px;">
        </label>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button id="wd-cancel" class="btn">Назад</button>
          <button id="wd-send" class="btn btn-primary">Отправить</button>
        </div>
      </div>`;
    openModal('💰 Вывод монет (beta)', html, (close) => {
      const amount = document.getElementById('wd-amount');
      const address = document.getElementById('wd-address');
      document.getElementById('wd-cancel')?.addEventListener('click', () => close());
      document.getElementById('wd-send')?.addEventListener('click', async () => {
        const n = Math.max(1, Math.floor(Number(amount?.value || 0)));
        const addr = String(address?.value || '').trim();
        if (!addr) { alert('Укажите TON адрес'); return; }
        if (game.coins < n) { alert(`Недостаточно монет. Нужно: ${n}, у вас: ${game.coins}`); return; }
        try {
          if (window.apiService && window.apiService.isAuthenticated()) {
            const sendBtn = document.getElementById('wd-send');
            sendBtn.disabled = true;
            sendBtn.textContent = 'Обработка...';

            const result = await window.apiService.makeRequest('/api/withdrawals/request', {
              method: 'POST',
              body: { amount: n, tonAddress: addr }
            });

            if (result.success) {
              game.coins = result.newBalance;
              const cEl = document.getElementById('coins'); if (cEl) cEl.textContent = String(game.coins);
              const sc = document.getElementById('shop-coins'); if (sc) sc.textContent = String(game.coins);
              const mmsCoins = document.getElementById('mms-coins'); if (mmsCoins) mmsCoins.textContent = String(game.coins);
              
              close();
              if (window.telegramApp?.isTelegram) window.telegramApp.hapticNotification('success');
              setTimeout(() => {
                openModal('✅ Успешно', `
                  <div style="text-align:center; padding:20px;">
                    <h3 style="color:#10b981; margin-bottom:16px;">Заявка на вывод создана!</h3>
                    <p><strong>Сумма:</strong> ${n.toLocaleString()} монет</p>
                    <p><strong>Адрес:</strong> <code style="background:rgba(0,0,0,0.1); padding:2px 6px; border-radius:4px;">${addr}</code></p>
                    <p><strong>Статус:</strong> В обработке</p>
                    <p><strong>Новый баланс:</strong> ${game.coins.toLocaleString()} монет</p>
                    <p style="font-size:14px; opacity:0.8; margin-top:16px;">
                      Вывод будет обработан в течение 24 часов
                    </p>
                  </div>
                `);
              }, 100);
            } else {
              alert(`Ошибка вывода: ${result.error || 'Неизвестная ошибка'}`);
            }
          } else {
            alert('Вывод монет недоступен в оффлайн режиме');
            return;
          }
        } catch (error) {
          console.error('Withdrawal error:', error);
          alert(`Ошибка вывода: ${error.message || 'Проблема с подключением'}`);
        } finally {
          const sendBtn = document.getElementById('wd-send');
          if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Отправить';
          }
        }
      });
    });
  };
  btnWithdraw?.addEventListener('click', renderWithdraw);
  btnWithdraw?.addEventListener('touchend', (e) => { e.preventDefault(); renderWithdraw(); }, { passive: false });

  const openShop = () => {
    if (!skinShop) { openModal('Магазин скинов', 'В разработке.'); return; }
    const coinsEl = document.getElementById('shop-coins'); if (coinsEl) coinsEl.textContent = String(game.coins);

    // Запоминаем, что магазин открыт из главного меню
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu && !mainMenu.classList.contains('hidden')) {
      skinShop._openedFromMainMenu = true;
    }

    skinShop.openShop();
  };

  if (btnSkins) {
    btnSkins.addEventListener('click', openShop);
    btnSkins.addEventListener('touchend', (e) => { e.preventDefault(); openShop(); }, { passive: false });
  }
  if (btnShopBottom) {
    btnShopBottom.addEventListener('click', openShop);
    btnShopBottom.addEventListener('touchend', (e) => { e.preventDefault(); openShop(); }, { passive: false });
  }

  if (btnTheme) {
    btnTheme.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      if (game && game.environment) game.environment.theme = newTheme;
      document.documentElement.setAttribute('data-theme', newTheme);
      if (game.paused) game.draw();
      const icon = btnTheme.querySelector('.menu-icon');
      const text = btnTheme.querySelector('.menu-text');
      if (icon && text) {
        icon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
        text.textContent = newTheme === 'dark' ? 'Тема' : 'Светлая';
      }
    });
  }

  if (btnDevTools) {
    const devToolsPanel = document.getElementById('dev-tools-panel');
    const toggle = () => {
      if (devToolsPanel) {
        if (!window.DEV_TOOLS || !window.DEV_TOOLS.initialized) {
          if (window.DEV_TOOLS?.init) {
            window.DEV_TOOLS.init(game, skinShop);
            devToolsPanel.classList.remove('hidden');
          } else { return; }
        }
        if (devToolsPanel.classList.contains('hidden')) devToolsPanel.classList.remove('hidden');
        else devToolsPanel.classList.add('hidden');
      }
    };
    btnDevTools.addEventListener('click', toggle);
    btnDevTools.addEventListener('touchend', (e) => { e.preventDefault(); toggle(); }, { passive: false });
  }

  document.querySelectorAll('.social-link')?.forEach((a) => {
    a.addEventListener('click', (e) => {
      const url = a.getAttribute('href');
      if (!url || url === '#') return;
      try { window.open(url, '_blank'); } catch {}
    });
  });

  if (skinShop) {
    const btnShopExit = document.getElementById('btn-shop-exit');
    if (btnShopExit) {
      btnShopExit.addEventListener('click', () => skinShop.closeShop());
      btnShopExit.addEventListener('touchend', (e) => { e.preventDefault(); skinShop.closeShop(); }, { passive: false });
    }
  }

  // Обработчики кнопок закрытия модальных окон
  const closeExchangeModal = () => {
    const exchangeModal = document.getElementById('exchange-modal');
    if (exchangeModal) exchangeModal.classList.add('hidden');
    if (game._wasPausedByMenu && game.paused && game.running) {
      game._wasPausedByMenu = false;
      game.resumeWithCountdown();
      updatePauseButton();
    }
  };

  const btnCloseExchange = document.getElementById('btn-close-exchange');
  const btnExchangeBack = document.getElementById('exchange-back');

  if (btnCloseExchange) {
    btnCloseExchange.addEventListener('click', closeExchangeModal);
    btnCloseExchange.addEventListener('touchend', (e) => { e.preventDefault(); closeExchangeModal(); }, { passive: false });
  }

  if (btnExchangeBack) {
    btnExchangeBack.addEventListener('click', closeExchangeModal);
    btnExchangeBack.addEventListener('touchend', (e) => { e.preventDefault(); closeExchangeModal(); }, { passive: false });
  }

  // Делегирование событий для динамически созданных кнопок в модальных окнах
  document.addEventListener('click', (e) => {
    if (e.target.id === 'ex-cancel') {
      closeExchangeModal();
    }
    if (e.target.id === 'wd-cancel') {
      // Для кнопки отмены вывода - просто закрываем модальное окно
      const modalOverlay = document.getElementById('modal-overlay');
      if (modalOverlay) modalOverlay.classList.add('hidden');
      if (game._wasPausedByMenu && game.paused && game.running) {
        game._wasPausedByMenu = false;
        game.resumeWithCountdown();
        updatePauseButton();
      }
    }
  });

  // Bind bottom buttons globally for click before game start
  (function bindBottomButtons(){
    const shopBtn = document.getElementById('btn-shop-bottom');
    const mainMenuBtn = document.getElementById('btn-mainmenu-bottom');
    const menuBtn = document.getElementById('btn-menu-bottom');
    if (shopBtn) {
      shopBtn.addEventListener('click', (e)=>{ e.stopPropagation(); const coinsEl = document.getElementById('shop-coins'); const gi = window.gameInstance; if (coinsEl && gi) coinsEl.textContent = String(gi.coins||0); if (window.gameInstance?.skinShop?.openShop) window.gameInstance.skinShop.openShop(); else document.getElementById('btn-main-shop')?.click(); });
    }
    if (mainMenuBtn) {
      mainMenuBtn.addEventListener('click', (e)=>{ e.stopPropagation(); const mm = document.getElementById('main-menu'); if (mm) mm.classList.remove('hidden'); document.getElementById('app')?.classList.add('overlay-open'); });
    }
    if (menuBtn) {
      menuBtn.addEventListener('click', (e)=>{ e.stopPropagation(); const menuEl = document.getElementById('menu'); if (menuEl) menuEl.classList.remove('hidden'); });
    }
  })();

  // Allow UI interaction when start overlay shown
  (function enableUIWhenOverlayShown(){
    const startOverlay = document.getElementById('tap-to-start');
    if (startOverlay) {
      startOverlay.style.pointerEvents = 'none';
      const content = startOverlay.querySelector('.gameover-content');
      if (content) content.style.pointerEvents = 'auto';
    }
  })();
}

