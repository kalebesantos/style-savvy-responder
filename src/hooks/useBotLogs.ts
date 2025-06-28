
import { useState, useEffect, useRef } from 'react';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
}

export const useBotLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (level: LogEntry['level'], message: string) => {
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level,
      message
    };
    setLogs(prev => [...prev.slice(-99), newLog]);
  };

  const connectToLogs = () => {
    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      eventSourceRef.current = new EventSource('http://localhost:3001/api/logs/stream');
      
      eventSourceRef.current.onopen = () => {
        setIsConnected(true);
        addLog('info', '🔗 Conectado aos logs do servidor');
        
        // Clear any reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const logData = JSON.parse(event.data);
          setLogs(prev => [...prev.slice(-99), logData]);
        } catch (error) {
          console.error('Erro ao processar log:', error);
        }
      };

      eventSourceRef.current.onerror = () => {
        setIsConnected(false);
        addLog('error', '❌ Conexão com logs perdida');
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          addLog('info', '🔄 Tentando reconectar...');
          connectToLogs();
        }, 5000);
      };

    } catch (error) {
      setIsConnected(false);
      addLog('error', '❌ Erro ao conectar com servidor de logs');
    }
  };

  useEffect(() => {
    // Initial logs
    addLog('info', '🚀 Iniciando terminal...');
    addLog('info', '🔍 Tentando conectar com servidor...');

    // Start connection
    connectToLogs();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  const reconnect = () => {
    addLog('info', '🔄 Reconectando manualmente...');
    connectToLogs();
  };

  return { logs, isConnected, clearLogs, reconnect };
};
