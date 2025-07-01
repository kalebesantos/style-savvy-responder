
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Users, Activity, Smartphone, RefreshCw, Zap, Cpu } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import io from 'socket.io-client';

interface BotStatus {
  bot_status: 'online' | 'offline' | 'connecting' | 'error';
  is_connected: boolean;
  current_user?: {
    id: string;
    phone_number: string;
    display_name?: string;
  };
  qr_code?: string;
  learning_enabled: boolean;
  audio_enabled: boolean;
  model_name: string;
}

interface LearningData {
  message_count: number;
  vocabulary_size: number;
  learning_progress: number;
  conversation_patterns: Record<string, any>;
  style_analysis: Record<string, any>;
}

interface ServicesStatus {
  ai_service: boolean;
  whisper_service: boolean;
  lm_studio_url: string;
  model: string;
}

const Index = () => {
  const [socket, setSocket] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Conectar Socket.IO
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('log', (log: any) => {
      setLogs(prev => [...prev.slice(-99), log]);
    });

    newSocket.on('log-history', (history: any[]) => {
      setLogs(history);
    });

    // Return cleanup function properly
    return () => {
      newSocket.close();
    };
  }, []);

  // Status do bot
  const { data: botStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['bot-status'],
    queryFn: async (): Promise<BotStatus> => {
      const response = await fetch('http://localhost:3001/api/status');
      if (!response.ok) throw new Error('Erro ao obter status');
      return response.json();
    },
    refetchInterval: 2000
  });

  // Dados de aprendizado
  const { data: learningData } = useQuery({
    queryKey: ['learning-data', botStatus?.current_user?.id],
    queryFn: async (): Promise<LearningData> => {
      if (!botStatus?.current_user?.id) return {
        message_count: 0,
        vocabulary_size: 0,
        learning_progress: 0,
        conversation_patterns: {},
        style_analysis: {}
      };
      
      const response = await fetch(`http://localhost:3001/api/learning/${botStatus.current_user.id}`);
      if (!response.ok) throw new Error('Erro ao obter dados de aprendizado');
      return response.json();
    },
    enabled: !!botStatus?.current_user?.id
  });

  // Status dos serviços
  const { data: servicesStatus } = useQuery({
    queryKey: ['services-status'],
    queryFn: async (): Promise<ServicesStatus> => {
      const response = await fetch('http://localhost:3001/api/services/status');
      if (!response.ok) throw new Error('Erro ao verificar serviços');
      return response.json();
    },
    refetchInterval: 10000
  });

  const handleConnect = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/connect', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Erro ao conectar');
      
      queryClient.invalidateQueries({ queryKey: ['bot-status'] });
      toast({
        title: "Conexão iniciada",
        description: "Aguardando QR Code...",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao iniciar conexão",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/disconnect', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Erro ao desconectar');
      
      queryClient.invalidateQueries({ queryKey: ['bot-status'] });
      toast({
        title: "Desconectado",
        description: "Bot desconectado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao desconectar",
        variant: "destructive"
      });
    }
  };

  const handleClearSession = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/clear-session', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Erro ao limpar sessão');
      
      queryClient.invalidateQueries({ queryKey: ['bot-status'] });
      toast({
        title: "Sessão limpa",
        description: "Sessão do WhatsApp foi limpa",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao limpar sessão",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'connecting': return 'Conectando';
      case 'error': return 'Erro';
      default: return 'Offline';
    }
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p>Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              WhatsApp AI Bot Local
            </h1>
            <p className="text-muted-foreground mt-1">
              IA que aprende seu estilo de comunicação
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Badge variant="secondary" className="hidden sm:flex">
              {botStatus?.model_name || 'Mixtral'} AI
            </Badge>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status do Bot</p>
                <p className="text-2xl font-bold">{getStatusText(botStatus?.bot_status || 'offline')}</p>
                <p className="text-xs text-muted-foreground">
                  {botStatus?.current_user?.phone_number || 'Nenhum usuário'}
                </p>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(botStatus?.bot_status || 'offline')}`} />
                <Bot className="w-5 h-5 ml-2 text-muted-foreground" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mensagens Processadas</p>
                <p className="text-2xl font-bold">{learningData?.message_count || 0}</p>
                <p className="text-xs text-muted-foreground">Total analisadas</p>
              </div>
              <Activity className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progresso IA</p>
                <p className="text-2xl font-bold">{Math.round(learningData?.learning_progress || 0)}%</p>
                <p className="text-xs text-muted-foreground">
                  {learningData?.vocabulary_size || 0} palavras
                </p>
              </div>
              <Smartphone className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Serviços</p>
                <p className="text-2xl font-bold">
                  {servicesStatus?.ai_service && servicesStatus?.whisper_service ? '2/2' : 
                   servicesStatus?.ai_service || servicesStatus?.whisper_service ? '1/2' : '0/2'}
                </p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
              <div className="flex flex-col gap-1">
                <div className={`w-2 h-2 rounded-full ${servicesStatus?.ai_service ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className={`w-2 h-2 rounded-full ${servicesStatus?.whisper_service ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bot Controls */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Bot className="w-5 h-5 mr-2" />
              Controles do Bot
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                {botStatus?.bot_status === 'offline' && (
                  <Button onClick={handleConnect} className="flex-1">
                    <Zap className="w-4 h-4 mr-2" />
                    Conectar
                  </Button>
                )}
                
                {botStatus?.bot_status === 'online' && (
                  <Button onClick={handleDisconnect} variant="destructive" className="flex-1">
                    Desconectar
                  </Button>
                )}
                
                <Button onClick={handleClearSession} variant="outline">
                  Limpar Sessão
                </Button>
              </div>

              {/* QR Code */}
              {botStatus?.qr_code && (
                <div className="border rounded-lg p-4 bg-white">
                  <p className="text-sm text-muted-foreground mb-2">Escaneie o QR Code:</p>
                  <div className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                    {botStatus.qr_code}
                  </div>
                </div>
              )}

              {/* Status atual */}
              <div className="text-sm text-muted-foreground">
                <p>Status: <span className="font-medium">{getStatusText(botStatus?.bot_status || 'offline')}</span></p>
                {botStatus?.current_user && (
                  <p>Usuário: <span className="font-medium">{botStatus.current_user.phone_number}</span></p>
                )}
              </div>
            </div>
          </Card>

          {/* Services Status */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Cpu className="w-5 h-5 mr-2" />
              Status dos Serviços
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>LM Studio (IA)</span>
                <Badge variant={servicesStatus?.ai_service ? "default" : "destructive"}>
                  {servicesStatus?.ai_service ? "Online" : "Offline"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Whisper (Áudio)</span>
                <Badge variant={servicesStatus?.whisper_service ? "default" : "destructive"}>
                  {servicesStatus?.whisper_service ? "Online" : "Offline"}
                </Badge>
              </div>
              
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>LM Studio: {servicesStatus?.lm_studio_url}</p>
                <p>Modelo: {servicesStatus?.model}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Learning Progress */}
        {learningData && learningData.message_count > 0 && (
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Progresso do Aprendizado</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{learningData.message_count}</p>
                <p className="text-sm text-muted-foreground">Mensagens Analisadas</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{learningData.vocabulary_size}</p>
                <p className="text-sm text-muted-foreground">Palavras no Vocabulário</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{Math.round(learningData.learning_progress)}%</p>
                <p className="text-sm text-muted-foreground">Progresso da IA</p>
              </div>
            </div>
          </Card>
        )}

        {/* System Logs */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Logs do Sistema</h3>
          
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {logs.slice(-20).map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className={`ml-2 ${
                  log.level === 'error' ? 'text-red-400' :
                  log.level === 'warn' ? 'text-yellow-400' :
                  log.level === 'info' ? 'text-blue-400' : 'text-green-400'
                }`}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className="ml-2">{log.message}</span>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-gray-500">Aguardando logs do sistema...</p>
            )}
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            WhatsApp AI Bot Local - Sistema de aprendizado personalizado com IA local
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
