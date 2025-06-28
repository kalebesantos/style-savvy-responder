
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  currentUserId?: string;  // Changed from number to string
  onUploadComplete?: () => void;
}

const FileUpload = ({ currentUserId, onUploadComplete }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const { toast } = useToast();

  const processWhatsAppFile = async (file: File) => {
    setUploading(true);
    setProgress(10);

    try {
      const text = await file.text();
      setProgress(30);

      // Parse WhatsApp chat format
      const lines = text.split('\n').filter(line => line.trim());
      const messages: any[] = [];
      
      for (const line of lines) {
        // WhatsApp format: DD/MM/YYYY, HH:MM - Contact: Message
        const match = line.match(/(\d{1,2}\/\d{1,2}\/\d{4}),\s(\d{1,2}:\d{2})\s-\s([^:]+):\s(.+)/);
        
        if (match) {
          const [, date, time, contact, message] = match;
          
          // Convert to ISO format
          const [day, month, year] = date.split('/');
          const timestamp = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}:00`);
          
          messages.push({
            timestamp: timestamp.toISOString(),
            content: message.trim(),
            message_type: 'received',
            user_id: currentUserId
          });
        }
      }

      setProgress(60);

      if (messages.length === 0) {
        throw new Error('Nenhuma mensagem válida encontrada no arquivo');
      }

      // Save to conversation_history table (not chat_history)
      const batchSize = 100;
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('conversation_history')  // Fixed table name
          .insert(batch);
        
        if (error) throw error;
        
        setProgress(60 + ((i + batchSize) / messages.length) * 35);
      }

      // Update user learning data
      const { error: learningError } = await supabase
        .from('user_learning_data')
        .upsert({
          user_id: currentUserId,  // This is already a string
          message_count: messages.length,
          vocabulary_size: new Set(
            messages.flatMap(m => m.content.toLowerCase().split(/\s+/))
          ).size,
          learning_progress: Math.min(messages.length / 100 * 10, 100),
          updated_at: new Date().toISOString()
        });

      if (learningError) throw learningError;

      setProgress(100);
      setUploadedFile(file.name);
      
      toast({
        title: "Upload concluído!",
        description: `${messages.length} mensagens processadas com sucesso`,
      });

      onUploadComplete?.();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      processWhatsAppFile(file);
    }
  }, [currentUserId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: uploading || !currentUserId
  });

  // Não mostrar o componente se não há usuário conectado
  if (!currentUserId) {
    return null;
  }

  return (
    <Card className="p-6" data-upload-component>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload do Histórico do WhatsApp
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : uploading 
                ? 'border-muted-foreground/50 bg-muted/50 cursor-not-allowed'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
          }`}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div>
                <p className="font-medium">Processando arquivo...</p>
                <Progress value={progress} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-1">{progress}%</p>
              </div>
            </div>
          ) : uploadedFile ? (
            <div className="space-y-2">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
              <p className="font-medium text-green-700">Upload concluído!</p>
              <p className="text-sm text-muted-foreground">{uploadedFile}</p>
            </div>
          ) : isDragActive ? (
            <div className="space-y-2">
              <Upload className="w-12 h-12 mx-auto text-primary" />
              <p className="font-medium">Solte o arquivo aqui...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="font-medium">Arraste o arquivo .txt ou clique para selecionar</p>
              <p className="text-sm text-muted-foreground">
                Exporte seu histórico do WhatsApp como arquivo .txt
              </p>
            </div>
          )}
        </div>

        {!currentUserId && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Conecte o WhatsApp primeiro para fazer upload do histórico
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Como exportar:</strong></p>
          <p>1. Abra uma conversa no WhatsApp</p>
          <p>2. Toque nos 3 pontos {'>'} Mais {'>'} Exportar conversa</p>
          <p>3. Escolha "Sem mídia" e salve como .txt</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
