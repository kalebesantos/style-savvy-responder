
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('log', (log: any) => {
      setLogs(prev => [...prev.slice(-99), log]);
    });

    newSocket.on('log-history', (history: any[]) => {
      setLogs(history);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, logs };
};
