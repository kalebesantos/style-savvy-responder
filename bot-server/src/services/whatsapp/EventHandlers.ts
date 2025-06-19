
import { proto } from '@whiskeysockets/baileys';
import logger from '../../utils/logger';
import { MessageHandler } from './MessageHandler';

export class EventHandlers {
  private messageHandler: MessageHandler;

  constructor(messageHandler: MessageHandler) {
    this.messageHandler = messageHandler;
  }

  setupMessageHandlers(socket: any, getCurrentUser: () => any) {
    socket.ev.on('messages.upsert', async (m: any) => {
      const message = m.messages[0];
      if (!message.key.fromMe && message.message) {
        await this.messageHandler.handleMessage(socket, message, getCurrentUser());
      }
    });

    socket.ev.on('messages.update', (messageUpdate: any) => {
      logger.info('Message update received:', messageUpdate);
    });

    socket.ev.on('presence.update', (presence: any) => {
      logger.info('Presence update:', presence);
    });
  }
}
