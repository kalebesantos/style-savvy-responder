
import { useQuery } from '@tanstack/react-query';

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

export const useDashboardData = () => {
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

  return {
    botStatus,
    statusLoading,
    learningData,
    servicesStatus
  };
};
