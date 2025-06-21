
import express, { Request, Response } from 'express';
import cors from 'cors';
import WhatsAppService from '../services/WhatsAppService';
import DatabaseService from '../config/database';
import logger from '../utils/logger';

const router = express.Router();

// Bot control routes
router.post('/api/bot/start', async (req: Request, res: Response) => {
  try {
    logger.info('Starting bot via API...');
    
    // Reinitialize WhatsApp service
    await WhatsAppService.initialize();
    
    res.json({ 
      success: true, 
      message: 'Bot iniciado com sucesso' 
    });
  } catch (error) {
    logger.error('Error starting bot via API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao iniciar o bot' 
    });
  }
});

router.post('/api/bot/stop', async (req: Request, res: Response) => {
  try {
    logger.info('Stopping bot via API...');
    
    await WhatsAppService.disconnect();
    
    res.json({ 
      success: true, 
      message: 'Bot parado com sucesso' 
    });
  } catch (error) {
    logger.error('Error stopping bot via API:', error);
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
    
    await WhatsAppService.clearSession();
    
    res.json({ 
      success: true, 
      message: 'Sessão limpa com sucesso' 
    });
  } catch (error) {
    logger.error('Error clearing session via API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao limpar sessão' 
    });
  }
});

export default router;
