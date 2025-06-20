import { Injectable, Logger } from '@nestjs/common';
import { GcsService } from './gcs.service';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly gcsService: GcsService) {
    // Ensure local directories exist for development
    this.ensureLocalDirectories();
  }

  private ensureLocalDirectories() {
    const dirs = ['./uploads', './quiz-storage'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.log(`Created local directory: ${dir}`);
      }
    });
  }

  async uploadFile(
    filename: string,
    buffer: Buffer,
    type: 'uploads' | 'quiz-storage',
  ): Promise<string> {
    if (this.gcsService.isEnabled()) {
      return this.gcsService.uploadFile(filename, buffer, type);
    } else {
      // Local storage fallback
      const dir = type === 'uploads' ? './uploads' : './quiz-storage';
      const filePath = path.join(dir, filename);
      await fsPromises.writeFile(filePath, buffer);
      this.logger.log(`Saved file locally: ${filePath}`);
      return filename;
    }
  }

  async downloadFile(
    filename: string,
    type: 'uploads' | 'quiz-storage',
  ): Promise<Buffer> {
    if (this.gcsService.isEnabled()) {
      return this.gcsService.downloadFile(filename, type);
    } else {
      // Local storage fallback
      const dir = type === 'uploads' ? './uploads' : './quiz-storage';
      const filePath = path.join(dir, filename);
      return fsPromises.readFile(filePath);
    }
  }

  async deleteFile(
    filename: string,
    type: 'uploads' | 'quiz-storage',
  ): Promise<void> {
    if (this.gcsService.isEnabled()) {
      return this.gcsService.deleteFile(filename, type);
    } else {
      // Local storage fallback
      const dir = type === 'uploads' ? './uploads' : './quiz-storage';
      const filePath = path.join(dir, filename);
      await fsPromises.unlink(filePath);
      this.logger.log(`Deleted file locally: ${filePath}`);
    }
  }

  async listFiles(type: 'uploads' | 'quiz-storage'): Promise<string[]> {
    if (this.gcsService.isEnabled()) {
      return this.gcsService.listFiles(type);
    } else {
      // Local storage fallback
      const dir = type === 'uploads' ? './uploads' : './quiz-storage';
      const files = await fsPromises.readdir(dir);
      return files;
    }
  }

  async fileExists(
    filename: string,
    type: 'uploads' | 'quiz-storage',
  ): Promise<boolean> {
    if (this.gcsService.isEnabled()) {
      return this.gcsService.fileExists(filename, type);
    } else {
      // Local storage fallback
      const dir = type === 'uploads' ? './uploads' : './quiz-storage';
      const filePath = path.join(dir, filename);
      try {
        await fsPromises.access(filePath);
        return true;
      } catch {
        return false;
      }
    }
  }

  async getFileMetadata(
    filename: string,
    type: 'uploads' | 'quiz-storage',
  ): Promise<any> {
    if (this.gcsService.isEnabled()) {
      return this.gcsService.getFileMetadata(filename, type);
    } else {
      // Local storage fallback
      const dir = type === 'uploads' ? './uploads' : './quiz-storage';
      const filePath = path.join(dir, filename);
      const stats = await fsPromises.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        updated: stats.mtime,
      };
    }
  }

  async saveQuizData(quizId: string, data: any): Promise<void> {
    const filename = `${quizId}.json`;
    const buffer = Buffer.from(JSON.stringify(data, null, 2));
    await this.uploadFile(filename, buffer, 'quiz-storage');
  }

  async loadQuizData(quizId: string): Promise<any> {
    const filename = `${quizId}.json`;
    const buffer = await this.downloadFile(filename, 'quiz-storage');
    return JSON.parse(buffer.toString());
  }

  async saveTempQuizData(tempId: string, data: any): Promise<void> {
    const filename = `temp_${tempId}.json`;
    const buffer = Buffer.from(JSON.stringify(data, null, 2));
    await this.uploadFile(filename, buffer, 'quiz-storage');
  }

  async loadTempQuizData(tempId: string): Promise<any> {
    const filename = `temp_${tempId}.json`;
    const buffer = await this.downloadFile(filename, 'quiz-storage');
    return JSON.parse(buffer.toString());
  }
} 