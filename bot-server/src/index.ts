
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import logger from './utils/logger';
import WhatsAppService from './services/WhatsAppService';
import AIService from './services/AIService';
import AudioService from './services/AudioService';
import apiRoutes from './api/routes';

// Load environment variables
dotenv.config();

class BotServer {
  private app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    // CORS para permitir requisições do frontend
    this.app.use(cors({
      origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite e React dev servers
      credentials: true
    }));

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API routes
    this.app.use(apiRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  async start() {
    try {
      logger.info('🚀 Starting WhatsApp AI Bot Server...');
      logger.info('================================================');

      // Check dependencies
      await this.checkDependencies();

      // Start HTTP server
      const PORT = process.env.PORT || 3001;
      this.server = this.app.listen(PORT, () => {
        logger.info(`🌐 API server running on port ${PORT}`);
      });

      // Initialize WhatsApp service
      await WhatsAppService.initialize();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      logger.info('✅ Bot server started successfully!');
      logger.info('📱 Waiting for WhatsApp connection...');
      logger.info('💡 If connection fails, try clearing session with: npm run clear-session');
      logger.info(`🔗 API available at: http://localhost:${PORT}`);
      
    } catch (error) {
      logger.error('❌ Failed to start bot server:', error);
      process.exit(1);
    }
  }

  private async checkDependencies() {
    logger.info('🔍 Checking dependencies...');

    // Check LM Studio availability
    try {
      const isLMStudioAvailable = await AIService.isServiceAvailable();
      if (isLMStudioAvailable) {
        logger.info('✅ LM Studio is available');
      } else {
        logger.warn('⚠️  LM Studio not available - AI responses may not work');
        logger.info('💡 Start LM Studio and load a model to enable AI responses');
      }
    } catch (error) {
      logger.warn('⚠️  Could not check LM Studio availability');
    }

    // Check Whisper availability
    try {
      const isWhisperAvailable = await AudioService.isWhisperAvailable();
      if (isWhisperAvailable) {
        logger.info('✅ Whisper is available');
      } else {
        logger.warn('⚠️  Whisper not available - audio transcription disabled');
        logger.info('💡 Install Whisper with: pip install openai-whisper');
      }
    } catch (error) {
      logger.warn('⚠️  Could not check Whisper availability');
    }

    // Check environment variables
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      logger.error(`❌ Missing environment variables: ${missingEnvVars.join(', ')}`);
      throw new Error('Missing required environment variables');
    }

    logger.info('✅ All dependencies checked');
    logger.info('================================================');
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      logger.info(`📴 Received ${signal}, shutting down gracefully...`);
      
      try {
        if (this.server) {
          this.server.close();
        }
        await WhatsAppService.disconnect();
        logger.info('✅ Server shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }
}

// Start the server
const server = new BotServer();
server.start();
