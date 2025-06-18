
-- Create table for WhatsApp users
CREATE TABLE public.whatsapp_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  display_name TEXT,
  is_connected BOOLEAN DEFAULT false,
  connected_at TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user learning data
CREATE TABLE public.user_learning_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.whatsapp_users(id) ON DELETE CASCADE,
  message_count INTEGER DEFAULT 0,
  vocabulary_size INTEGER DEFAULT 0,
  learning_progress FLOAT DEFAULT 0.0,
  conversation_patterns JSONB DEFAULT '{}',
  style_analysis JSONB DEFAULT '{}',
  last_training_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for conversation history
CREATE TABLE public.conversation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.whatsapp_users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('sent', 'received', 'audio')),
  content TEXT,
  audio_transcript TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for bot configuration
CREATE TABLE public.bot_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  current_user_id UUID REFERENCES public.whatsapp_users(id) ON DELETE SET NULL,
  bot_status TEXT DEFAULT 'offline' CHECK (bot_status IN ('online', 'offline', 'connecting', 'error')),
  model_name TEXT DEFAULT 'mixtral',
  learning_enabled BOOLEAN DEFAULT true,
  audio_enabled BOOLEAN DEFAULT true,
  last_qr_code TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for uploaded files
CREATE TABLE public.uploaded_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.whatsapp_users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
  messages_extracted INTEGER DEFAULT 0,
  upload_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.whatsapp_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is an admin panel without user auth)
CREATE POLICY "Allow all operations on whatsapp_users" ON public.whatsapp_users FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_learning_data" ON public.user_learning_data FOR ALL USING (true);
CREATE POLICY "Allow all operations on conversation_history" ON public.conversation_history FOR ALL USING (true);
CREATE POLICY "Allow all operations on bot_config" ON public.bot_config FOR ALL USING (true);
CREATE POLICY "Allow all operations on uploaded_files" ON public.uploaded_files FOR ALL USING (true);

-- Insert initial bot configuration
INSERT INTO public.bot_config (id, bot_status, model_name) 
VALUES (gen_random_uuid(), 'offline', 'mixtral');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_whatsapp_users_updated_at BEFORE UPDATE ON public.whatsapp_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_learning_data_updated_at BEFORE UPDATE ON public.user_learning_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bot_config_updated_at BEFORE UPDATE ON public.bot_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
