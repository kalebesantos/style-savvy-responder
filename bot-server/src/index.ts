
import dotenv from 'dotenv';
import logger from './utils/logger';
import WhatsAppService from './services/WhatsAppService';
import AIService from './services/AIService';
import AudioService from './services/AudioService';

// Load environment variables
dotenv.config();

class BotServer {
  async start() {
    try {
      logger.info('🚀 Starting WhatsApp AI Bot Server...');

      // Check dependencies
      await this.checkDependencies();

      // Initialize WhatsApp service
      await WhatsAppService.initialize();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      logger.info('✅ Bot server started successfully!');
      logger.info('📱 Scan the QR code to connect WhatsApp');
      
    } catch (error) {
      logger.error('❌ Failed to start bot server:', error);
      process.exit(1);
    }
  }

  private async checkDependencies() {
    logger.info('🔍 Checking dependencies...');

    // Check LM Studio availability
    const isLMStudioAvailable = await AIService.isServiceAvailable();
    if (isLMStudioAvailable) {
      logger.info('✅ LM Studio is available');
    } else {
      logger.warn('⚠️  LM Studio not available - AI responses may not work');
    }

    // Check Whisper availability
    const isWhisperAvailable = await AudioService.isWhisperAvailable();
    if (isWhisperAvailable) {
      logger.info('✅ Whisper is available');
    } else {
      logger.warn('⚠️  Whisper not available - audio transcription disabled');
    }

    // Check environment variables
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      logger.error(`❌ Missing environment variables: ${missingEnvVars.join(', ')}`);
      throw new Error('Missing required environment variables');
    }

    logger.info('✅ All dependencies checked');
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      logger.info(`📴 Received ${signal}, shutting down gracefully...`);
      
      try {
        await WhatsAppService.disconnect();
        logger.info('✅ WhatsApp service disconnected');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// Start the server
const server = new BotServer();
server.start();
