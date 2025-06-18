
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, MessageSquare, TrendingUp, Clock } from 'lucide-react';

interface LearningStatsProps {
  learningData?: {
    message_count: number;
    vocabulary_size: number;
    learning_progress: number;
    last_training_at?: string;
  };
}

const LearningStats = ({ learningData }: LearningStatsProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Estatísticas de Aprendizado</h3>
      </div>

      {!learningData ? (
        <div className="text-center py-8 text-muted-foreground">
          <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum dado de aprendizado disponível</p>
          <p className="text-sm">Conecte um usuário e faça upload do histórico</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <MessageSquare className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Mensagens Processadas</p>
                <p className="text-xl font-bold">{learningData.message_count.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Vocabulário</p>
                <p className="text-xl font-bold">{learningData.vocabulary_size.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Progresso do Aprendizado</p>
              <span className="text-sm text-muted-foreground">
                {Math.round(learningData.learning_progress)}%
              </span>
            </div>
            <Progress value={learningData.learning_progress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Iniciante</span>
              <span>Especialista</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Clock className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Último Treinamento</p>
              <p className="text-sm font-medium">{formatDate(learningData.last_training_at)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-green-50 rounded">
              <div className="text-green-600 font-bold text-lg">
                {learningData.learning_progress >= 70 ? '✓' : '○'}
              </div>
              <div className="text-xs text-green-700">Padrões</div>
            </div>
            <div className="p-2 bg-blue-50 rounded">
              <div className="text-blue-600 font-bold text-lg">
                {learningData.vocabulary_size >= 1000 ? '✓' : '○'}
              </div>
              <div className="text-xs text-blue-700">Vocabulário</div>
            </div>
            <div className="p-2 bg-purple-50 rounded">
              <div className="text-purple-600 font-bold text-lg">
                {learningData.message_count >= 100 ? '✓' : '○'}
              </div>
              <div className="text-xs text-purple-700">Contexto</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default LearningStats;
