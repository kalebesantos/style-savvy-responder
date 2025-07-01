
import logger from '../utils/logger';
import DatabaseService from '../config/database';
import { ConnectionManager } from './whatsapp/ConnectionManager';
import { EventHandlers } from './whatsapp/EventHandlers';
import { MessageHandler } from './whatsapp/MessageHandler';
import { ConnectionState } from '@whiskeysockets/baileys';

export class WhatsAppService {
  private connectionManager: ConnectionManager;
  private eventHandlers: EventHandlers;
  private messageHandler: MessageHandler;
  private currentUser: any = null;

  constructor() {
    this.connectionManager = new ConnectionManager();
    this.messageHandler = new MessageHandler();
    this.eventHandlers = new EventHandlers(this.messageHandler);
  }

  async initialize() {
    try {
      logger.info('Inicializando serviço WhatsApp...');
      
      const socket = await this.connectionManager.initialize(
        this.handleQRCode.bind(this),
        this.handleConnectionUpdate.bind(this)
      );

      if (socket) {
        this.eventHandlers.setupMessageHandlers(socket, () => this.currentUser);
      }

    } catch (error) {
      logger.error('Erro ao inicializar serviço WhatsApp:', error);
      await DatabaseService.updateBotStatus('error');
    }
  }

  private async handleQRCode(qr: string) {
    logger.info('QR Code gerado para o frontend');
  }

  private async handleConnectionUpdate(update: Partial<ConnectionState>) {
    if (update.connection === 'open') {
      const socket = this.connectionManager.getSocket();
      if (!socket) {
        logger.error('Socket não disponível após conexão');
        return;
      }

      const userInfo = socket.user;
      if (userInfo) {
        logger.info('Criando/atualizando usuário no banco de dados...');
        const user = await DatabaseService.findOrCreateUser(
          userInfo.id.split(':')[0],
          userInfo.name || userInfo.id.split(':')[0]
        );
        if (user) {
          this.currentUser = user;
          await DatabaseService.setCurrentUser(user.id);
          logger.info(`Conectado como: ${user.display_name || user.phone_number}`);
          
          await DatabaseService.updateBotStatus('online', undefined);
          
          logger.info('🤖 Bot pronto para aprender e responder mensagens!');
          logger.info(`📊 Usuário ativo: ${user.phone_number}`);
        }
      }
    }
  }

  async disconnect() {
    await this.connectionManager.disconnect();
    this.currentUser = null;
    await DatabaseService.updateBotStatus('offline', undefined);
    await DatabaseService.setCurrentUser(undefined);
  }

  async clearSession() {
    await this.connectionManager.clearSession();
    this.currentUser = null;
    await DatabaseService.updateBotStatus('offline', undefined);
    await DatabaseService.setCurrentUser(undefined);
  }

  getConnectionStatus() {
    return {
      isConnected: this.connectionManager.isConnected(),
      currentUser: this.currentUser
    };
  }
}

export default new WhatsAppService();
