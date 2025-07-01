
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
      logger.info('Inicializando conexão WhatsApp...');
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
      logger.error('Erro ao inicializar conexão WhatsApp:', error);
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
        logger.info('QR Code gerado - atualizando banco de dados');
        QRCode.generate(qr, { small: true });
        await DatabaseService.updateBotStatus('connecting', qr);
        logger.info('QR Code salvo no banco de dados');
        onQRCode(qr);
      }

      if (connection === 'close') {
        await this.handleDisconnection(lastDisconnect, onQRCode, onConnectionUpdate);
      } else if (connection === 'open') {
        logger.info('✅ WhatsApp conectado com sucesso!');
        this.reconnectAttempts = 0;
        await DatabaseService.updateBotStatus('online', undefined);
        onConnectionUpdate(update);
      } else if (connection === 'connecting') {
        logger.info('🔄 Conectando ao WhatsApp...');
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

    logger.info(`Conexão fechada. Código de status: ${statusCode}`);

    if (statusCode === DisconnectReason.loggedOut) {
      logger.info('📱 Deslogado do WhatsApp. Escaneie o QR code novamente.');
      await this.clearSession();
      await DatabaseService.updateBotStatus('offline');
      return false;
    }

    if (statusCode === DisconnectReason.restartRequired) {
      logger.info('🔄 Reinicialização necessária, reconectando...');
      await this.reconnect(onQRCode, onConnectionUpdate);
      return true;
    }

    if (statusCode === DisconnectReason.timedOut && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.info(`⏰ Conexão expirou. Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      await this.reconnect(onQRCode, onConnectionUpdate);
      return true;
    }

    if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.info(`🔄 Conexão perdida. Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      await this.reconnect(onQRCode, onConnectionUpdate);
      return true;
    }

    logger.error('❌ Máximo de tentativas de reconexão atingido ou logout detectado');
    await DatabaseService.updateBotStatus('offline');
    return false;
  }

  private async reconnect(onQRCode: (qr: string) => void, onConnectionUpdate: (update: Partial<ConnectionState>) => void) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      await this.initialize(onQRCode, onConnectionUpdate);
    } catch (error) {
      logger.error('Falha na reconexão:', error);
      await DatabaseService.updateBotStatus('error');
    }
  }

  async clearSession() {
    try {
      logger.info('🧹 Limpando sessão do WhatsApp...');
      
      if (fs.existsSync(this.sessionPath)) {
        const files = fs.readdirSync(this.sessionPath);
        for (const file of files) {
          const filePath = path.join(this.sessionPath, file);
          fs.unlinkSync(filePath);
        }
        logger.info('✅ Sessão limpa com sucesso');
      }
      
      await DatabaseService.updateBotStatus('offline', undefined);
      await DatabaseService.setCurrentUser(undefined);
    } catch (error) {
      logger.error('Erro ao limpar sessão:', error);
    }
  }

  async disconnect() {
    try {
      if (this.socket) {
        await this.socket.logout();
        this.socket = null;
        logger.info('📴 WhatsApp desconectado');
      }
      await DatabaseService.updateBotStatus('offline', undefined);
    } catch (error) {
      logger.error('Erro durante desconexão:', error);
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.user ? true : false;
  }
}
