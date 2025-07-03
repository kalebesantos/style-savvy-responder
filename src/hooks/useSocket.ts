
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);

  useEffect(() => {
    // Evita múltiplas conexões
    if (isConnectingRef.current) return;
    
    isConnectingRef.current = true;
    
    const connectSocket = () => {
      try {
        const newSocket = io('http://localhost:3001', {
          timeout: 10000,
          reconnection: true,
          reconnectionDelay: 5000,
          reconnectionAttempts: 3,
          forceNew: false,
        });

        newSocket.on('connect', () => {
          console.log('Socket conectado');
          setIsConnected(true);
          setSocket(newSocket);
          
          // Limpa timeout de reconexão se existir
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        });

        newSocket.on('disconnect', () => {
          console.log('Socket desconectado');
          setIsConnected(false);
          
          // Reagenda reconexão apenas se não houver uma pendente
          if (!reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('Tentando reconectar socket...');
              reconnectTimeoutRef.current = null;
              isConnectingRef.current = false;
              connectSocket();
            }, 10000); // Reconecta após 10 segundos
          }
        });

        newSocket.on('log', (log: any) => {
          setLogs(prev => {
            // Evita logs duplicados
            const lastLog = prev[prev.length - 1];
            if (lastLog && lastLog.timestamp === log.timestamp && lastLog.message === log.message) {
              return prev;
            }
            return [...prev.slice(-99), log];
          });
        });

        newSocket.on('log-history', (history: any[]) => {
          setLogs(history || []);
        });

        newSocket.on('connect_error', (error: any) => {
          console.error('Erro de conexão socket:', error);
          setIsConnected(false);
        });

      } catch (error) {
        console.error('Erro ao conectar socket:', error);
        setIsConnected(false);
        isConnectingRef.current = false;
      }
    };

    connectSocket();

    return () => {
      isConnectingRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (socket) {
        socket.removeAllListeners();
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, []); // Remove dependências para evitar reconexões desnecessárias

  return { socket, logs, isConnected };
};
