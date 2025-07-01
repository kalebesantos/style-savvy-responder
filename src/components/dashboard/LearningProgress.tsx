
import { Card } from "@/components/ui/card";

interface LearningProgressProps {
  learningData?: {
    message_count: number;
    vocabulary_size: number;
    learning_progress: number;
  };
}

const LearningProgress = ({ learningData }: LearningProgressProps) => {
  if (!learningData || learningData.message_count === 0) {
    return null;
  }

  return (
    <Card className="p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">Progresso do Aprendizado</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{learningData.message_count}</p>
          <p className="text-sm text-muted-foreground">Mensagens Analisadas</p>
        </div>
        
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{learningData.vocabulary_size}</p>
          <p className="text-sm text-muted-foreground">Palavras no Vocabulário</p>
        </div>
        
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{Math.round(learningData.learning_progress)}%</p>
          <p className="text-sm text-muted-foreground">Progresso da IA</p>
        </div>
      </div>
    </Card>
  );
};

export default LearningProgress;
