
import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const socketRef = useRef<any>(null);

  // Estabilizar função de adicionar logs
  const addLog = useCallback((log: any) => {
    setLogs(prev => {
      // Evita logs duplicados mais rigorosamente
      const isDuplicate = prev.some(existingLog => 
        existingLog.timestamp === log.timestamp && 
        existingLog.message === log.message &&
        existingLog.level === log.level
      );
      
      if (isDuplicate) return prev;
      
      // Manter apenas os últimos 50 logs para performance
      const newLogs = [...prev, log];
      return newLogs.slice(-50);
    });
  }, []);

  useEffect(() => {
    // Evita múltiplas conexões
    if (isConnectingRef.current || socketRef.current) return;
    
    isConnectingRef.current = true;
    
    const connectSocket = () => {
      try {
        const newSocket = io('http://localhost:3001', {
          timeout: 15000, // Timeout maior
          reconnection: true,
          reconnectionDelay: 10000, // 10 segundos entre tentativas
          reconnectionAttempts: 2, // Apenas 2 tentativas
          forceNew: true,
          autoConnect: true,
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
          console.log('Socket conectado');
          setIsConnected(true);
          setSocket(newSocket);
          
          // Limpa timeout de reconexão
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        });

        newSocket.on('disconnect', (reason) => {
          console.log('Socket desconectado:', reason);
          setIsConnected(false);
          
          // Só reconecta se não foi desconexão manual
          if (reason !== 'io client disconnect' && !reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('Tentando reconectar socket...');
              reconnectTimeoutRef.current = null;
              isConnectingRef.current = false;
              socketRef.current = null;
              connectSocket();
            }, 15000); // 15 segundos
          }
        });

        newSocket.on('log', addLog);

        newSocket.on('log-history', (history: any[]) => {
          if (Array.isArray(history) && history.length > 0) {
            setLogs(history.slice(-50)); // Últimos 50 logs
          }
        });

        newSocket.on('connect_error', (error: any) => {
          console.error('Erro de conexão socket:', error);
          setIsConnected(false);
          isConnectingRef.current = false;
        });

        newSocket.on('reconnect_failed', () => {
          console.error('Falha na reconexão do socket');
          setIsConnected(false);
          isConnectingRef.current = false;
        });

      } catch (error) {
        console.error('Erro ao conectar socket:', error);
        setIsConnected(false);
        isConnectingRef.current = false;
        socketRef.current = null;
      }
    };

    connectSocket();

    return () => {
      isConnectingRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, []); // Sem dependências para evitar reconexões

  return { socket, logs, isConnected };
};
