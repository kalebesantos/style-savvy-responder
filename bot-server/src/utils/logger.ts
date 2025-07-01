
import winston from 'winston';

// Array para armazenar logs em memória para o frontend
let logHistory: any[] = [];
const MAX_LOG_HISTORY = 1000;

// Função para broadcast de logs (será definida pelo servidor)
let broadcastFunction: ((log: any) => void) | null = null;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'whatsapp-ai-bot' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      )
    })
  ],
});

// Interceptar logs para armazenar em memória e enviar para frontend
const originalLog = logger.log;
logger.log = function(level: any, message: any, meta?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: typeof level === 'string' ? level : level.level,
    message: typeof level === 'string' ? message : level.message,
    meta: typeof level === 'string' ? meta : level.meta || level
  };

  // Adicionar ao histórico
  logHistory.push(logEntry);
  if (logHistory.length > MAX_LOG_HISTORY) {
    logHistory = logHistory.slice(-MAX_LOG_HISTORY);
  }

  // Enviar para frontend se houver função de broadcast
  if (broadcastFunction) {
    broadcastFunction(logEntry);
  }

  // Chamar o log original
  return originalLog.call(this, level, message, meta);
};

// Função para definir a função de broadcast
export const setBroadcastFunction = (fn: (log: any) => void) => {
  broadcastFunction = fn;
};

// Função para obter o histórico de logs
export const getLogHistory = () => logHistory;

// Função para limpar o histórico de logs
export const clearLogHistory = () => {
  logHistory = [];
};

export default logger;
