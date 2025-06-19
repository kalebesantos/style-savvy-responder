import { supabase } from './supabaseClient';
import { BotConfig, WhatsAppUser, ConversationMessage, UserLearningData } from '../types';
import logger from '../utils/logger';

class DatabaseService {
  async updateBotStatus(status: string, qr_code?: string) {
    try {
      await supabase.from('bot_status').upsert({
        id: 1,
        status,
        qr_code,
        updated_at: new Date().toISOString()
      });
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
        .insert([{ phone_number: phone, display_name: name || '' }])
        .select()
        .single();

      if (insertError) throw insertError;
      return created;
    } catch (error) {
      logger.error('Erro ao buscar/criar usuário:', error);
      return null;
    }
  }

  async setCurrentUser(userId: number) {
    try {
      await supabase.from('bot_status').update({
        current_user_id: userId
      }).eq('id', 1);
    } catch (error) {
      logger.error('Erro ao definir usuário atual:', error);
    }
  }

  async saveMessage(message: ConversationMessage) {
    try {
      await supabase.from('messages').insert([message]);
    } catch (error) {
      logger.error('Erro ao salvar mensagem:', error);
    }
  }

  async getUserLearningData(userId: number): Promise<UserLearningData | null> {
    try {
      const { data, error } = await supabase
        .from('user_learning')
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
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Erro ao obter configuração do bot:', error);
      return null;
    }
  }
}

export default new DatabaseService();
