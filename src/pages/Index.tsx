
import { RefreshCw } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatusCards from '@/components/dashboard/StatusCards';
import BotControlsSection from '@/components/dashboard/BotControlsSection';
import LearningProgress from '@/components/dashboard/LearningProgress';
import SystemLogs from '@/components/dashboard/SystemLogs';
import { memo } from 'react';

// Memoizar componentes para evitar re-renderizações desnecessárias
const MemoizedDashboardHeader = memo(DashboardHeader);
const MemoizedStatusCards = memo(StatusCards);
const MemoizedBotControlsSection = memo(BotControlsSection);
const MemoizedLearningProgress = memo(LearningProgress);
const MemoizedSystemLogs = memo(SystemLogs);

const Index = () => {
  const { logs } = useSocket();
  const { botStatus, statusLoading, learningData, servicesStatus } = useDashboardData();

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
        <MemoizedDashboardHeader modelName={botStatus?.model_name} />
        
        <MemoizedStatusCards 
          botStatus={botStatus}
          learningData={learningData}
          servicesStatus={servicesStatus}
        />

        <MemoizedBotControlsSection 
          botStatus={botStatus}
          servicesStatus={servicesStatus}
        />

        <MemoizedLearningProgress learningData={learningData} />

        <MemoizedSystemLogs logs={logs} />

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
