
import { proto } from '@whiskeysockets/baileys';
import { MessageHandler } from './MessageHandler';
import logger from '../../utils/logger';

export class EventHandlers {
  private messageHandler: MessageHandler;

  constructor(messageHandler: MessageHandler) {
    this.messageHandler = messageHandler;
  }

  setupMessageHandlers(socket: any, getCurrentUser: () => any) {
    // Handler para mensagens
    socket.ev.on('messages.upsert', async (messageUpdate: any) => {
      try {
        const { messages } = messageUpdate;
        
        for (const message of messages) {
          if (message.key.fromMe) continue; // Ignorar mensagens próprias
          
          const currentUser = getCurrentUser();
          if (!currentUser) {
            logger.warn('Usuário atual não definido, ignorando mensagem');
            continue;
          }

          // Verificar se é mensagem de áudio
          if (message.message?.audioMessage) {
            await this.messageHandler.processAudioMessage(message, socket, currentUser);
          } else {
            await this.messageHandler.processMessage(message, socket, currentUser);
          }
        }
      } catch (error) {
        logger.error('Erro ao processar mensagens:', error);
      }
    });

    // Handler para atualizações de presença
    socket.ev.on('presence.update', (update: any) => {
      try {
        logger.debug('Atualização de presença:', update);
      } catch (error) {
        logger.error('Erro ao processar atualização de presença:', error);
      }
    });

    // Handler para recibos de leitura
    socket.ev.on('message-receipt.update', (update: any) => {
      try {
        logger.debug('Recibo de mensagem:', update);
      } catch (error) {
        logger.error('Erro ao processar recibo de mensagem:', error);
      }
    });

    logger.info('✅ Event handlers configurados');
  }
}
