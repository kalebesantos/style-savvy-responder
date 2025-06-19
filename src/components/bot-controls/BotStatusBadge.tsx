
import { Badge } from "@/components/ui/badge";

interface BotStatusBadgeProps {
  botStatus: 'online' | 'offline' | 'connecting' | 'error';
}

const BotStatusBadge = ({ botStatus }: BotStatusBadgeProps) => {
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

  return (
    <Badge variant="outline" className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${getStatusColor(botStatus)}`} />
      {getStatusText(botStatus)}
    </Badge>
  );
};

export default BotStatusBadge;
