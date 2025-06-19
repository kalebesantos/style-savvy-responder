
import { Card } from "@/components/ui/card";
import BotStatusBadge from './bot-controls/BotStatusBadge';
import QRCodeDisplay from './bot-controls/QRCodeDisplay';
import BotActionButtons from './bot-controls/BotActionButtons';
import UserInfo from './bot-controls/UserInfo';
import { useBotActions } from './bot-controls/hooks/useBotActions';

interface BotControlsProps {
  botStatus: 'online' | 'offline' | 'connecting' | 'error';
  onStatusChange?: (status: 'online' | 'offline' | 'connecting' | 'error') => void;
  currentUser?: any;
}

const BotControls = ({ botStatus, onStatusChange, currentUser }: BotControlsProps) => {
  const {
    isLoading,
    showQR,
    handleStartBot,
    handleStopBot,
    handleResetLearning,
    handleToggleQR
  } = useBotActions({ onStatusChange, currentUser });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Controle do Bot</h3>
        <BotStatusBadge botStatus={botStatus} />
      </div>

      <QRCodeDisplay showQR={showQR} />

      <BotActionButtons
        botStatus={botStatus}
        isLoading={isLoading}
        currentUser={currentUser}
        onStartBot={handleStartBot}
        onStopBot={handleStopBot}
        onToggleQR={handleToggleQR}
        onResetLearning={handleResetLearning}
      />

      <UserInfo currentUser={currentUser} />
    </Card>
  );
};

export default BotControls;
