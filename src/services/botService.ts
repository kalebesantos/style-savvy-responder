
const BOT_SERVER_URL = 'http://localhost:3001'; // Porta onde o bot server roda

export class BotService {
  static async startBot(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${BOT_SERVER_URL}/api/bot/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      return { success: response.ok, message: data.message };
    } catch (error) {
      console.error('Error starting bot:', error);
      return { success: false, message: 'Erro ao conectar com o servidor do bot' };
    }
  }

  static async stopBot(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${BOT_SERVER_URL}/api/bot/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      return { success: response.ok, message: data.message };
    } catch (error) {
      console.error('Error stopping bot:', error);
      return { success: false, message: 'Erro ao conectar com o servidor do bot' };
    }
  }

  static async getBotStatus(): Promise<{ 
    status: 'online' | 'offline' | 'connecting' | 'error';
    qrCode?: string;
    currentUser?: any;
  }> {
    try {
      const response = await fetch(`${BOT_SERVER_URL}/api/bot/status`);
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      return { status: 'offline' };
    } catch (error) {
      console.error('Error getting bot status:', error);
      return { status: 'error' };
    }
  }

  static async clearSession(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${BOT_SERVER_URL}/api/bot/clear-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      return { success: response.ok, message: data.message };
    } catch (error) {
      console.error('Error clearing session:', error);
      return { success: false, message: 'Erro ao conectar com o servidor do bot' };
    }
  }
}
