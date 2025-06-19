import makeWASocket, { 
  ConnectionState, 
  DisconnectReason, 
  useMultiFileAuthState,
  downloadMediaMessage,
  proto
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode-terminal';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';
import DatabaseService from '../config/database';
import AIService from './AIService';
import AudioService from './AudioService';

export class WhatsAppService {
  private socket: ReturnType<typeof makeWASocket> | null = null;
  private isConnected = false;
  private currentUser: any = null;
  private sessionPath = path.join(process.cwd(), 'sessions');

  constructor() {
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
    }
  }

  async initialize() {
    try {
      logger.info('Initializing WhatsApp service...');
      await DatabaseService.updateBotStatus('connecting');
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
      this.socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: logger.child({ module: 'baileys' }),
        browser: ['WhatsApp AI Bot', 'Chrome', '1.0.0']
      });
      this.setupEventHandlers(saveCreds);
    } catch (error) {
      logger.error('Error initializing WhatsApp service:', error);
      await DatabaseService.updateBotStatus('error');
    }
  }

  private setupEventHandlers(saveCreds: () => Promise<void>) {
    if (!this.socket) return;

    this.socket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        logger.info('QR Code generated');
        QRCode.generate(qr, { small: true });
        await DatabaseService.updateBotStatus('connecting', qr);
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          logger.info('Connection closed, reconnecting...');
          await this.initialize();
        } else {
          logger.info('Logged out, stopping bot');
          await DatabaseService.updateBotStatus('offline');
          this.isConnected = false;
          this.currentUser = null;
        }
      } else if (connection === 'open') {
        logger.info('WhatsApp connected successfully!');
        this.isConnected = true;
        await DatabaseService.updateBotStatus('online');

        if (!this.socket) {
          logger.error('Socket não inicializado');
          return;
        }

        const userInfo = this.socket.user;
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
    });

    this.socket.ev.on('creds.update', saveCreds);

    this.socket.ev.on('messages.upsert', async (messageUpdate: any) => {
      const { messages, type } = messageUpdate;
      if (type === 'notify') {
        for (const message of messages) {
          await this.handleIncomingMessage(message);
        }
      }
    });
  }

  private async handleIncomingMessage(message: proto.IWebMessageInfo) {
    try {
      if (!message.message || !this.currentUser) return;

      const messageKey = message.key;
      const isFromMe = messageKey.fromMe;
      const remoteJid = messageKey.remoteJid;

      if (isFromMe || remoteJid?.includes('@g.us')) return;

      let messageContent = '';
      let audioTranscript = '';

      if ('conversation' in message.message && message.message.conversation) {
        messageContent = message.message.conversation;
      } else if ('extendedTextMessage' in message.message && message.message.extendedTextMessage?.text) {
        messageContent = message.message.extendedTextMessage.text;
      } else if ('audioMessage' in message.message) {
        try {
          const audioBuffer = await downloadMediaMessage(
            message,
            'buffer',
            {},
            {
              logger: logger.child({ module: 'media-download' }),
              reuploadRequest: this.socket!.updateMediaMessage
            }
          );
          audioTranscript = await AudioService.transcribeAudio(audioBuffer as Buffer);
          messageContent = audioTranscript;
          logger.info(`Audio transcribed: ${audioTranscript}`);
        } catch (error) {
          logger.error('Error processing audio message:', error);
          messageContent = '[Áudio não pôde ser processado]';
        }
      }

      if (!messageContent.trim()) return;

      await DatabaseService.saveMessage({
        user_id: this.currentUser.id,
        content: messageContent,
        message_type: 'incoming',
        audio_transcript: audioTranscript || undefined,
        timestamp: new Date(Number(message.messageTimestamp) * 1000).toISOString(),
        processed: false
      });

      await this.generateAndSendResponse(messageContent, remoteJid!);

    } catch (error) {
      logger.error('Error handling incoming message:', error);
    }
  }

  private async generateAndSendResponse(messageContent: string, chatId: string) {
    if (!this.currentUser || !this.socket) return;

    try {
      const learningData = await DatabaseService.getUserLearningData(this.currentUser.id);
      const conversationHistory: string[] = [];

      const aiResponse = await AIService.generateResponse(
        messageContent,
        learningData || undefined,
        conversationHistory
      );

      await this.socket.sendMessage(chatId, { text: aiResponse.text });

      await DatabaseService.saveMessage({
        user_id: this.currentUser.id,
        content: aiResponse.text,
        message_type: 'outgoing',
        timestamp: new Date().toISOString(),
        processed: true
      });

      logger.info(`Response sent: ${aiResponse.text.substring(0, 50)}...`);

    } catch (error) {
      logger.error('Error generating/sending response:', error);
      try {
        await this.socket.sendMessage(chatId, { 
          text: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.' 
        });
      } catch (fallbackError) {
        logger.error('Error sending fallback message:', fallbackError);
      }
    }
  }

  async disconnect() {
    if (this.socket) {
      await this.socket.logout();
      this.isConnected = false;
      this.currentUser = null;
      await DatabaseService.updateBotStatus('offline');
      logger.info('WhatsApp disconnected');
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      currentUser: this.currentUser
    };
  }
}

export default new WhatsAppService();
