
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal as TerminalIcon, X, Minus, Wifi, WifiOff } from 'lucide-react';
import { useBotLogs } from '@/hooks/useBotLogs';

const Terminal = () => {
  const { logs, isConnected, clearLogs } = useBotLogs();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll para o final
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      case 'debug': return 'text-gray-400';
      default: return 'text-white';
    }
  };

  if (!isVisible) return null;

  return (
    <Card className={`fixed bottom-4 right-4 w-96 z-50 bg-black border-gray-700 ${isMinimized ? 'h-12' : 'h-80'} transition-all duration-300`}>
      <CardHeader className="pb-2 px-4 py-2 bg-gray-800 rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <TerminalIcon className="w-4 h-4" />
            Bot Server Logs
            {isConnected ? (
              <Wifi className="w-3 h-3 text-green-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-400" />
            )}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              onClick={() => setIsVisible(false)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="p-0">
          <ScrollArea className="h-64" ref={scrollRef}>
            <div className="p-3 space-y-1 font-mono text-xs">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-gray-500 flex-shrink-0">
                    [{log.timestamp}]
                  </span>
                  <span className={`${getLevelColor(log.level)} flex-shrink-0 uppercase`}>
                    {log.level}:
                  </span>
                  <span className="text-gray-300 break-words">
                    {log.message}
                  </span>
                </div>
              ))}
              
              {logs.length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  Aguardando logs...
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-2 border-t border-gray-700 bg-gray-900 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearLogs}
              className="flex-1 text-xs text-gray-400 border-gray-600 hover:bg-gray-800"
            >
              Limpar
            </Button>
            <div className="flex items-center text-xs">
              <span className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span className="text-gray-400">
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default Terminal;
