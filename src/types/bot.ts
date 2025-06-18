
export interface WhatsAppUser {
  id: string;
  phone_number: string;
  display_name?: string;
  is_connected: boolean;
  connected_at?: string;
  last_activity?: string;
  created_at: string;
  updated_at: string;
}

export interface UserLearningData {
  id: string;
  user_id: string;
  message_count: number;
  vocabulary_size: number;
  learning_progress: number;
  conversation_patterns: Record<string, any>;
  style_analysis: Record<string, any>;
  last_training_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BotConfig {
  id: string;
  current_user_id?: string;
  bot_status: 'online' | 'offline' | 'connecting' | 'error';
  model_name: string;
  learning_enabled: boolean;
  audio_enabled: boolean;
  last_qr_code?: string;
  updated_at: string;
}

export interface UploadedFile {
  id: string;
  user_id: string;
  filename: string;
  file_size: number;
  file_type: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'error';
  messages_extracted: number;
  upload_path?: string;
  created_at: string;
}

export interface ConversationMessage {
  id: string;
  user_id: string;
  message_type: 'sent' | 'received' | 'audio';
  content?: string;
  audio_transcript?: string;
  timestamp: string;
  processed: boolean;
  created_at: string;
}
