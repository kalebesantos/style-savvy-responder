
import { Card } from "@/components/ui/card";

interface SystemLogsProps {
  logs: any[];
}

const SystemLogs = ({ logs }: SystemLogsProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Logs do Sistema</h3>
      
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
        {logs.slice(-20).map((log, index) => (
          <div key={index} className="mb-1">
            <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className={`ml-2 ${
              log.level === 'error' ? 'text-red-400' :
              log.level === 'warn' ? 'text-yellow-400' :
              log.level === 'info' ? 'text-blue-400' : 'text-green-400'
            }`}>
              [{log.level.toUpperCase()}]
            </span>
            <span className="ml-2">{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="text-gray-500">Aguardando logs do sistema...</p>
        )}
      </div>
    </Card>
  );
};

export default SystemLogs;
