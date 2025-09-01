export class SkinShop {
  constructor(game) {
    this.game = game;
    // Раздельные категории: персонаж, земля, наземные враги, воздушные враги, облака
    this.availableSkins = [
      // Characters
      { id: 'char-standart', name: 'Персонаж: Стандартный', price: 0, type: 'character', packName: 'standart', owned: true },
      { id: 'char-sonic', name: 'Персонаж: Sonic', price: 500, type: 'character', packName: 'sonic', owned: false },
      { id: 'char-mario', name: 'Персонаж: Mario', price: 500, type: 'character', packName: 'mario', owned: false },
      { id: 'char-pacman', name: 'Персонаж: Pac-Man', price: 800, type: 'character', packName: 'pacman', owned: false },
      { id: 'char-premium', name: 'Персонаж: Premium', price: 1000, type: 'character', packName: 'premium', owned: false },
      { id: 'char-batman', name: 'Персонаж: Batman', price: 1200, type: 'character', packName: 'batman', owned: false },
      { id: 'char-joker', name: 'Персонаж: Joker', price: 1200, type: 'character', packName: 'joker', owned: false },
      { id: 'char-supersonic', name: 'Персонаж: SuperSonic', price: 1500, type: 'character', packName: 'supersonic', owned: false },
      // Ground
      { id: 'ground-standart', name: 'Земля: Стандарт', price: 0, type: 'ground', packName: 'standart', owned: true },
      { id: 'ground-sonic', name: 'Земля: Sonic', price: 200, type: 'ground', packName: 'sonic', owned: false },
      { id: 'ground-mario', name: 'Земля: Mario', price: 200, type: 'ground', packName: 'mario', owned: false },
      { id: 'ground-pacman', name: 'Земля: Pac-Man', price: 200, type: 'ground', packName: 'pacman', owned: false },
      { id: 'ground-premium', name: 'Земля: Premium', price: 300, type: 'ground', packName: 'premium', owned: false },
      { id: 'ground-batman', name: 'Земля: Batman', price: 300, type: 'ground', packName: 'batman', owned: false },
      { id: 'ground-joker', name: 'Земля: Joker', price: 300, type: 'ground', packName: 'joker', owned: false },
      { id: 'ground-supersonic', name: 'Земля: SuperSonic', price: 300, type: 'ground', packName: 'supersonic', owned: false },
      // Enemies: ground
      { id: 'enemies-ground-standart', name: 'Наземные враги: Стандарт', price: 0, type: 'enemiesGround', packName: 'standart', owned: true },
      { id: 'enemies-ground-sonic', name: 'Наземные враги: Sonic', price: 250, type: 'enemiesGround', packName: 'sonic', owned: false },
      { id: 'enemies-ground-mario', name: 'Наземные враги: Mario', price: 250, type: 'enemiesGround', packName: 'mario', owned: false },
      { id: 'enemies-ground-pacman', name: 'Наземные враги: Pac-Man', price: 250, type: 'enemiesGround', packName: 'pacman', owned: false },
      { id: 'enemies-ground-premium', name: 'Наземные враги: Premium', price: 400, type: 'enemiesGround', packName: 'premium', owned: false },
      { id: 'enemies-ground-batman', name: 'Наземные враги: Batman', price: 400, type: 'enemiesGround', packName: 'batman', owned: false },
      { id: 'enemies-ground-joker', name: 'Наземные враги: Joker', price: 400, type: 'enemiesGround', packName: 'joker', owned: false },
      { id: 'enemies-ground-supersonic', name: 'Наземные враги: SuperSonic', price: 450, type: 'enemiesGround', packName: 'supersonic', owned: false },
      // Enemies: air
      { id: 'enemies-air-standart', name: 'Воздушные враги: Стандарт', price: 0, type: 'enemiesAir', packName: 'standart', owned: true },
      { id: 'enemies-air-sonic', name: 'Воздушные враги: Sonic', price: 200, type: 'enemiesAir', packName: 'sonic', owned: false },
      { id: 'enemies-air-mario', name: 'Воздушные враги: Mario', price: 200, type: 'enemiesAir', packName: 'mario', owned: false },
      { id: 'enemies-air-pacman', name: 'Воздушные враги: Pac-Man', price: 200, type: 'enemiesAir', packName: 'pacman', owned: false },
      { id: 'enemies-air-premium', name: 'Воздушные враги: Premium', price: 350, type: 'enemiesAir', packName: 'premium', owned: false },
      { id: 'enemies-air-batman', name: 'Воздушные враги: Batman', price: 350, type: 'enemiesAir', packName: 'batman', owned: false },
      { id: 'enemies-air-joker', name: 'Воздушные враги: Joker', price: 350, type: 'enemiesAir', packName: 'joker', owned: false },
      { id: 'enemies-air-supersonic', name: 'Воздушные враги: SuperSonic', price: 350, type: 'enemiesAir', packName: 'supersonic', owned: false },
      // Clouds
      { id: 'clouds-standart', name: 'Облака: Стандарт', price: 0, type: 'clouds', packName: 'standart', owned: true },
      { id: 'clouds-mario', name: 'Облака: Mario', price: 150, type: 'clouds', packName: 'mario', owned: false },
      { id: 'clouds-premium', name: 'Облака: Premium', price: 250, type: 'clouds', packName: 'premium', owned: false },
      { id: 'clouds-pacman', name: 'Облака: Pac-Man', price: 150, type: 'clouds', packName: 'pacman', owned: false },
      { id: 'clouds-batman', name: 'Облака: Batman', price: 250, type: 'clouds', packName: 'batman', owned: false },
      { id: 'clouds-joker', name: 'Облака: Joker', price: 250, type: 'clouds', packName: 'joker', owned: false },
      { id: 'clouds-supersonic', name: 'Облака: SuperSonic', price: 250, type: 'clouds', packName: 'supersonic', owned: false },
    ];
    this.currentSkin = this.availableSkins[0];
    this.previewCanvas = null;
    this.previewCtx = null;
    this.initPreviewCanvas();
    this.loadSkinData();
  }

  initPreviewCanvas() {
    this.previewCanvas = document.createElement('canvas');
    this.previewCanvas.width = 89;
    this.previewCanvas.height = 94;
    this.previewCtx = this.previewCanvas.getContext('2d');
  }

  async loadSkinData() {
    // Если онлайн - загружаем данные с backend
    if (this.isOnline()) {
      try {
        const response = await window.apiService.makeRequest('/api/shop/skins');
        if (response.success) {
          // Обновляем список скинов данными с сервера
          this.availableSkins.forEach(skin => {
            const serverSkin = response.skins.find(s => s.id === skin.id);
            if (serverSkin) {
              skin.owned = serverSkin.owned;
            }
          });
          
          // Применяем активные скины с сервера
          if (response.activeSkins) {
            await this.applySources(response.activeSkins);
          }
          return;
        }
      } catch (error) {
        console.error('Failed to load skin data from backend:', error);
        // Fallback to localStorage if backend fails
      }
    }
    
    // Offline режим - используем localStorage (только стандартные скины)
    const saved = localStorage.getItem('dino-skins');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.availableSkins.forEach(skin => {
          // В оффлайн режиме доступны только стандартные скины
          if (skin.packName === 'standart') {
            skin.owned = true;
          } else {
            skin.owned = false;
          }
        });
      } catch (e) { /* ignore */ }
    }
    
    // В оффлайн режиме принудительно устанавливаем стандартные скины
    if (!this.isOnline()) {
      const standardSources = {
        character: 'standart',
        ground: 'standart',
        enemiesGround: 'standart',
        enemiesAir: 'standart',
        clouds: 'standart'
      };
      await this.applySources(standardSources);
    }
    
    // Экспорт активных источников в игру для валидации
    if (this.game && this.game.assetPack) {
      const sources = this.game.assetPack.getCurrentSources();
      this.game.currentSkinPack = sources.character;
      this.game.currentGroundPack = sources.ground;
      this.game.currentEnemiesGroundPack = sources.enemiesGround;
      this.game.currentEnemiesAirPack = sources.enemiesAir;
      this.game.currentCloudsPack = sources.clouds;
    }
  }

  saveSkinData() {
    const data = { skins: this.availableSkins.map(s => ({ id: s.id, owned: s.owned })) };
    localStorage.setItem('dino-skins', JSON.stringify(data));
  }

  openShop() {
    // Проверяем online статус
    if (!this.isOnline()) {
      this.showOfflineMessage('Магазин недоступен в оффлайн режиме');
      return;
    }
    
    this.renderShop();
    const modal = document.getElementById('shop-modal');
    if (modal) modal.classList.remove('hidden');
    if (this.game && this.game.running && !this.game.paused) {
      this.game.pause();
      this.game._wasPausedByMenu = true;
    }
  }

  closeShop() {
    const modal = document.getElementById('shop-modal');
    if (modal) modal.classList.add('hidden');

    // Если магазин был открыт из главного меню, вернемся к нему
    if (this._openedFromMainMenu) {
      const mainMenu = document.getElementById('main-menu');
      if (mainMenu) {
        mainMenu.classList.remove('hidden');
        document.getElementById('app')?.classList.add('overlay-open');
      }
      this._openedFromMainMenu = false; // Сбрасываем флаг
    }

    if (this.game && this.game._wasPausedByMenu && this.game.paused && this.game.running) {
      this.game._wasPausedByMenu = false;
      this.game.resumeWithCountdown();
    }
  }

  renderShop() {
    const container = document.getElementById('shop-skins-list');
    if (!container) return;

    container.innerHTML = '';

    // Sidebar + grid wrapper (адаптивная верстка без горизонтального скролла)
    const sidebar = document.createElement('div');
    sidebar.className = 'shop-sidebar';
    sidebar.style.padding = '16px';
    sidebar.style.borderRight = '1px solid rgba(42,58,74,0.3)';
    const current = this.game.assetPack.getCurrentSources();
    sidebar.innerHTML = `
      <div style="position:sticky; top:16px; display:flex; flex-direction:column; gap:10px;">
        <h4 style="margin:0 0 8px 0;">Активно</h4>
        <div>Персонаж: <strong>${current.character}</strong></div>
        <div>Земля: <strong>${current.ground}</strong></div>
        <div>Наземные: <strong>${current.enemiesGround}</strong></div>
        <div>Воздушные: <strong>${current.enemiesAir}</strong></div>
        <div>Облака: <strong>${current.clouds}</strong></div>
      </div>
    `;

    const grid = document.createElement('div');
    grid.className = 'shop-skins-grid';
    grid.style.flex = '1';

    const wrapper = document.createElement('div');
    wrapper.className = 'shop-flex-wrapper';
    wrapper.style.display = 'flex';
    wrapper.style.gap = '16px';
    wrapper.appendChild(sidebar);
    wrapper.appendChild(grid);
    container.appendChild(wrapper);

    const categoryOrder = ['character','ground','enemiesGround','enemiesAir','clouds'];
    categoryOrder.forEach((category) => {
      const section = document.createElement('div');
      section.style.padding = '12px';
      section.style.border = '1px solid rgba(42,58,74,0.25)';
      section.style.borderRadius = '12px';
      section.style.marginBottom = '12px';
      const bgByCat = {
        character: 'rgba(42,157,244,0.08)',
        ground: 'rgba(16,185,129,0.08)',
        enemiesGround: 'rgba(244,114,182,0.08)',
        enemiesAir: 'rgba(234,179,8,0.08)',
        clouds: 'rgba(148,163,184,0.15)'
      };
      section.style.background = bgByCat[category] || 'transparent';
      const title = document.createElement('h4');
      title.textContent = (
        category === 'character' ? 'Персонажи' :
        category === 'ground' ? 'Земля' :
        category === 'enemiesGround' ? 'Наземные враги' :
        category === 'enemiesAir' ? 'Воздушные враги' : 'Облака'
      );
      title.style.margin = '0 0 8px 0';
      section.appendChild(title);

      this.availableSkins.filter(s => s.type === category).forEach(skin => {
        const skinItem = document.createElement('div');
        skinItem.className = `skin-item ${skin.owned ? 'owned' : ''}`;
        const preview = this.createSkinPreview(skin);
        const info = document.createElement('div');
        info.className = 'skin-info';
        info.innerHTML = `
          <h4>${skin.name}</h4>
          <p class="skin-price">${skin.price === 0 ? 'Бесплатно' : skin.price + ' монет'}</p>
        `;
        const actions = document.createElement('div');
        actions.className = 'skin-actions';
        if (skin.owned) {
          const activateBtn = document.createElement('button');
          activateBtn.className = 'btn btn-secondary';
          activateBtn.textContent = 'Активировать';
          activateBtn.onclick = () => this.activateSkin(skin);
          actions.appendChild(activateBtn);
        } else {
          const buyBtn = document.createElement('button');
          buyBtn.className = 'btn btn-primary';
          buyBtn.textContent = 'Купить';
          buyBtn.disabled = this.game.coins < skin.price;
          buyBtn.onclick = () => this.buySkin(skin);
          actions.appendChild(buyBtn);
        }
        skinItem.appendChild(preview);
        skinItem.appendChild(info);
        skinItem.appendChild(actions);
        section.appendChild(skinItem);
      });

      grid.appendChild(section);
    });
  }

  createSkinPreview(skin) {
    const previewContainer = document.createElement('div');
    previewContainer.className = 'skin-preview';
    const img = new Image();
    img.onload = () => {
      this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
      const dx = (this.previewCanvas.width - img.naturalWidth) / 2;
      const dy = (this.previewCanvas.height - img.naturalHeight) / 2;
      this.previewCtx.drawImage(img, dx, dy);
      const previewImg = document.createElement('img');
      previewImg.src = this.previewCanvas.toDataURL();
      previewImg.className = 'skin-preview-img';
      previewContainer.appendChild(previewImg);
    };
    img.onerror = () => {
      previewContainer.innerHTML = '<div class="skin-preview-fallback">🖼️</div>';
    };
    // Используем те же PNG, что в ассет-паках (из папки Sprites)
    let previewPath = '';
    if (skin.type === 'character') {
      previewPath = this.game.assetPack.getPreviewImagePath('character', skin.packName);
    } else if (skin.type === 'ground') {
      previewPath = this.game.assetPack.getPreviewImagePath('ground', skin.packName);
    } else if (skin.type === 'enemiesGround') {
      previewPath = this.game.assetPack.getPreviewImagePath('enemiesGround', skin.packName);
    } else if (skin.type === 'enemiesAir') {
      previewPath = this.game.assetPack.getPreviewImagePath('enemiesAir', skin.packName);
    } else if (skin.type === 'clouds') {
      previewPath = this.game.assetPack.getPreviewImagePath('clouds', skin.packName);
    }
    img.src = previewPath;
    return previewContainer;
  }

  async buySkin(skin) {
    // Проверяем online статус
    if (!this.isOnline()) {
      this.showOfflineMessage('Покупка скинов недоступна в оффлайн режиме');
      return;
    }
    
    try {
      const response = await window.apiService.makeRequest('/api/shop/purchase', {
        method: 'POST',
        body: { skinId: skin.id }
      });
      
      if (response.success) {
        // Обновляем локальное состояние
        skin.owned = true;
        this.game.coins = response.newBalance;
        
        // Обновляем отображение
        this.renderShop();
        this.updateCoinDisplay();
        
        // Уведомление о успешной покупке
        if (window.telegramApp && window.telegramApp.isTelegram) {
          window.telegramApp.showToast(`Скин "${skin.name}" куплен!`, 'success');
          window.telegramApp.hapticNotification('success');
        }
      } else {
        throw new Error(response.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      this.showOfflineMessage(`Ошибка покупки: ${error.message}`);
    }
  }

  async activateSkin(skin) {
    if (!skin.owned) return;
    
    // Если онлайн - отправляем на backend
    if (this.isOnline()) {
      try {
        const response = await window.apiService.makeRequest('/api/shop/activate', {
          method: 'POST',
          body: { skinId: skin.id }
        });
        
        if (response.success) {
          // Применяем активные скины с сервера
          await this.applySources(response.activeSkins);
          
          if (window.telegramApp && window.telegramApp.isTelegram) {
            window.telegramApp.showToast(`Скин "${skin.name}" активирован!`, 'success');
            window.telegramApp.hapticNotification('light');
          }
        } else {
          throw new Error(response.error || 'Activation failed');
        }
      } catch (error) {
        console.error('Activation error:', error);
        this.showOfflineMessage(`Ошибка активации: ${error.message}`);
      }
    } else {
      // Offline режим - только стандартные скины
      if (skin.packName !== 'standart') {
        this.showOfflineMessage('В оффлайн режиме доступны только стандартные скины');
        return;
      }
      
      // Меняем один из источников ассетов
      const updates = {};
      updates[skin.type] = skin.packName;
      await this.applySources(updates);
    }
  }

  async applySources(partialSources) {
    if (!this.game || !this.game.assetPack) return;
    const newSources = { ...this.game.assetPack.getCurrentSources(), ...partialSources };
    await this.game.setSkinSources(newSources);
    this.saveSkinData();
    this.renderShop();
  }

  updateCoinDisplay() {
    const coinEl = document.getElementById('coins');
    if (coinEl) coinEl.textContent = String(this.game.coins);
  }

  getCurrentSkin() { return this.currentSkin; }

  // Проверка online статуса
  isOnline() {
    return window.backendIntegration && window.backendIntegration.isBackendConnected();
  }

  // Показать сообщение о недоступности в offline режиме
  showOfflineMessage(message) {
    if (window.telegramApp && window.telegramApp.isTelegram) {
      window.telegramApp.showToast(message, 'error');
    } else {
      alert(message);
    }
  }
}
