
import { Card } from "@/components/ui/card";
import { Bot, Activity, Smartphone } from 'lucide-react';

interface StatusCardsProps {
  botStatus?: {
    bot_status: 'online' | 'offline' | 'connecting' | 'error';
    current_user?: {
      phone_number: string;
    };
  };
  learningData?: {
    message_count: number;
    vocabulary_size: number;
    learning_progress: number;
  };
  servicesStatus?: {
    ai_service: boolean;
    whisper_service: boolean;
  };
}

const StatusCards = ({ botStatus, learningData, servicesStatus }: StatusCardsProps) => {
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

  return (
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
  );
};

export default StatusCards;
