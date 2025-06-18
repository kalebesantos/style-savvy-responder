
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, RotateCcw, QrCode, Smartphone } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BotControlsProps {
  botStatus: 'online' | 'offline' | 'connecting' | 'error';
  onStatusChange?: (status: string) => void;
  currentUser?: any;
}

const BotControls = ({ botStatus, onStatusChange, currentUser }: BotControlsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'connecting':
        return 'Conectando...';
      case 'error':
        return 'Erro';
      default:
        return 'Offline';
    }
  };

  const handleStartBot = async () => {
    setIsLoading(true);
    try {
      // Update bot status to connecting
      await supabase
        .from('bot_config')
        .update({ bot_status: 'connecting' })
        .eq('id', (await supabase.from('bot_config').select('id').single()).data?.id);

      onStatusChange?('connecting');
      
      // Simulate QR code generation
      setShowQR(true);
      
      toast({
        title: "Iniciando bot...",
        description: "Escaneie o QR code com o WhatsApp",
      });

      // Simulate connection after 5 seconds
      setTimeout(async () => {
        await supabase
          .from('bot_config')
          .update({ 
            bot_status: 'online',
            last_qr_code: 'mock-qr-code-data'
          })
          .eq('id', (await supabase.from('bot_config').select('id').single()).data?.id);
          
        onStatusChange?('online');
        setShowQR(false);
        
        toast({
          title: "Bot conectado!",
          description: "WhatsApp conectado com sucesso",
        });
      }, 5000);

    } catch (error) {
      console.error('Error starting bot:', error);
      toast({
        title: "Erro ao iniciar",
        description: "Falha ao iniciar o bot",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopBot = async () => {
    setIsLoading(true);
    try {
      await supabase
        .from('bot_config')
        .update({ bot_status: 'offline' })
        .eq('id', (await supabase.from('bot_config').select('id').single()).data?.id);

      onStatusChange?('offline');
      setShowQR(false);
      
      toast({
        title: "Bot desconectado",
        description: "WhatsApp desconectado com sucesso",
      });

    } catch (error) {
      console.error('Error stopping bot:', error);
      toast({
        title: "Erro ao parar",
        description: "Falha ao parar o bot",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetLearning = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      // Reset learning data
      await supabase
        .from('user_learning_data')
        .update({
          message_count: 0,
          vocabulary_size: 0,
          learning_progress: 0,
          conversation_patterns: {},
          style_analysis: {}
        })
        .eq('user_id', currentUser.id);

      toast({
        title: "Aprendizado resetado",
        description: "Dados de aprendizado foram limpos",
      });

    } catch (error) {
      console.error('Error resetting learning:', error);
      toast({
        title: "Erro ao resetar",
        description: "Falha ao limpar dados de aprendizado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Controle do Bot</h3>
        <Badge variant="outline" className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(botStatus)}`} />
          {getStatusText(botStatus)}
        </Badge>
      </div>

      {showQR && (
        <div className="mb-6 p-4 border-2 border-dashed border-primary/25 rounded-lg">
          <div className="flex flex-col items-center gap-4">
            <QrCode className="w-32 h-32 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Escaneie com o WhatsApp</p>
              <p className="text-sm text-muted-foreground">
                Abra o WhatsApp {'>'} Menu {'>'} Dispositivos conectados {'>'} Conectar dispositivo
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {botStatus === 'offline' ? (
          <Button 
            onClick={handleStartBot} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Iniciar Bot
          </Button>
        ) : (
          <Button 
            onClick={handleStopBot} 
            disabled={isLoading}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Parar Bot
          </Button>
        )}

        <Button
          onClick={() => setShowQR(!showQR)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Smartphone className="w-4 h-4" />
          QR Code
        </Button>

        <Button
          onClick={handleResetLearning}
          disabled={!currentUser || isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset IA
        </Button>
      </div>

      {currentUser && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm">
            <span className="font-medium">Usuário conectado:</span> {currentUser.display_name || currentUser.phone_number}
          </p>
        </div>
      )}
    </Card>
  );
};

export default BotControls;
