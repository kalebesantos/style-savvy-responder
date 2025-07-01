
import { proto } from '@whiskeysockets/baileys';
import DatabaseService from '../../config/database';
import AIService from '../AIService';
import AudioService from '../AudioService';
import logger from '../../utils/logger';

export class MessageHandler {
  async processMessage(
    message: proto.IWebMessageInfo,
    socket: any,
    currentUser: any
  ) {
    try {
      if (!currentUser || !message.key.remoteJid) return;

      const isFromCurrentUser = message.key.fromMe;
      const messageContent = this.extractMessageContent(message);
      
      if (!messageContent) return;

      // Salvar mensagem no banco
      await DatabaseService.saveMessage({
        user_id: currentUser.id,
        content: messageContent,
        message_type: isFromCurrentUser ? 'outgoing' : 'incoming',
        timestamp: new Date().toISOString(),
        processed: false
      });

      // Se é mensagem recebida (não enviada pelo usuário atual), gerar resposta da IA
      if (!isFromCurrentUser) {
        logger.info(`📨 Mensagem recebida de ${currentUser.phone_number}: ${messageContent}`);
        
        // Verificar se o aprendizado está habilitado
        const botConfig = await DatabaseService.getBotConfig();
        if (!botConfig?.learning_enabled) {
          logger.info('Aprendizado desabilitado, não gerando resposta');
          return;
        }

        // Gerar resposta da IA
        const aiResponse = await AIService.generateResponse(currentUser.id, messageContent);
        
        if (aiResponse.text && aiResponse.confidence > 0.3) {
          // Enviar resposta
          await socket.sendMessage(message.key.remoteJid, {
            text: aiResponse.text
          });

          // Salvar resposta da IA no banco
          await DatabaseService.saveMessage({
            user_id: currentUser.id,
            content: aiResponse.text,
            message_type: 'outgoing',
            timestamp: new Date().toISOString(),
            processed: true
          });

          logger.info(`🤖 Resposta da IA enviada (confiança: ${Math.round(aiResponse.confidence * 100)}%): ${aiResponse.text}`);
        } else {
          logger.info('Resposta da IA com baixa confiança, não enviando');
        }
      }
    } catch (error) {
      logger.error('Erro ao processar mensagem:', error);
    }
  }

  private extractMessageContent(message: proto.IWebMessageInfo): string | null {
    try {
      const msg = message.message;
      if (!msg) return null;

      // Texto simples
      if (msg.conversation) {
        return msg.conversation;
      }

      // Mensagem estendida
      if (msg.extendedTextMessage?.text) {
        return msg.extendedTextMessage.text;
      }

      // Mensagem de imagem com caption
      if (msg.imageMessage?.caption) {
        return `[Imagem] ${msg.imageMessage.caption}`;
      }

      // Mensagem de vídeo com caption
      if (msg.videoMessage?.caption) {
        return `[Vídeo] ${msg.videoMessage.caption}`;
      }

      // Mensagem de documento
      if (msg.documentMessage) {
        return `[Documento] ${msg.documentMessage.fileName || 'Arquivo'}`;
      }

      // Mensagem de áudio (será processada separadamente)
      if (msg.audioMessage) {
        return '[Mensagem de áudio]';
      }

      // Mensagem de sticker
      if (msg.stickerMessage) {
        return '[Sticker]';
      }

      // Mensagem de localização
      if (msg.locationMessage) {
        return `[Localização] ${msg.locationMessage.name || 'Localização compartilhada'}`;
      }

      return null;
    } catch (error) {
      logger.error('Erro ao extrair conteúdo da mensagem:', error);
      return null;
    }
  }

  async processAudioMessage(
    message: proto.IWebMessageInfo,
    socket: any,
    currentUser: any
  ) {
    try {
      if (!message.message?.audioMessage || !currentUser) return;

      const audioMessage = message.message.audioMessage;
      
      // Baixar áudio
      const audioBuffer = await socket.downloadMediaMessage(message);
      
      if (audioBuffer) {
        // Transcrever áudio
        const transcript = await AudioService.processAudioMessage(
          audioBuffer,
          message.key.id || 'unknown'
        );

        if (transcript) {
          logger.info(`🎤 Áudio transcrito: ${transcript}`);
          
          // Processar como mensagem de texto
          const fakeTextMessage = {
            ...message,
            message: {
              conversation: transcript
            }
          };
          
          await this.processMessage(fakeTextMessage, socket, currentUser);
        } else {
          logger.warn('Não foi possível transcrever o áudio');
        }
      }
    } catch (error) {
      logger.error('Erro ao processar mensagem de áudio:', error);
    }
  }
}
