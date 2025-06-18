
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Users, Activity, Smartphone, RefreshCw } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import StatusCard from '@/components/StatusCard';
import FileUpload from '@/components/FileUpload';
import BotControls from '@/components/BotControls';
import LearningStats from '@/components/LearningStats';

const Index = () => {
  const [currentBotStatus, setCurrentBotStatus] = useState<'online' | 'offline' | 'connecting' | 'error'>('offline');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bot configuration
  const { data: botConfig, isLoading: configLoading } = useQuery({
    queryKey: ['bot-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bot_config')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch current connected user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      if (!botConfig?.current_user_id) return null;
      
      const { data, error } = await supabase
        .from('whatsapp_users')
        .select('*')
        .eq('id', botConfig.current_user_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!botConfig?.current_user_id
  });

  // Fetch learning data for current user
  const { data: learningData } = useQuery({
    queryKey: ['learning-data', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      
      const { data, error } = await supabase
        .from('user_learning_data')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!currentUser?.id
  });

  // Fetch total users count
  const { data: totalUsers } = useQuery({
    queryKey: ['total-users'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('whatsapp_users')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Update bot status when config changes
  useEffect(() => {
    if (botConfig?.bot_status) {
      setCurrentBotStatus(botConfig.bot_status as any);
    }
  }, [botConfig]);

  const handleRefresh = () => {
    queryClient.invalidateQueries();
    toast({
      title: "Atualizado",
      description: "Dados atualizados com sucesso",
    });
  };

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['learning-data'] });
    queryClient.invalidateQueries({ queryKey: ['current-user'] });
  };

  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              WhatsApp AI Bot
            </h1>
            <p className="text-muted-foreground mt-1">
              Painel de controle e aprendizado personalizado
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Badge variant="secondary" className="hidden sm:flex">
              Mixtral AI
            </Badge>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatusCard
            title="Status do Bot"
            value={currentBotStatus === 'online' ? 'Conectado' : 'Desconectado'}
            status={currentBotStatus}
            icon={<Bot className="w-5 h-5" />}
            subtitle={currentUser ? `${currentUser.phone_number}` : 'Nenhum usuário'}
          />
          
          <StatusCard
            title="Usuários Cadastrados"
            value={totalUsers || 0}
            icon={<Users className="w-5 h-5" />}
            subtitle="Total de usuários"
          />
          
          <StatusCard
            title="Mensagens Processadas"
            value={learningData?.message_count || 0}
            icon={<Activity className="w-5 h-5" />}
            subtitle="Usuário atual"
          />
          
          <StatusCard
            title="Progresso IA"
            value={`${Math.round(learningData?.learning_progress || 0)}%`}
            icon={<Smartphone className="w-5 h-5" />}
            subtitle={learningData?.vocabulary_size ? `${learningData.vocabulary_size} palavras` : 'Sem dados'}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bot Controls */}
          <BotControls
            botStatus={currentBotStatus}
            onStatusChange={setCurrentBotStatus}
            currentUser={currentUser}
          />
          
          {/* File Upload */}
          <FileUpload
            currentUserId={currentUser?.id}
            onUploadComplete={handleUploadComplete}
          />
        </div>

        {/* Learning Statistics */}
        <div className="mb-8">
          <LearningStats learningData={learningData} />
        </div>

        {/* System Info */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Informações do Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Modelo de IA</p>
              <p className="font-medium">Mixtral via LM Studio</p>
            </div>
            <div>
              <p className="text-muted-foreground">WhatsApp API</p>
              <p className="font-medium">Baileys (Web)</p>
            </div>
            <div>
              <p className="text-muted-foreground">Banco de Dados</p>
              <p className="font-medium">Supabase PostgreSQL</p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            WhatsApp AI Bot - Sistema de aprendizado personalizado multiusuário
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
