
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
      logger.info('Initializing WhatsApp service...');
      
      const socket = await this.connectionManager.initialize(
        this.handleQRCode.bind(this),
        this.handleConnectionUpdate.bind(this)
      );

      if (socket) {
        this.eventHandlers.setupMessageHandlers(socket, () => this.currentUser);
      }

    } catch (error) {
      logger.error('Error initializing WhatsApp service:', error);
      await DatabaseService.updateBotStatus('error');
    }
  }

  private async handleQRCode(qr: string) {
    // QR code is already logged to console by ConnectionManager
    // Database is already updated by ConnectionManager
  }

  private async handleConnectionUpdate(update: Partial<ConnectionState>) {
    if (update.connection === 'open') {
      const socket = this.connectionManager.getSocket();
      if (!socket) {
        logger.error('Socket not available after connection');
        return;
      }

      const userInfo = socket.user;
      if (userInfo) {
        const user = await DatabaseService.findOrCreateUser(
          userInfo.id.split(':')[0],
          userInfo.name
        );
        if (user && user.id) {
          this.currentUser = user;
          await DatabaseService.setCurrentUser(user.id);
          logger.info(`Connected as: ${user.display_name || user.phone_number}`);
        }
      }
    }
  }

  async disconnect() {
    await this.connectionManager.disconnect();
    this.currentUser = null;
    await DatabaseService.updateBotStatus('offline');
  }

  async clearSession() {
    await this.connectionManager.clearSession();
    this.currentUser = null;
    await DatabaseService.updateBotStatus('offline');
  }

  getConnectionStatus() {
    return {
      isConnected: this.connectionManager.isConnected(),
      currentUser: this.currentUser
    };
  }
}

export default new WhatsAppService();
