
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { BotService } from "@/services/botService";

interface UseBotActionsProps {
  onStatusChange?: (status: 'online' | 'offline' | 'connecting' | 'error') => void;
  currentUser?: any;
}

export const useBotActions = ({ onStatusChange, currentUser }: UseBotActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Poll bot status every 3 seconds
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const status = await BotService.getBotStatus();
        onStatusChange && onStatusChange(status.status);
        
        if (status.qrCode && status.status === 'connecting') {
          setQrCode(status.qrCode);
          setShowQR(true);
        } else if (status.status === 'online') {
          setShowQR(false);
          setQrCode(null);
        }
      } catch (error) {
        console.error('Error polling bot status:', error);
      }
    };

    // Poll immediately and then every 3 seconds
    pollStatus();
    const interval = setInterval(pollStatus, 3000);

    return () => clearInterval(interval);
  }, [onStatusChange]);

  const handleStartBot = async () => {
    setIsLoading(true);
    try {
      const result = await BotService.startBot();
      
      if (result.success) {
        toast({
          title: "Iniciando bot...",
          description: "Aguarde a geração do QR code",
        });
      } else {
        toast({
          title: "Erro ao iniciar",
          description: result.message || "Falha ao iniciar o bot",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error starting bot:', error);
      toast({
        title: "Erro ao iniciar",
        description: "Erro de comunicação com o servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopBot = async () => {
    setIsLoading(true);
    try {
      const result = await BotService.stopBot();
      
      if (result.success) {
        setShowQR(false);
        setQrCode(null);
        
        toast({
          title: "Bot desconectado",
          description: "WhatsApp desconectado com sucesso",
        });
      } else {
        toast({
          title: "Erro ao parar",
          description: result.message || "Falha ao parar o bot",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error stopping bot:', error);
      toast({
        title: "Erro ao parar",
        description: "Erro de comunicação com o servidor",
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
      // Clear session and reset learning
      const result = await BotService.clearSession();
      
      if (result.success) {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries();
        
        toast({
          title: "Sessão e aprendizado resetados",
          description: "Dados limpos com sucesso",
        });
      } else {
        toast({
          title: "Erro ao resetar",
          description: result.message || "Falha ao limpar dados",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error resetting:', error);
      toast({
        title: "Erro ao resetar",
        description: "Erro de comunicação com o servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleQR = () => {
    setShowQR(!showQR);
  };

  return {
    isLoading,
    showQR,
    qrCode,
    handleStartBot,
    handleStopBot,
    handleResetLearning,
    handleToggleQR
  };
};
