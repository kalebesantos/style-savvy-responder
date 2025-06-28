import makeWASocket, { 
  ConnectionState, 
  DisconnectReason, 
  useMultiFileAuthState,
  proto
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode-terminal';
import path from 'path';
import fs from 'fs';
import logger from '../../utils/logger';
import DatabaseService from '../../config/database';

export class ConnectionManager {
  private socket: ReturnType<typeof makeWASocket> | null = null;
  private sessionPath = path.join(process.cwd(), 'sessions');
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor() {
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
    }
  }

  async initialize(onQRCode: (qr: string) => void, onConnectionUpdate: (update: Partial<ConnectionState>) => void) {
    try {
      logger.info('Initializing WhatsApp connection...');
      await DatabaseService.updateBotStatus('connecting');
      
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
      
      this.socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: logger.child({ module: 'baileys' }),
        browser: ['WhatsApp AI Bot', 'Chrome', '1.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: true,
      });

      this.setupConnectionHandlers(onQRCode, onConnectionUpdate, saveCreds);
      
      return this.socket;
    } catch (error) {
      logger.error('Error initializing WhatsApp connection:', error);
      await DatabaseService.updateBotStatus('error');
      throw error;
    }
  }

  private setupConnectionHandlers(
    onQRCode: (qr: string) => void, 
    onConnectionUpdate: (update: Partial<ConnectionState>) => void,
    saveCreds: () => Promise<void>
  ) {
    if (!this.socket) return;

    this.socket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        logger.info('QR Code generated - updating database');
        QRCode.generate(qr, { small: true });
        // Garantir que o QR code seja salvo no banco de dados
        await DatabaseService.updateBotStatus('connecting', qr);
        logger.info('QR Code saved to database');
        onQRCode(qr);
      }

      if (connection === 'close') {
        await this.handleDisconnection(lastDisconnect, onQRCode, onConnectionUpdate);
      } else if (connection === 'open') {
        logger.info('✅ WhatsApp connected successfully!');
        this.reconnectAttempts = 0;
        // Limpar QR code quando conectado
        await DatabaseService.updateBotStatus('online', undefined);
        onConnectionUpdate(update);
      } else if (connection === 'connecting') {
        logger.info('🔄 Connecting to WhatsApp...');
        await DatabaseService.updateBotStatus('connecting');
      }
    });

    this.socket.ev.on('creds.update', saveCreds);
  }

  private async handleDisconnection(
    lastDisconnect: any,
    onQRCode: (qr: string) => void,
    onConnectionUpdate: (update: Partial<ConnectionState>) => void
  ) {
    const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

    logger.info(`Connection closed. Status code: ${statusCode}`);

    if (statusCode === DisconnectReason.loggedOut) {
      logger.info('📱 Logged out from WhatsApp. Please scan QR code again.');
      await this.clearSession();
      await DatabaseService.updateBotStatus('offline');
      return false;
    }

    if (statusCode === DisconnectReason.restartRequired) {
      logger.info('🔄 Restart required, reconnecting...');
      await this.reconnect(onQRCode, onConnectionUpdate);
      return true;
    }

    if (statusCode === DisconnectReason.timedOut && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.info(`⏰ Connection timed out. Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      await this.reconnect(onQRCode, onConnectionUpdate);
      return true;
    }

    if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.info(`🔄 Connection lost. Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      await this.reconnect(onQRCode, onConnectionUpdate);
      return true;
    }

    logger.error('❌ Max reconnection attempts reached or logout detected');
    await DatabaseService.updateBotStatus('offline');
    return false;
  }

  private async reconnect(onQRCode: (qr: string) => void, onConnectionUpdate: (update: Partial<ConnectionState>) => void) {
    // Wait before reconnecting
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      await this.initialize(onQRCode, onConnectionUpdate);
    } catch (error) {
      logger.error('Reconnection failed:', error);
      await DatabaseService.updateBotStatus('error');
    }
  }

  async clearSession() {
    try {
      logger.info('🧹 Clearing WhatsApp session...');
      
      if (fs.existsSync(this.sessionPath)) {
        const files = fs.readdirSync(this.sessionPath);
        for (const file of files) {
          const filePath = path.join(this.sessionPath, file);
          fs.unlinkSync(filePath);
        }
        logger.info('✅ Session cleared successfully');
      }
      
      // Limpar dados do banco também
      await DatabaseService.updateBotStatus('offline', undefined);
      await DatabaseService.setCurrentUser(undefined);
    } catch (error) {
      logger.error('Error clearing session:', error);
    }
  }

  async disconnect() {
    try {
      if (this.socket) {
        await this.socket.logout();
        this.socket = null;
        logger.info('📴 WhatsApp disconnected');
      }
      await DatabaseService.updateBotStatus('offline', undefined);
    } catch (error) {
      logger.error('Error during disconnect:', error);
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.user ? true : false;
  }
}
