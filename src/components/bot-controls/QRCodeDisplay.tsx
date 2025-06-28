
import { QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';

interface QRCodeDisplayProps {
  showQR: boolean;
  qrCode?: string | null;
}

const QRCodeDisplay = ({ showQR, qrCode }: QRCodeDisplayProps) => {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);

  useEffect(() => {
    if (qrCode && showQR) {
      // Generate QR code as data URL using a simple QR code API
      const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrCode)}`;
      setQrCodeDataURL(qrCodeURL);
    } else {
      setQrCodeDataURL(null);
    }
  }, [qrCode, showQR]);

  if (!showQR) return null;

  return (
    <div className="mb-6 p-4 border-2 border-dashed border-primary/25 rounded-lg">
      <div className="flex flex-col items-center gap-4">
        {qrCodeDataURL ? (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <img 
              src={qrCodeDataURL} 
              alt="QR Code do WhatsApp" 
              className="w-64 h-64 object-contain"
              onError={() => {
                console.error('Erro ao carregar QR code');
                setQrCodeDataURL(null);
              }}
            />
          </div>
        ) : qrCode ? (
          <div className="bg-white p-4 rounded-lg">
            <div className="w-64 h-64 bg-gray-100 flex items-center justify-center text-xs p-2 font-mono break-all border">
              {qrCode}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <QrCode className="w-32 h-32 text-muted-foreground animate-pulse" />
            <p className="text-sm text-muted-foreground mt-2">
              Gerando QR code...
            </p>
          </div>
        )}
        
        <div className="text-center">
          <p className="font-medium">Escaneie com o WhatsApp</p>
          <p className="text-sm text-muted-foreground">
            Abra o WhatsApp {'>'} Menu {'>'} Dispositivos conectados {'>'} Conectar dispositivo
          </p>
          {qrCode && (
            <p className="text-xs text-green-600 mt-2">
              ✅ QR code gerado com sucesso
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
