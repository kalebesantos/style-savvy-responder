
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

const execAsync = promisify(exec);

export class AudioService {
  private tempDir = path.join(process.cwd(), 'temp');

  constructor() {
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    let tempFilePath = '';
    
    try {
      // Save audio buffer to temporary file
      const timestamp = Date.now();
      tempFilePath = path.join(this.tempDir, `audio_${timestamp}.ogg`);
      fs.writeFileSync(tempFilePath, audioBuffer);

      // Use Whisper to transcribe
      const whisperModel = process.env.WHISPER_MODEL || 'base';
      const language = process.env.WHISPER_LANGUAGE || 'pt';
      
      const command = `whisper "${tempFilePath}" --model ${whisperModel} --language ${language} --output_format txt --output_dir "${this.tempDir}"`;
      
      logger.info('Transcribing audio with Whisper...');
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        logger.warn('Whisper stderr:', stderr);
      }

      // Read transcription result
      const txtFile = tempFilePath.replace('.ogg', '.txt');
      
      if (fs.existsSync(txtFile)) {
        const transcription = fs.readFileSync(txtFile, 'utf-8').trim();
        
        // Clean up temp files
        this.cleanupFile(tempFilePath);
        this.cleanupFile(txtFile);
        
        return transcription || '[Áudio sem conteúdo detectado]';
      } else {
        throw new Error('Transcription file not found');
      }

    } catch (error) {
      logger.error('Error transcribing audio:', error);
      
      // Clean up temp file if it exists
      if (tempFilePath) {
        this.cleanupFile(tempFilePath);
      }
      
      return '[Erro na transcrição do áudio]';
    }
  }

  private cleanupFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      logger.warn(`Error cleaning up file ${filePath}:`, error);
    }
  }

  async isWhisperAvailable(): Promise<boolean> {
    try {
      await execAsync('whisper --help');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new AudioService();
