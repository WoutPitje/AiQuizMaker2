import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { Readable } from 'stream';

@Injectable()
export class GcsService {
  private storage: Storage;
  private uploadsBucket: string;
  private quizStorageBucket: string;
  private readonly logger = new Logger(GcsService.name);

  constructor() {
    // Initialize GCS client
    this.storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
    });

    this.uploadsBucket = process.env.UPLOADS_BUCKET || '';
    this.quizStorageBucket = process.env.QUIZ_STORAGE_BUCKET || '';

    // Use local storage if buckets are not configured (for local development)
    if (!this.uploadsBucket || !this.quizStorageBucket) {
      this.logger.warn('GCS buckets not configured, will use local storage');
    }
  }

  private isGcsEnabled(): boolean {
    return !!(this.uploadsBucket && this.quizStorageBucket);
  }

  async uploadFile(
    filename: string,
    buffer: Buffer,
    bucketType: 'uploads' | 'quiz-storage',
  ): Promise<string> {
    if (!this.isGcsEnabled()) {
      throw new Error('GCS not configured');
    }

    const bucketName = bucketType === 'uploads' ? this.uploadsBucket : this.quizStorageBucket;
    const bucket = this.storage.bucket(bucketName);
    const file = bucket.file(filename);

    const stream = file.createWriteStream({
      metadata: {
        contentType: this.getContentType(filename),
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (err) => {
        this.logger.error(`Failed to upload ${filename}:`, err);
        reject(err);
      });

      stream.on('finish', () => {
        this.logger.log(`Successfully uploaded ${filename} to ${bucketName}`);
        resolve(filename);
      });

      stream.end(buffer);
    });
  }

  async downloadFile(
    filename: string,
    bucketType: 'uploads' | 'quiz-storage',
  ): Promise<Buffer> {
    if (!this.isGcsEnabled()) {
      throw new Error('GCS not configured');
    }

    const bucketName = bucketType === 'uploads' ? this.uploadsBucket : this.quizStorageBucket;
    const bucket = this.storage.bucket(bucketName);
    const file = bucket.file(filename);

    try {
      const [buffer] = await file.download();
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to download ${filename}:`, error);
      throw error;
    }
  }

  async deleteFile(
    filename: string,
    bucketType: 'uploads' | 'quiz-storage',
  ): Promise<void> {
    if (!this.isGcsEnabled()) {
      throw new Error('GCS not configured');
    }

    const bucketName = bucketType === 'uploads' ? this.uploadsBucket : this.quizStorageBucket;
    const bucket = this.storage.bucket(bucketName);
    const file = bucket.file(filename);

    try {
      await file.delete();
      this.logger.log(`Successfully deleted ${filename} from ${bucketName}`);
    } catch (error) {
      this.logger.error(`Failed to delete ${filename}:`, error);
      throw error;
    }
  }

  async listFiles(bucketType: 'uploads' | 'quiz-storage'): Promise<string[]> {
    if (!this.isGcsEnabled()) {
      throw new Error('GCS not configured');
    }

    const bucketName = bucketType === 'uploads' ? this.uploadsBucket : this.quizStorageBucket;
    const bucket = this.storage.bucket(bucketName);

    try {
      const [files] = await bucket.getFiles();
      return files.map(file => file.name);
    } catch (error) {
      this.logger.error(`Failed to list files in ${bucketName}:`, error);
      throw error;
    }
  }

  async fileExists(
    filename: string,
    bucketType: 'uploads' | 'quiz-storage',
  ): Promise<boolean> {
    if (!this.isGcsEnabled()) {
      throw new Error('GCS not configured');
    }

    const bucketName = bucketType === 'uploads' ? this.uploadsBucket : this.quizStorageBucket;
    const bucket = this.storage.bucket(bucketName);
    const file = bucket.file(filename);

    try {
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      this.logger.error(`Failed to check if ${filename} exists:`, error);
      return false;
    }
  }

  async getFileMetadata(
    filename: string,
    bucketType: 'uploads' | 'quiz-storage',
  ): Promise<any> {
    if (!this.isGcsEnabled()) {
      throw new Error('GCS not configured');
    }

    const bucketName = bucketType === 'uploads' ? this.uploadsBucket : this.quizStorageBucket;
    const bucket = this.storage.bucket(bucketName);
    const file = bucket.file(filename);

    try {
      const [metadata] = await file.getMetadata();
      return metadata;
    } catch (error) {
      this.logger.error(`Failed to get metadata for ${filename}:`, error);
      throw error;
    }
  }

  private getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'application/pdf';
      case 'json':
        return 'application/json';
      case 'txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  }

  isEnabled(): boolean {
    return this.isGcsEnabled();
  }
} 