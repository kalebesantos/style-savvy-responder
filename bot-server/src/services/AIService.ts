
import axios from 'axios';
import DatabaseService from '../config/database';
import logger from '../utils/logger';
import { AIResponse, ConversationMessage } from '../types';

class AIService {
  private lmStudioUrl: string;
  private model: string;

  constructor() {
    this.lmStudioUrl = process.env.LM_STUDIO_URL || 'http://localhost:1234';
    this.model = process.env.LM_STUDIO_MODEL || 'mixtral';
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

  async generateResponse(userId: string, message: string): Promise<AIResponse> {
    try {
      // Buscar dados de aprendizado do usuário
      const learningData = await DatabaseService.getUserLearningData(userId);
      
      // Buscar mensagens recentes para contexto
      const recentMessages = await DatabaseService.getRecentMessages(userId, 20);
      
      // Criar prompt personalizado baseado no aprendizado
      const personalizedPrompt = this.buildPersonalizedPrompt(message, learningData, recentMessages);
      
      // Fazer requisição para LM Studio
      const response = await axios.post(`${this.lmStudioUrl}/v1/chat/completions`, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: personalizedPrompt.systemPrompt
          },
          {
            role: 'user',
            content: personalizedPrompt.userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }, {
        timeout: 30000
      });

      const aiText = response.data.choices[0].message.content.trim();
      
      // Atualizar dados de aprendizado
      await this.updateLearningFromInteraction(userId, message, aiText);
      
      return {
        text: aiText,
        confidence: 0.8,
        learning_applied: !!learningData
      };
    } catch (error) {
      logger.error('Erro ao gerar resposta da IA:', error);
      return {
        text: 'Desculpe, não consegui processar sua mensagem no momento.',
        confidence: 0.1,
        learning_applied: false
      };
    }
  }

  private buildPersonalizedPrompt(message: string, learningData: any, recentMessages: ConversationMessage[]) {
    let systemPrompt = `Você é um assistente que imita o estilo de comunicação de uma pessoa específica no WhatsApp.`;
    
    if (learningData) {
      systemPrompt += `\n\nInformações sobre o estilo da pessoa:
      - Número de mensagens analisadas: ${learningData.message_count}
      - Progresso do aprendizado: ${Math.round(learningData.learning_progress)}%`;
      
      if (learningData.style_analysis && Object.keys(learningData.style_analysis).length > 0) {
        systemPrompt += `\n- Estilo de comunicação: ${JSON.stringify(learningData.style_analysis)}`;
      }
      
      if (learningData.conversation_patterns && Object.keys(learningData.conversation_patterns).length > 0) {
        systemPrompt += `\n- Padrões de conversa: ${JSON.stringify(learningData.conversation_patterns)}`;
      }
    }
    
    // Adicionar contexto das mensagens recentes
    if (recentMessages.length > 0) {
      systemPrompt += `\n\nMensagens recentes da conversa:`;
      recentMessages.slice(0, 10).reverse().forEach(msg => {
        const type = msg.message_type === 'incoming' ? 'Usuário' : 'Você';
        systemPrompt += `\n${type}: ${msg.content}`;
      });
    }
    
    systemPrompt += `\n\nResponda de forma natural, mantendo o estilo da pessoa. Seja conciso e use a linguagem típica do WhatsApp.`;
    
    return {
      systemPrompt,
      userMessage: message
    };
  }

  private async updateLearningFromInteraction(userId: string, userMessage: string, aiResponse: string) {
    try {
      const currentData = await DatabaseService.getUserLearningData(userId);
      
      const messageCount = (currentData?.message_count || 0) + 1;
      const vocabularySize = this.calculateVocabularySize(userMessage, currentData?.conversation_patterns || {});
      const learningProgress = Math.min(95, messageCount * 0.5); // Máximo 95%
      
      // Analisar padrões de conversa
      const updatedPatterns = this.analyzeConversationPatterns(userMessage, currentData?.conversation_patterns || {});
      
      // Analisar estilo
      const updatedStyleAnalysis = this.analyzeStyle(userMessage, currentData?.style_analysis || {});
      
      await DatabaseService.updateLearningData(userId, {
        message_count: messageCount,
        vocabulary_size: vocabularySize,
        learning_progress: learningProgress,
        conversation_patterns: updatedPatterns,
        style_analysis: updatedStyleAnalysis,
        last_training_at: new Date().toISOString()
      });
      
      logger.info(`Aprendizado atualizado para usuário ${userId}: ${messageCount} mensagens, ${Math.round(learningProgress)}% progresso`);
    } catch (error) {
      logger.error('Erro ao atualizar aprendizado:', error);
    }
  }

  private calculateVocabularySize(message: string, patterns: Record<string, any>): number {
    const words = message.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const existingWords = new Set(Object.keys(patterns.vocabulary || {}));
    words.forEach(word => existingWords.add(word));
    return existingWords.size;
  }

  private analyzeConversationPatterns(message: string, currentPatterns: Record<string, any>): Record<string, any> {
    const patterns = { ...currentPatterns };
    
    // Analisar comprimento das mensagens
    if (!patterns.message_lengths) patterns.message_lengths = [];
    patterns.message_lengths.push(message.length);
    if (patterns.message_lengths.length > 100) {
      patterns.message_lengths = patterns.message_lengths.slice(-50);
    }
    
    // Analisar vocabulário
    if (!patterns.vocabulary) patterns.vocabulary = {};
    const words = message.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 2) {
        patterns.vocabulary[word] = (patterns.vocabulary[word] || 0) + 1;
      }
    });
    
    // Analisar emojis
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu;
    const emojis = message.match(emojiRegex) || [];
    if (emojis.length > 0) {
      if (!patterns.emojis) patterns.emojis = {};
      emojis.forEach(emoji => {
        patterns.emojis[emoji] = (patterns.emojis[emoji] || 0) + 1;
      });
    }
    
    return patterns;
  }

  private analyzeStyle(message: string, currentStyle: Record<string, any>): Record<string, any> {
    const style = { ...currentStyle };
    
    // Analisar formalidade
    const formalWords = ['por favor', 'obrigado', 'desculpe', 'senhor', 'senhora'];
    const informalWords = ['oi', 'tchau', 'beleza', 'valeu', 'cara'];
    
    const formalCount = formalWords.filter(word => message.toLowerCase().includes(word)).length;
    const informalCount = informalWords.filter(word => message.toLowerCase().includes(word)).length;
    
    if (!style.formality_scores) style.formality_scores = [];
    style.formality_scores.push(formalCount - informalCount);
    if (style.formality_scores.length > 50) {
      style.formality_scores = style.formality_scores.slice(-25);
    }
    
    // Analisar uso de pontuação
    const exclamationCount = (message.match(/!/g) || []).length;
    const questionCount = (message.match(/\?/g) || []).length;
    
    if (!style.punctuation) style.punctuation = { exclamation: 0, question: 0, total_messages: 0 };
    style.punctuation.exclamation += exclamationCount;
    style.punctuation.question += questionCount;
    style.punctuation.total_messages += 1;
    
    // Analisar abreviações
    const abbreviations = ['vc', 'tb', 'pq', 'blz', 'flw', 'vlw'];
    const abbrevCount = abbreviations.filter(abbrev => message.toLowerCase().includes(abbrev)).length;
    
    if (!style.abbreviation_usage) style.abbreviation_usage = [];
    style.abbreviation_usage.push(abbrevCount);
    if (style.abbreviation_usage.length > 50) {
      style.abbreviation_usage = style.abbreviation_usage.slice(-25);
    }
    
    return style;
  }
}

export default new AIService();
