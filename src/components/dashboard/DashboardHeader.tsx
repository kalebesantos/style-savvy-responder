
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface DashboardHeaderProps {
  modelName?: string;
}

const DashboardHeader = ({ modelName }: DashboardHeaderProps) => {
  const queryClient = useQueryClient();

  return (
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
          {modelName || 'Mixtral'} AI
        </Badge>
      </div>
    </div>
  );
};

export default DashboardHeader;
