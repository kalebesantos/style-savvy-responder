
import pino from 'pino';

// Import broadcast function (will be set after routes are loaded)
let broadcastLog: ((level: 'info' | 'error' | 'warn' | 'debug', message: string) => void) | null = null;

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  },
  hooks: {
    logMethod(inputArgs, method) {
      // Extract log level and message
      const level = method.name as 'info' | 'error' | 'warn' | 'debug';
      const message = inputArgs[0];
      
      // Broadcast to SSE clients if function is available
      if (broadcastLog && typeof message === 'string') {
        broadcastLog(level, message);
      }
      
      return method.apply(this, inputArgs);
    }
  }
});

// Function to set the broadcast function
export const setBroadcastFunction = (fn: (level: 'info' | 'error' | 'warn' | 'debug', message: string) => void) => {
  broadcastLog = fn;
};

export default logger;
