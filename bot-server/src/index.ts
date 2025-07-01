
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import fs from 'fs';
import path from 'path';
import logger, { setBroadcastFunction } from './utils/logger';
import WhatsAppService from './services/WhatsAppService';
import AIService from './services/AIService';
import AudioService from './services/AudioService';
import apiRoutes, { broadcastLog, setupSocketIO } from './api/routes';

// Carregar variáveis de ambiente
dotenv.config();

class BotServer {
  private app: express.Application;
  private server: http.Server;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.setupMiddleware();
    this.setupRoutes();
    
    // Configurar Socket.IO
    setupSocketIO(this.server);
    
    // Definir função de broadcast para logger
    setBroadcastFunction(broadcastLog);
  }

  private setupMiddleware() {
    // CORS para permitir requisições do frontend
    this.app.use(cors({
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true
    }));

    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'WhatsApp AI Bot Server'
      });
    });

    // API routes
    this.app.use(apiRoutes);

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({ error: 'Rota não encontrada' });
    });
  }

  async start() {
    try {
      logger.info('🚀 Iniciando WhatsApp AI Bot Server...');
      logger.info('================================================');

      // Criar diretórios necessários
      this.createDirectories();

      // Verificar dependências
      await this.checkDependencies();

      // Iniciar servidor HTTP
      const PORT = process.env.PORT || 3001;
      this.server.listen(PORT, () => {
        logger.info(`🌐 Servidor API rodando na porta ${PORT}`);
      });

      // Configurar encerramento gracioso
      this.setupGracefulShutdown();

      logger.info('✅ Servidor do bot iniciado com sucesso!');
      logger.info('📱 Aguardando conexão WhatsApp...');
      logger.info(`🔗 API disponível em: http://localhost:${PORT}`);
      logger.info('💡 Dica: Use /api/connect para iniciar a conexão do WhatsApp');
      logger.info('🤖 Dica: Certifique-se de que o LM Studio esteja rodando para respostas da IA');
      
    } catch (error) {
      logger.error('❌ Falha ao iniciar servidor do bot:', error);
      process.exit(1);
    }
  }

  private createDirectories() {
    const dirs = ['logs', 'sessions', 'temp'];
    dirs.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info(`📁 Diretório criado: ${dir}`);
      }
    });
  }

  private async checkDependencies() {
    logger.info('🔍 Verificando dependências...');

    // Verificar disponibilidade do LM Studio
    try {
      const isLMStudioAvailable = await AIService.isServiceAvailable();
      if (isLMStudioAvailable) {
        logger.info('✅ LM Studio está disponível');
      } else {
        logger.warn('⚠️  LM Studio não disponível - respostas da IA podem não funcionar');
        logger.info('💡 Inicie o LM Studio e carregue um modelo para habilitar respostas da IA');
      }
    } catch (error) {
      logger.warn('⚠️  Não foi possível verificar disponibilidade do LM Studio');
    }

    // Verificar disponibilidade do Whisper
    try {
      const isWhisperAvailable = await AudioService.isWhisperAvailable();
      if (isWhisperAvailable) {
        logger.info('✅ Whisper está disponível');
      } else {
        logger.warn('⚠️  Whisper não disponível - transcrição de áudio desabilitada');
        logger.info('💡 Instale o Whisper com: pip install openai-whisper');
      }
    } catch (error) {
      logger.warn('⚠️  Não foi possível verificar disponibilidade do Whisper');
    }

    // Verificar variáveis de ambiente
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      logger.error(`❌ Variáveis de ambiente faltando: ${missingEnvVars.join(', ')}`);
      throw new Error('Variáveis de ambiente necessárias não encontradas');
    }

    logger.info('✅ Todas as dependências verificadas');
    logger.info('================================================');
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      logger.info(`📴 Recebido ${signal}, encerrando graciosamente...`);
      
      try {
        if (this.server) {
          this.server.close();
        }
        await WhatsAppService.disconnect();
        logger.info('✅ Encerramento do servidor completo');
        process.exit(0);
      } catch (error) {
        logger.error('Erro durante encerramento:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Tratar exceções não capturadas
    process.on('uncaughtException', (error) => {
      logger.error('Exceção não capturada:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Rejeição não tratada em:', promise, 'razão:', reason);
      process.exit(1);
    });
  }
}

// Iniciar o servidor
const server = new BotServer();
server.start();
