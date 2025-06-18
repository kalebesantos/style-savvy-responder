
import { createClient } from '@supabase/supabase-js';
import { BotConfig, WhatsAppUser, ConversationMessage, UserLearningData } from '../types';
import logger from '../utils/logger';

export class DatabaseService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    );
  }

  async getBotConfig(): Promise<BotConfig | null> {
    try {
      const { data, error } = await this.supabase
        .from('bot_config')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching bot config:', error);
      return null;
    }
  }

  async updateBotStatus(status: BotConfig['bot_status'], qrCode?: string) {
    try {
      const updateData: any = { bot_status: status };
      if (qrCode) updateData.last_qr_code = qrCode;

      const { error } = await this.supabase
        .from('bot_config')
        .update(updateData)
        .eq('id', (await this.getBotConfig())?.id);

      if (error) throw error;
      logger.info(`Bot status updated to: ${status}`);
    } catch (error) {
      logger.error('Error updating bot status:', error);
    }
  }

  async findOrCreateUser(phoneNumber: string, displayName?: string): Promise<WhatsAppUser | null> {
    try {
      // Try to find existing user
      let { data: user, error } = await this.supabase
        .from('whatsapp_users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (error && error.code === 'PGRST116') {
        // User doesn't exist, create new one
        const { data: newUser, error: createError } = await this.supabase
          .from('whatsapp_users')
          .insert({
            phone_number: phoneNumber,
            display_name: displayName,
            is_connected: true,
            connected_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;
        user = newUser;

        // Create learning data for new user
        await this.createUserLearningData(user.id);
      } else if (error) {
        throw error;
      } else {
        // Update existing user connection status
        await this.supabase
          .from('whatsapp_users')
          .update({
            is_connected: true,
            connected_at: new Date().toISOString(),
            last_activity: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      return user;
    } catch (error) {
      logger.error('Error finding/creating user:', error);
      return null;
    }
  }

  async createUserLearningData(userId: string) {
    try {
      const { error } = await this.supabase
        .from('user_learning_data')
        .insert({
          user_id: userId,
          message_count: 0,
          vocabulary_size: 0,
          learning_progress: 0.0,
          conversation_patterns: {},
          style_analysis: {}
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Error creating user learning data:', error);
    }
  }

  async saveMessage(message: Omit<ConversationMessage, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('conversation_history')
        .insert(message);

      if (error) throw error;

      // Update user activity
      await this.supabase
        .from('whatsapp_users')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', message.user_id);

      // Update message count in learning data
      await this.updateMessageCount(message.user_id);
    } catch (error) {
      logger.error('Error saving message:', error);
    }
  }

  async updateMessageCount(userId: string) {
    try {
      const { data: learningData } = await this.supabase
        .from('user_learning_data')
        .select('message_count')
        .eq('user_id', userId)
        .single();

      if (learningData) {
        await this.supabase
          .from('user_learning_data')
          .update({ 
            message_count: (learningData.message_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    } catch (error) {
      logger.error('Error updating message count:', error);
    }
  }

  async getUserLearningData(userId: string): Promise<UserLearningData | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_learning_data')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching user learning data:', error);
      return null;
    }
  }

  async setCurrentUser(userId: string) {
    try {
      const config = await this.getBotConfig();
      if (config) {
        await this.supabase
          .from('bot_config')
          .update({ current_user_id: userId })
          .eq('id', config.id);
      }
    } catch (error) {
      logger.error('Error setting current user:', error);
    }
  }
}

export default new DatabaseService();
