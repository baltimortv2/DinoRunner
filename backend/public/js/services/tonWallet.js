export class TonWalletService {
  constructor() {
    this.isConnected = false;
    this.walletAddress = null;
    this.wallet = null;
    this.network = 'mainnet'; // или 'testnet'
  }

  /**
   * Инициализация TON кошелька
   */
  async initialize() {
    try {
      // Проверяем, доступен ли TON кошелек
      if (typeof window.ton !== 'undefined') {
        console.log('✅ TON кошелек доступен');
        this.wallet = window.ton;
        return true;
      }

      // Пытаемся подключиться к Tonspace
      if (typeof window.tonConnectUI !== 'undefined') {
        console.log('✅ TON Connect UI доступен');
        return true;
      }

      console.warn('⚠️ TON кошелек не найден');
      return false;
    } catch (error) {
      console.error('❌ Ошибка инициализации TON кошелька:', error);
      return false;
    }
  }

  /**
   * Подключение к кошельку
   */
  async connect() {
    try {
      if (!this.wallet) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('TON кошелек недоступен');
        }
      }

      // Пытаемся подключиться
      if (this.wallet && typeof this.wallet.connect === 'function') {
        const result = await this.wallet.connect();
        if (result && result.address) {
          this.walletAddress = result.address;
          this.isConnected = true;
          console.log('✅ Подключен к TON кошельку:', this.walletAddress);
          return { success: true, address: this.walletAddress };
        }
      }

      // Альтернативный способ через TON Connect
      if (window.tonConnectUI) {
        const tonConnectUI = window.tonConnectUI;
        const wallet = await tonConnectUI.connectWallet();
        if (wallet) {
          this.walletAddress = wallet.account.address;
          this.isConnected = true;
          console.log('✅ Подключен к TON кошельку через TON Connect:', this.walletAddress);
          return { success: true, address: this.walletAddress };
        }
      }

      throw new Error('Не удалось подключиться к кошельку');
    } catch (error) {
      console.error('❌ Ошибка подключения к TON кошельку:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Отключение от кошелька
   */
  async disconnect() {
    try {
      if (this.wallet && typeof this.wallet.disconnect === 'function') {
        await this.wallet.disconnect();
      }

      if (window.tonConnectUI) {
        window.tonConnectUI.disconnect();
      }

      this.isConnected = false;
      this.walletAddress = null;
      console.log('✅ Отключен от TON кошелька');
      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка отключения от TON кошелька:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Получение баланса кошелька
   */
  async getBalance() {
    try {
      if (!this.isConnected || !this.walletAddress) {
        throw new Error('Кошелек не подключен');
      }

      // Используем TON API для получения баланса
      const response = await fetch(`https://toncenter.com/api/v2/getAddressBalance?address=${this.walletAddress}`);
      const data = await response.json();
      
      if (data.ok) {
        const balance = parseFloat(data.result) / 1e9; // Конвертируем из nano TON
        return { success: true, balance };
      } else {
        throw new Error('Не удалось получить баланс');
      }
    } catch (error) {
      console.error('❌ Ошибка получения баланса:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Отправка TON монет
   */
  async sendTon(toAddress, amount) {
    try {
      if (!this.isConnected || !this.wallet) {
        throw new Error('Кошелек не подключен');
      }

      // Конвертируем в nano TON
      const amountNano = Math.floor(amount * 1e9);

      if (this.wallet && typeof this.wallet.send === 'function') {
        const result = await this.wallet.send({
          to: toAddress,
          amount: amountNano.toString(),
          data: 'Withdrawal from Dino Runner game'
        });

        console.log('✅ TON отправлены:', result);
        return { success: true, txHash: result };
      }

      throw new Error('Метод отправки недоступен');
    } catch (error) {
      console.error('❌ Ошибка отправки TON:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Проверка статуса подключения
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      address: this.walletAddress,
      network: this.network
    };
  }

  /**
   * Получение короткого адреса для отображения
   */
  getShortAddress() {
    if (!this.walletAddress) return null;
    return `${this.walletAddress.slice(0, 6)}...${this.walletAddress.slice(-4)}`;
  }
}

// Создаем глобальный экземпляр
export const tonWalletService = new TonWalletService();
