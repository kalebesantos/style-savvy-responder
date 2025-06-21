
import { QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';

interface QRCodeDisplayProps {
  showQR: boolean;
  qrCode?: string | null;
}

const QRCodeDisplay = ({ showQR, qrCode }: QRCodeDisplayProps) => {
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);

  useEffect(() => {
    if (qrCode) {
      // Convert QR code string to image using a QR code library
      // For now, we'll display the raw QR code data
      setQrCodeImage(qrCode);
    } else {
      setQrCodeImage(null);
    }
  }, [qrCode]);

  if (!showQR) return null;

  return (
    <div className="mb-6 p-4 border-2 border-dashed border-primary/25 rounded-lg">
      <div className="flex flex-col items-center gap-4">
        {qrCodeImage ? (
          <div className="bg-white p-4 rounded-lg">
            {/* For a real implementation, you'd use a QR code generator library */}
            <div className="w-64 h-64 bg-gray-100 flex items-center justify-center text-xs p-2 font-mono break-all">
              {qrCodeImage}
            </div>
          </div>
        ) : (
          <QrCode className="w-32 h-32 text-muted-foreground animate-pulse" />
        )}
        <div className="text-center">
          <p className="font-medium">Escaneie com o WhatsApp</p>
          <p className="text-sm text-muted-foreground">
            Abra o WhatsApp {'>'} Menu {'>'} Dispositivos conectados {'>'} Conectar dispositivo
          </p>
          {!qrCodeImage && (
            <p className="text-xs text-orange-600 mt-2">
              Aguardando geração do QR code...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
