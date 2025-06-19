
import { Button } from "@/components/ui/button";
import { Play, Square, RotateCcw, Smartphone } from 'lucide-react';

interface BotActionButtonsProps {
  botStatus: 'online' | 'offline' | 'connecting' | 'error';
  isLoading: boolean;
  currentUser: any;
  onStartBot: () => void;
  onStopBot: () => void;
  onToggleQR: () => void;
  onResetLearning: () => void;
}

const BotActionButtons = ({
  botStatus,
  isLoading,
  currentUser,
  onStartBot,
  onStopBot,
  onToggleQR,
  onResetLearning
}: BotActionButtonsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {botStatus === 'offline' ? (
        <Button 
          onClick={onStartBot} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          Iniciar Bot
        </Button>
      ) : (
        <Button 
          onClick={onStopBot} 
          disabled={isLoading}
          variant="destructive"
          className="flex items-center gap-2"
        >
          <Square className="w-4 h-4" />
          Parar Bot
        </Button>
      )}

      <Button
        onClick={onToggleQR}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Smartphone className="w-4 h-4" />
        QR Code
      </Button>

      <Button
        onClick={onResetLearning}
        disabled={!currentUser || isLoading}
        variant="outline"
        className="flex items-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Reset IA
      </Button>
    </div>
  );
};

export default BotActionButtons;
