
-- Limpar tabelas existentes se necessário
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.user_learning_data CASCADE;
DROP TABLE IF EXISTS public.whatsapp_users CASCADE;
DROP TABLE IF EXISTS public.bot_config CASCADE;
DROP TABLE IF EXISTS public.conversation_history CASCADE;
DROP TABLE IF EXISTS public.uploaded_files CASCADE;

-- Criar tabela para configuração do bot
CREATE TABLE public.bot_config (
  id SERIAL PRIMARY KEY,
  bot_status TEXT DEFAULT 'offline' CHECK (bot_status IN ('online', 'offline', 'connecting', 'error')),
  current_user_id TEXT,
  last_qr_code TEXT,
  learning_enabled BOOLEAN DEFAULT true,
  audio_enabled BOOLEAN DEFAULT true,
  model_name TEXT DEFAULT 'mixtral',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para usuários WhatsApp
CREATE TABLE public.whatsapp_users (
  id TEXT PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  display_name TEXT,
  is_connected BOOLEAN DEFAULT false,
  connected_at TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para mensagens
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES public.whatsapp_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('incoming', 'outgoing')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para dados de aprendizado
CREATE TABLE public.user_learning_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES public.whatsapp_users(id) ON DELETE CASCADE,
  message_count INTEGER DEFAULT 0,
  vocabulary_size INTEGER DEFAULT 0,
  learning_progress FLOAT DEFAULT 0.0,
  conversation_patterns JSONB DEFAULT '{}',
  style_analysis JSONB DEFAULT '{}',
  last_training_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_data ENABLE ROW LEVEL SECURITY;

-- Criar políticas para acesso público (painel admin)
CREATE POLICY "Allow all operations on bot_config" ON public.bot_config FOR ALL USING (true);
CREATE POLICY "Allow all operations on whatsapp_users" ON public.whatsapp_users FOR ALL USING (true);
CREATE POLICY "Allow all operations on messages" ON public.messages FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_learning_data" ON public.user_learning_data FOR ALL USING (true);

-- Inserir configuração inicial
INSERT INTO public.bot_config (bot_status, model_name) 
VALUES ('offline', 'mixtral');

-- Criar função para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para updated_at
CREATE TRIGGER update_whatsapp_users_updated_at 
  BEFORE UPDATE ON public.whatsapp_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_learning_data_updated_at 
  BEFORE UPDATE ON public.user_learning_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bot_config_updated_at 
  BEFORE UPDATE ON public.bot_config 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
