
import axios from 'axios';
import { AIResponse, UserLearningData } from '../types';
import logger from '../utils/logger';

export class AIService {
  private lmStudioUrl: string;
  private modelName: string;

  constructor() {
    this.lmStudioUrl = process.env.LM_STUDIO_URL || 'http://localhost:1234';
    this.modelName = process.env.LM_STUDIO_MODEL || 'mixtral';
  }

  async generateResponse(
    message: string, 
    userLearningData?: UserLearningData,
    conversationHistory: string[] = []
  ): Promise<AIResponse> {
    try {
      const startTime = Date.now();
      
      // Build context based on user's learning data
      const systemPrompt = this.buildSystemPrompt(userLearningData);
      const contextMessages = this.buildContextMessages(conversationHistory);

      const response = await axios.post(`${this.lmStudioUrl}/v1/chat/completions`, {
        model: this.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          ...contextMessages,
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      });

      const aiResponse = response.data.choices[0].message.content;
      const processingTime = Date.now() - startTime;

      logger.info(`AI response generated in ${processingTime}ms`);

      return {
        text: aiResponse,
        processing_time: processingTime,
        confidence: 0.8 // Mock confidence score
      };
    } catch (error) {
      logger.error('Error generating AI response:', error);
      
      // Fallback response
      return {
        text: 'Desculpe, estou com dificuldades técnicas no momento. Pode repetir sua mensagem?',
        confidence: 0.1
      };
    }
  }

  private buildSystemPrompt(learningData?: UserLearningData): string {
    let prompt = `Você é um assistente pessoal inteligente que aprende com as conversas do usuário para responder de forma personalizada.

INSTRUÇÕES GERAIS:
- Responda sempre em português brasileiro
- Seja natural e conversacional
- Use o conhecimento do usuário para personalizar respostas
- Mantenha um tom amigável e prestativo`;

    if (learningData) {
      const patterns = learningData.conversation_patterns as any;
      const style = learningData.style_analysis as any;

      if (patterns?.frequent_topics) {
        prompt += `\n\nTÓPICS FREQUENTES DO USUÁRIO: ${patterns.frequent_topics.join(', ')}`;
      }

      if (style?.tone) {
        prompt += `\n\nTOM PREFERIDO: ${style.tone}`;
      }

      if (learningData.vocabulary_size > 0) {
        prompt += `\n\nVOCABULÁRIO CONHECIDO: ${learningData.vocabulary_size} palavras`;
      }

      if (learningData.message_count > 10) {
        prompt += `\n\nESTATÍSTICAS: ${learningData.message_count} mensagens processadas, ${Math.round(learningData.learning_progress)}% de progresso de aprendizado`;
      }
    }

    return prompt;
  }

  private buildContextMessages(history: string[]): Array<{role: string, content: string}> {
    // Use last 5 messages for context
    const recentHistory = history.slice(-5);
    const messages = [];

    for (let i = 0; i < recentHistory.length; i++) {
      const role = i % 2 === 0 ? 'user' : 'assistant';
      messages.push({ role, content: recentHistory[i] });
    }

    return messages;
  }

  async isServiceAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.lmStudioUrl}/v1/models`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export default new AIService();
