
import logger from '../../utils/logger';
import DatabaseService from '../../config/database';
import AIService from '../AIService';
import AudioService from '../AudioService';

export class MessageHandler {
  async handleMessage(socket: any, message: any, getCurrentUser: () => any) {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        logger.warn('No current user found, skipping message');
        return;
      }

      const messageText = this.extractMessageText(message);
      const senderNumber = message.key.remoteJid?.split('@')[0];
      
      if (!messageText || !senderNumber) {
        logger.warn('Invalid message format');
        return;
      }

      logger.info(`Message from ${senderNumber}: ${messageText}`);

      // Store message in database
      await DatabaseService.storeMessage({
        sender_number: senderNumber,
        message_text: messageText,
        message_type: 'received',
        bot_user_id: currentUser.id
      });

      // Process with AI if available
      try {
        const aiResponse = await AIService.generateResponse(messageText);
        if (aiResponse) {
          await socket.sendMessage(message.key.remoteJid, { text: aiResponse });
          
          // Store AI response
          await DatabaseService.storeMessage({
            sender_number: senderNumber,
            message_text: aiResponse,
            message_type: 'sent',
            bot_user_id: currentUser.id
          });
        }
      } catch (aiError) {
        logger.warn('AI service not available:', aiError);
      }

    } catch (error) {
      logger.error('Error handling message:', error);
    }
  }

  private extractMessageText(message: any): string | null {
    if (message.message?.conversation) {
      return message.message.conversation;
    }
    if (message.message?.extendedTextMessage?.text) {
      return message.message.extendedTextMessage.text;
    }
    return null;
  }
}
