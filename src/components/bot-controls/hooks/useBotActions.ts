
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseBotActionsProps {
  onStatusChange?: (status: 'online' | 'offline' | 'connecting' | 'error') => void;
  currentUser?: any;
}

export const useBotActions = ({ onStatusChange, currentUser }: UseBotActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();

  const handleStartBot = async () => {
    setIsLoading(true);
    try {
      // Get the first bot config
      const { data: configData } = await supabase
        .from('bot_config')
        .select('id')
        .limit(1)
        .single();

      if (configData) {
        // Update bot status to connecting
        await supabase
          .from('bot_config')
          .update({ bot_status: 'connecting' })
          .eq('id', configData.id);

        onStatusChange && onStatusChange('connecting');
        
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
            .eq('id', configData.id);
            
          onStatusChange && onStatusChange('online');
          setShowQR(false);
          
          toast({
            title: "Bot conectado!",
            description: "WhatsApp conectado com sucesso",
          });
        }, 5000);
      }

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
      const { data: configData } = await supabase
        .from('bot_config')
        .select('id')
        .limit(1)
        .single();

      if (configData) {
        await supabase
          .from('bot_config')
          .update({ bot_status: 'offline' })
          .eq('id', configData.id);

        onStatusChange && onStatusChange('offline');
        setShowQR(false);
        
        toast({
          title: "Bot desconectado",
          description: "WhatsApp desconectado com sucesso",
        });
      }

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

  const handleToggleQR = () => {
    setShowQR(!showQR);
  };

  return {
    isLoading,
    showQR,
    handleStartBot,
    handleStopBot,
    handleResetLearning,
    handleToggleQR
  };
};
