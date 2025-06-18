
import { useState, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FileUploadProps {
  onUploadComplete?: (fileData: any) => void;
  currentUserId?: string;
}

const FileUpload = ({ onUploadComplete, currentUserId }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    if (!currentUserId) {
      toast({
        title: "Erro",
        description: "Nenhum usuário conectado",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(10);

    try {
      // Read file content
      const fileContent = await file.text();
      setUploadProgress(30);

      // Store file record in database
      const { data: fileRecord, error: dbError } = await supabase
        .from('uploaded_files')
        .insert({
          user_id: currentUserId,
          filename: file.name,
          file_size: file.size,
          file_type: file.type,
          processing_status: 'processing'
        })
        .select()
        .single();

      if (dbError) throw dbError;
      setUploadProgress(60);

      // Simulate processing (in real implementation, this would parse WhatsApp export)
      const messageCount = fileContent.split('\n').filter(line => 
        line.includes(':') && line.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)
      ).length;

      setUploadProgress(80);

      // Update file record
      if (fileRecord) {
        await supabase
          .from('uploaded_files')
          .update({
            processing_status: 'completed',
            messages_extracted: messageCount
          })
          .eq('id', fileRecord.id);
      }

      setUploadProgress(100);
      setUploadStatus('success');

      toast({
        title: "Upload concluído!",
        description: `${messageCount} mensagens extraídas para treinamento`,
      });

      onUploadComplete && onUploadComplete(fileRecord);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      toast({
        title: "Erro no upload",
        description: "Falha ao processar o arquivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatus('idle');
      }, 2000);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && (file.name.endsWith('.txt') || file.name.endsWith('.json'))) {
      processFile(file);
    } else {
      toast({
        title: "Formato inválido",
        description: "Por favor, envie apenas arquivos .txt ou .json",
        variant: "destructive",
      });
    }
  }, [currentUserId, toast, onUploadComplete]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [currentUserId, toast, onUploadComplete]);

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'success':
        return <Check className="w-8 h-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      case 'uploading':
        return <Upload className="w-8 h-8 text-blue-500 animate-bounce" />;
      default:
        return <FileText className="w-8 h-8 text-muted-foreground" />;
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Upload do Histórico do WhatsApp</h3>
      
      {!currentUserId ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
          <p>Conecte um usuário primeiro para fazer upload</p>
        </div>
      ) : (
        <>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              {getStatusIcon()}
              
              {!isUploading ? (
                <>
                  <div>
                    <p className="text-lg font-medium">
                      Arraste e solte seu arquivo aqui
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ou clique para selecionar
                    </p>
                  </div>
                  
                  <Button asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar Arquivo
                    </label>
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".txt,.json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: .txt, .json (máx. 50MB)
                  </p>
                </>
              ) : (
                <div className="w-full max-w-xs">
                  <p className="text-sm font-medium mb-2">
                    {uploadStatus === 'success' ? 'Concluído!' : 'Processando...'}
                  </p>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default FileUpload;
