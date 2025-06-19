
import { QrCode } from 'lucide-react';

interface QRCodeDisplayProps {
  showQR: boolean;
}

const QRCodeDisplay = ({ showQR }: QRCodeDisplayProps) => {
  if (!showQR) return null;

  return (
    <div className="mb-6 p-4 border-2 border-dashed border-primary/25 rounded-lg">
      <div className="flex flex-col items-center gap-4">
        <QrCode className="w-32 h-32 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium">Escaneie com o WhatsApp</p>
          <p className="text-sm text-muted-foreground">
            Abra o WhatsApp {'>'} Menu {'>'} Dispositivos conectados {'>'} Conectar dispositivo
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
