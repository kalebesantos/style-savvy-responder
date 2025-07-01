
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Zap, Cpu } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';

interface BotControlsSectionProps {
  botStatus?: {
    bot_status: 'online' | 'offline' | 'connecting' | 'error';
    current_user?: {
      phone_number: string;
    };
    qr_code?: string;
  };
  servicesStatus?: {
    ai_service: boolean;
    whisper_service: boolean;
    lm_studio_url: string;
    model: string;
  };
}

const BotControlsSection = ({ botStatus, servicesStatus }: BotControlsSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'connecting': return 'Conectando';
      case 'error': return 'Erro';
      default: return 'Offline';
    }
  };

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

  return (
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
  );
};

export default BotControlsSection;
