
import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import http from 'http';
import WhatsAppService from '../services/WhatsAppService';
import DatabaseService from '../config/database';
import AIService from '../services/AIService';
import AudioService from '../services/AudioService';
import logger, { getLogHistory, clearLogHistory } from '../utils/logger';

const router = express.Router();
let io: Server;

// Função para broadcast de logs
export const broadcastLog = (log: any) => {
  if (io) {
    io.emit('log', log);
  }
};

// Configurar Socket.IO
export const setupSocketIO = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Cliente conectado: ${socket.id}`);
    
    // Enviar histórico de logs para cliente recém conectado
    const history = getLogHistory();
    socket.emit('log-history', history);

    socket.on('disconnect', () => {
      logger.info(`Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
};

// Status do bot
router.get('/api/status', async (req: Request, res: Response) => {
  try {
    const botConfig = await DatabaseService.getBotConfig();
    const status = WhatsAppService.getConnectionStatus();
    
    res.json({
      bot_status: botConfig?.bot_status || 'offline',
      is_connected: status.isConnected,
      current_user: status.currentUser,
      qr_code: botConfig?.last_qr_code,
      learning_enabled: botConfig?.learning_enabled || false,
      audio_enabled: botConfig?.audio_enabled || false,
      model_name: botConfig?.model_name || 'mixtral'
    });
  } catch (error) {
    logger.error('Erro ao obter status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Conectar bot
router.post('/api/connect', async (req: Request, res: Response) => {
  try {
    logger.info('🔄 Iniciando conexão do bot...');
    await WhatsAppService.initialize();
    res.json({ success: true, message: 'Conexão iniciada' });
  } catch (error) {
    logger.error('Erro ao conectar bot:', error);
    res.status(500).json({ error: 'Erro ao conectar bot' });
  }
});

// Desconectar bot
router.post('/api/disconnect', async (req: Request, res: Response) => {
  try {
    logger.info('📴 Desconectando bot...');
    await WhatsAppService.disconnect();
    res.json({ success: true, message: 'Bot desconectado' });
  } catch (error) {
    logger.error('Erro ao desconectar bot:', error);
    res.status(500).json({ error: 'Erro ao desconectar bot' });
  }
});

// Limpar sessão
router.post('/api/clear-session', async (req: Request, res: Response) => {
  try {
    logger.info('🧹 Limpando sessão...');
    await WhatsAppService.clearSession();
    res.json({ success: true, message: 'Sessão limpa' });
  } catch (error) {
    logger.error('Erro ao limpar sessão:', error);
    res.status(500).json({ error: 'Erro ao limpar sessão' });
  }
});

// Estatísticas de aprendizado
router.get('/api/learning/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const learningData = await DatabaseService.getUserLearningData(userId);
    
    if (!learningData) {
      return res.json({
        message_count: 0,
        vocabulary_size: 0,
        learning_progress: 0,
        conversation_patterns: {},
        style_analysis: {}
      });
    }
    
    res.json(learningData);
  } catch (error) {
    logger.error('Erro ao obter dados de aprendizado:', error);
    res.status(500).json({ error: 'Erro ao obter dados de aprendizado' });
  }
});

// Configurações do bot
router.put('/api/config', async (req: Request, res: Response) => {
  try {
    const { learning_enabled, audio_enabled, model_name } = req.body;
    
    // Atualizar configurações no banco (implementar se necessário)
    logger.info('Configurações atualizadas:', { learning_enabled, audio_enabled, model_name });
    
    res.json({ success: true, message: 'Configurações atualizadas' });
  } catch (error) {
    logger.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

// Testar serviços
router.get('/api/services/status', async (req: Request, res: Response) => {
  try {
    const [aiAvailable, whisperAvailable] = await Promise.all([
      AIService.isServiceAvailable(),
      AudioService.isWhisperAvailable()
    ]);
    
    res.json({
      ai_service: aiAvailable,
      whisper_service: whisperAvailable,
      lm_studio_url: process.env.LM_STUDIO_URL || 'http://localhost:1234',
      model: process.env.LM_STUDIO_MODEL || 'mixtral'
    });
  } catch (error) {
    logger.error('Erro ao verificar serviços:', error);
    res.status(500).json({ error: 'Erro ao verificar serviços' });
  }
});

// Logs do sistema
router.get('/api/logs', (req: Request, res: Response) => {
  try {
    const logs = getLogHistory();
    res.json(logs);
  } catch (error) {
    logger.error('Erro ao obter logs:', error);
    res.status(500).json({ error: 'Erro ao obter logs' });
  }
});

// Limpar logs
router.delete('/api/logs', (req: Request, res: Response) => {
  try {
    clearLogHistory();
    res.json({ success: true, message: 'Logs limpos' });
  } catch (error) {
    logger.error('Erro ao limpar logs:', error);
    res.status(500).json({ error: 'Erro ao limpar logs' });
  }
});

// Mensagens recentes
router.get('/api/messages/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const messages = await DatabaseService.getRecentMessages(userId, limit);
    res.json(messages);
  } catch (error) {
    logger.error('Erro ao obter mensagens:', error);
    res.status(500).json({ error: 'Erro ao obter mensagens' });
  }
});

export default router;
