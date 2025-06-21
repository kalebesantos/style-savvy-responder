
import { useState, useEffect } from 'react';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
}

export const useBotLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectToLogs = () => {
      try {
        // Tentar conectar com os logs do servidor
        eventSource = new EventSource('http://localhost:3001/api/logs/stream');
        
        eventSource.onopen = () => {
          setIsConnected(true);
          addLog('info', '🔗 Conectado aos logs do servidor');
        };

        eventSource.onmessage = (event) => {
          try {
            const logData = JSON.parse(event.data);
            setLogs(prev => [...prev.slice(-99), logData]);
          } catch (error) {
            console.error('Erro ao processar log:', error);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          addLog('error', '❌ Conexão com logs perdida');
        };

      } catch (error) {
        setIsConnected(false);
        addLog('error', '❌ Erro ao conectar com servidor de logs');
      }
    };

    const addLog = (level: LogEntry['level'], message: string) => {
      const newLog: LogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        level,
        message
      };
      setLogs(prev => [...prev.slice(-99), newLog]);
    };

    // Logs iniciais simulados
    addLog('info', '🚀 Iniciando terminal...');
    addLog('info', '🔍 Tentando conectar com servidor...');

    // Tentar conectar
    connectToLogs();

    // Fallback para logs simulados se não conseguir conectar
    const fallbackInterval = setTimeout(() => {
      if (!isConnected) {
        addLog('warn', '⚠️  Usando logs simulados (servidor não conectado)');
        
        const simulateInterval = setInterval(() => {
          const randomLogs = [
            { level: 'info' as const, message: '📊 Health check simulado' },
            { level: 'debug' as const, message: '🔍 Verificando conexão...' },
            { level: 'warn' as const, message: '⚠️  Modo offline - logs simulados' }
          ];
          
          const randomLog = randomLogs[Math.floor(Math.random() * randomLogs.length)];
          addLog(randomLog.level, randomLog.message);
        }, 10000);

        return () => clearInterval(simulateInterval);
      }
    }, 3000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearTimeout(fallbackInterval);
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  return { logs, isConnected, clearLogs };
};
