
import { supabase } from './supabaseClient';
import { BotConfig, WhatsAppUser, ConversationMessage, UserLearningData } from '../types';
import logger from '../utils/logger';

class DatabaseService {
  async updateBotStatus(status: string, qr_code?: string | undefined) {
    try {
      await supabase.from('bot_config').update({
        bot_status: status,
        last_qr_code: qr_code || null,
        updated_at: new Date().toISOString()
      }).eq('id', 1);
    } catch (error) {
      logger.error('Erro ao atualizar status do bot:', error);
    }
  }

  async findOrCreateUser(phone: string, name?: string): Promise<WhatsAppUser | null> {
    try {
      const { data: existing, error } = await supabase
        .from('whatsapp_users')
        .select('*')
        .eq('phone_number', phone)
        .single();

      if (existing) return existing;

      const { data: created, error: insertError } = await supabase
        .from('whatsapp_users')
        .insert([{ 
          id: phone.replace(/\D/g, ''), // Use apenas números como ID
          phone_number: phone, 
          display_name: name || '' 
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      return created ?? null;
    } catch (error) {
      logger.error('Erro ao buscar/criar usuário:', error);
      return null;
    }
  }

  async setCurrentUser(userId: string | undefined) {
    try {
      await supabase.from('bot_config').update({
        current_user_id: userId || null
      }).eq('id', 1);
    } catch (error) {
      logger.error('Erro ao definir usuário atual:', error);
    }
  }

  async saveMessage(message: Omit<ConversationMessage, 'id' | 'created_at'>) {
    try {
      await supabase.from('messages').insert([message]);
    } catch (error) {
      logger.error('Erro ao salvar mensagem:', error);
    }
  }

  async getUserLearningData(userId: string): Promise<UserLearningData | null> {
    try {
      const { data, error } = await supabase
        .from('user_learning_data')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;
      return data;
    } catch (error) {
      logger.error('Erro ao obter dados de aprendizado do usuário:', error);
      return null;
    }
  }

  async getBotConfig(): Promise<BotConfig | null> {
    try {
      const { data, error } = await supabase
        .from('bot_config')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Erro ao obter configuração do bot:', error);
      return null;
    }
  }

  async getRecentMessages(userId: string, limit: number = 50): Promise<ConversationMessage[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Erro ao obter mensagens recentes:', error);
      return [];
    }
  }

  async updateLearningData(userId: string, data: Partial<UserLearningData>) {
    try {
      await supabase.from('user_learning_data')
        .upsert({
          user_id: userId,
          ...data,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      logger.error('Erro ao atualizar dados de aprendizado:', error);
    }
  }
}

export default new DatabaseService();
