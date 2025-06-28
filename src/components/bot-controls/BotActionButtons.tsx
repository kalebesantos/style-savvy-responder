
import { Button } from "@/components/ui/button";
import { Play, Square, RotateCcw, Smartphone, Upload } from 'lucide-react';

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
  // Função para scrollar até o componente de upload
  const scrollToUpload = () => {
    const uploadElement = document.querySelector('[data-upload-component]');
    if (uploadElement) {
      uploadElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {botStatus === 'offline' || botStatus === 'error' ? (
        <Button 
          onClick={onStartBot} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          {isLoading ? 'Iniciando...' : 'Iniciar Bot'}
        </Button>
      ) : (
        <Button 
          onClick={onStopBot} 
          disabled={isLoading}
          variant="destructive"
          className="flex items-center gap-2"
        >
          <Square className="w-4 h-4" />
          {isLoading ? 'Parando...' : 'Parar Bot'}
        </Button>
      )}

      <Button
        onClick={onToggleQR}
        variant="outline"
        disabled={botStatus === 'offline'}
        className="flex items-center gap-2"
      >
        <Smartphone className="w-4 h-4" />
        {botStatus === 'connecting' ? 'Ver QR' : 'QR Code'}
      </Button>

      {/* Botão de upload só aparece quando há usuário conectado */}
      {currentUser && botStatus === 'online' && (
        <Button
          onClick={scrollToUpload}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Histórico
        </Button>
      )}

      <Button
        onClick={onResetLearning}
        disabled={!currentUser || isLoading || botStatus === 'connecting'}
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
