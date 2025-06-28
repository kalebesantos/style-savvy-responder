
import express, { Request, Response } from 'express';
import cors from 'cors';
import WhatsAppService from '../services/WhatsAppService';
import DatabaseService from '../config/database';
import logger from '../utils/logger';

const router = express.Router();

// Store SSE connections
const sseConnections: Response[] = [];

// Bot control routes
router.post('/api/bot/start', async (req: Request, res: Response) => {
  try {
    logger.info('Starting bot via API...');
    
    // Broadcast to SSE clients
    broadcastLog('info', '🚀 Iniciando bot via API...');
    
    // Reinitialize WhatsApp service
    await WhatsAppService.initialize();
    
    broadcastLog('info', '✅ Bot iniciado com sucesso');
    
    res.json({ 
      success: true, 
      message: 'Bot iniciado com sucesso' 
    });
  } catch (error) {
    logger.error('Error starting bot via API:', error);
    broadcastLog('error', '❌ Erro ao iniciar o bot');
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao iniciar o bot' 
    });
  }
});

router.post('/api/bot/stop', async (req: Request, res: Response) => {
  try {
    logger.info('Stopping bot via API...');
    broadcastLog('info', '🛑 Parando bot via API...');
    
    await WhatsAppService.disconnect();
    
    broadcastLog('info', '✅ Bot parado com sucesso');
    
    res.json({ 
      success: true, 
      message: 'Bot parado com sucesso' 
    });
  } catch (error) {
    logger.error('Error stopping bot via API:', error);
    broadcastLog('error', '❌ Erro ao parar o bot');
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao parar o bot' 
    });
  }
});

router.get('/api/bot/status', async (req: Request, res: Response) => {
  try {
    const status = WhatsAppService.getConnectionStatus();
    const botConfig = await DatabaseService.getBotConfig();
    
    res.json({
      status: botConfig?.bot_status || 'offline',
      qrCode: botConfig?.last_qr_code,
      currentUser: status.currentUser
    });
  } catch (error) {
    logger.error('Error getting bot status via API:', error);
    res.status(500).json({
      status: 'error'
    });
  }
});

router.post('/api/bot/clear-session', async (req: Request, res: Response) => {
  try {
    logger.info('Clearing session via API...');
    broadcastLog('info', '🧹 Limpando sessão via API...');
    
    await WhatsAppService.clearSession();
    
    broadcastLog('info', '✅ Sessão limpa com sucesso');
    
    res.json({ 
      success: true, 
      message: 'Sessão limpa com sucesso' 
    });
  } catch (error) {
    logger.error('Error clearing session via API:', error);
    broadcastLog('error', '❌ Erro ao limpar sessão');
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao limpar sessão' 
    });
  }
});

// SSE endpoint for real-time logs
router.get('/api/logs/stream', (req: Request, res: Response) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Add connection to list
  sseConnections.push(res);

  // Send initial connection message
  const welcomeLog = {
    timestamp: new Date().toLocaleTimeString(),
    level: 'info',
    message: '🔗 Conectado ao stream de logs do servidor'
  };
  
  res.write(`data: ${JSON.stringify(welcomeLog)}\n\n`);

  // Remove connection when client disconnects
  req.on('close', () => {
    const index = sseConnections.indexOf(res);
    if (index !== -1) {
      sseConnections.splice(index, 1);
    }
  });
});

// Function to broadcast logs to all SSE connections
function broadcastLog(level: 'info' | 'error' | 'warn' | 'debug', message: string) {
  const logData = {
    timestamp: new Date().toLocaleTimeString(),
    level,
    message
  };

  // Send to all SSE connections
  sseConnections.forEach((connection, index) => {
    try {
      connection.write(`data: ${JSON.stringify(logData)}\n\n`);
    } catch (error) {
      // Remove dead connections
      sseConnections.splice(index, 1);
    }
  });
}

// Export the broadcast function for use in other modules
export { broadcastLog };

export default router;
