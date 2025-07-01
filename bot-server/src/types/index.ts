
export interface BotConfig {
  id: number;
  bot_status: 'online' | 'offline' | 'connecting' | 'error';
  current_user_id?: string;
  last_qr_code?: string;
  learning_enabled: boolean;
  audio_enabled: boolean;
  model_name: string;
  updated_at: string;
}

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

export interface ConversationMessage {
  id: string;
  user_id: string;
  content: string;
  message_type: 'incoming' | 'outgoing';
  timestamp: string;
  processed: boolean;
  created_at: string;
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

export interface AIResponse {
  text: string;
  confidence: number;
  learning_applied: boolean;
}
