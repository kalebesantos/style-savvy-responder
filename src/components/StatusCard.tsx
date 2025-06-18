
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  title: string;
  value: string | number;
  status?: 'online' | 'offline' | 'connecting' | 'error';
  icon?: React.ReactNode;
  subtitle?: string;
}

const StatusCard = ({ title, value, status, icon, subtitle }: StatusCardProps) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {icon && <div className="text-primary">{icon}</div>}
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {status && (
              <div className={cn("w-2 h-2 rounded-full", getStatusColor(status))} />
            )}
          </div>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default StatusCard;
