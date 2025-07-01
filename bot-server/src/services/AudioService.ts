
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

class AudioService {
  private whisperModel: string;
  private whisperLanguage: string;

  constructor() {
    this.whisperModel = process.env.WHISPER_MODEL || 'base';
    this.whisperLanguage = process.env.WHISPER_LANGUAGE || 'pt';
  }

  async isWhisperAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const whisper = spawn('whisper', ['--help']);
      
      whisper.on('error', () => {
        resolve(false);
      });
      
      whisper.on('close', (code) => {
        resolve(code === 0);
      });
      
      setTimeout(() => {
        whisper.kill();
        resolve(false);
      }, 5000);
    });
  }

  async transcribeAudio(audioPath: string): Promise<string | null> {
    try {
      if (!fs.existsSync(audioPath)) {
        logger.error('Arquivo de áudio não encontrado:', audioPath);
        return null;
      }

      const outputDir = path.dirname(audioPath);
      
      return new Promise((resolve, reject) => {
        const whisper = spawn('whisper', [
          audioPath,
          '--model', this.whisperModel,
          '--language', this.whisperLanguage,
          '--output_dir', outputDir,
          '--output_format', 'txt'
        ]);

        let errorOutput = '';

        whisper.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        whisper.on('close', (code) => {
          if (code === 0) {
            // Ler arquivo de transcrição
            const baseName = path.basename(audioPath, path.extname(audioPath));
            const transcriptPath = path.join(outputDir, `${baseName}.txt`);
            
            try {
              if (fs.existsSync(transcriptPath)) {
                const transcript = fs.readFileSync(transcriptPath, 'utf8').trim();
                
                // Limpar arquivo temporário
                fs.unlinkSync(transcriptPath);
                
                resolve(transcript);
              } else {
                logger.error('Arquivo de transcrição não foi criado');
                resolve(null);
              }
            } catch (error) {
              logger.error('Erro ao ler transcrição:', error);
              resolve(null);
            }
          } else {
            logger.error('Erro na transcrição do Whisper:', errorOutput);
            reject(new Error(`Whisper failed with code ${code}`));
          }
        });

        whisper.on('error', (error) => {
          logger.error('Erro ao executar Whisper:', error);
          reject(error);
        });
      });
    } catch (error) {
      logger.error('Erro na transcrição de áudio:', error);
      return null;
    }
  }

  async processAudioMessage(audioBuffer: Buffer, messageId: string): Promise<string | null> {
    try {
      // Criar diretório temporário se não existir
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Salvar áudio temporariamente
      const audioPath = path.join(tempDir, `${messageId}.ogg`);
      fs.writeFileSync(audioPath, audioBuffer);

      // Transcrever
      const transcript = await this.transcribeAudio(audioPath);

      // Limpar arquivo temporário
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }

      return transcript;
    } catch (error) {
      logger.error('Erro ao processar mensagem de áudio:', error);
      return null;
    }
  }
}

export default new AudioService();
