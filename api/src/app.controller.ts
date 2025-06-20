import { Controller, Get, Post, UploadedFile, UseInterceptors, BadRequestException, Body, Param, Res, Sse, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { QuizmakerService } from './quizmaker.service';
import { AiService } from './ai.service';
import { StorageService } from './storage.service';
import { PdfToQuizOptions } from './models/quiz.model';
import { Response, Request } from 'express';
import { Observable } from 'rxjs';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly quizmakerService: QuizmakerService,
    private readonly aiService: AiService,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    // No diskStorage - handle files in memory for GCS upload
    limits: {
      fileSize: parseInt(process.env.MAX_PDF_SIZE || '104857600'), // 100MB default
    },
    fileFilter: (req, file, cb) => {
      // Only allow PDF files
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only PDF files are allowed'), false);
      }
    },
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return {
        success: false,
        message: 'No PDF file uploaded',
        error: 'FILE_NOT_PROVIDED'
      };
    }

    // Double-check the file type on the server side
    if (file.mimetype !== 'application/pdf') {
      return {
        success: false,
        message: 'Only PDF files are allowed',
        error: 'INVALID_FILE_TYPE'
      };
    }

    try {
      // Generate unique filename with timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = extname(file.originalname);
      const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;

      // Upload to proper storage (GCS in production, local in development)
      await this.storageService.uploadFile(filename, file.buffer, 'uploads');

      // Log file size for debugging
      const maxSizeBytes = parseInt(process.env.MAX_PDF_SIZE || '104857600');
      const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
      const storageType = await this.getStorageInfo();
      
      console.log(`📁 File uploaded: ${file.originalname} -> ${filename}`);
      console.log(`📊 File size: ${Math.round(file.size / (1024 * 1024))}MB / ${maxSizeMB}MB max`);
      console.log(`🗄️  Storage: ${storageType}`);

      return {
        success: true,
        message: 'PDF file uploaded successfully',
        file: {
          filename: filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        },
        storage: storageType
      };
    } catch (error) {
      console.error('Failed to upload file:', error);
      return {
        success: false,
        message: 'Failed to upload file to storage',
        error: error.message
      };
    }
  }

  @Get('languages')
  getSupportedLanguages() {
    try {
      const languages = this.aiService.getSupportedLanguages();
      
      return {
        success: true,
        languages,
        count: languages.length
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve supported languages',
        error: error.message
      };
    }
  }

  @Get('config')
  getConfig() {
    const maxSizeBytes = parseInt(process.env.MAX_PDF_SIZE || '104857600');
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
    
    return {
      success: true,
      config: {
        maxPdfSize: maxSizeBytes,
        maxPdfSizeMB: maxSizeMB,
        maxPagesPerPdf: parseInt(process.env.MAX_PAGES_PER_PDF || '50'),
        defaultQuestionsPerPage: parseInt(process.env.DEFAULT_QUESTIONS_PER_PAGE || '2'),
        supportedLanguages: this.aiService.getSupportedLanguages(),
        storage: {
          gcsEnabled: !!(process.env.UPLOADS_BUCKET && process.env.QUIZ_STORAGE_BUCKET),
          uploadsBucket: process.env.UPLOADS_BUCKET ? '✓ Configured' : '✗ Missing',
          quizStorageBucket: process.env.QUIZ_STORAGE_BUCKET ? '✓ Configured' : '✗ Missing',
          gcpProjectId: process.env.GCP_PROJECT_ID ? '✓ Configured' : '✗ Missing'
        }
      }
    };
  }

  @Get('quiz/magic/:magicLink')
  async getQuizByMagicLink(@Param('magicLink') magicLink: string) {
    try {
      const quiz = await this.quizmakerService.getQuizByMagicLink(magicLink);
      
      if (!quiz) {
        return {
          success: false,
          message: 'Quiz not found',
          error: 'QUIZ_NOT_FOUND'
        };
      }
      
      return {
        success: true,
        quiz
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve quiz',
        error: error.message
      };
    }
  }

  @Get('quiz/:quizId')
  async getQuiz(@Param('quizId') quizId: string) {
    try {
      const quiz = await this.quizmakerService.getQuizById(quizId);
      
      if (!quiz) {
        return {
          success: false,
          message: 'Quiz not found',
          error: 'QUIZ_NOT_FOUND'
        };
      }
      
      return {
        success: true,
        quiz
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve quiz',
        error: error.message
      };
    }
  }

  @Get('quizzes')
  async listQuizzes() {
    try {
      const result = await this.quizmakerService.listQuizzes();
      
      return {
        success: true,
        quizzes: result.quizzes,
        total: result.total,
        count: result.quizzes.length
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to list quizzes',
        error: error.message
      };
    }
  }

  @Post('quiz/generate-stream/:filename')
  async generateQuizStream(
    @Param('filename') filename: string,
    @Res() response: Response,
    @Body() options: PdfToQuizOptions = {}
  ) {
    try {
      response.setHeader('Content-Type', 'text/event-stream');
      response.setHeader('Cache-Control', 'no-cache');
      response.setHeader('Connection', 'keep-alive');
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      // Check if file exists in storage
      const fileExists = await this.storageService.fileExists(filename, 'uploads');
      if (!fileExists) {
        response.write(`data: ${JSON.stringify({ 
          type: 'error', 
          message: 'File not found', 
          error: 'FILE_NOT_FOUND' 
        })}\n\n`);
        response.end();
        return;
      }

      // Start quiz generation with filename (StorageService will handle the file access)
      const quizStream = this.quizmakerService.pdfToQuizStream(filename, options);

      quizStream.subscribe({
        next: (data) => {
          response.write(`data: ${JSON.stringify(data)}\n\n`);
        },
        error: (error) => {
          console.error('Quiz generation error:', error);
          response.write(`data: ${JSON.stringify({ 
            type: 'error', 
            message: 'Quiz generation failed', 
            error: error.message 
          })}\n\n`);
          response.end();
        },
        complete: () => {
          response.end();
        }
      });

    } catch (error) {
      console.error('Failed to start quiz generation:', error);
      response.status(500).json({
        success: false,
        message: 'Failed to start quiz generation',
        error: error.message
      });
    }
  }

  @Post('cleanup-files')
  async cleanupFiles(@Body() options?: { olderThanHours?: number }) {
    try {
      const olderThanHours = options?.olderThanHours || 24;
      const result = await this.quizmakerService.cleanupOldUploadedFiles(olderThanHours);
      
      return {
        success: true,
        message: `Cleanup completed: ${result.cleaned} files removed`,
        cleaned: result.cleaned,
        errors: result.errors
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to cleanup files',
        error: error.message
      };
    }
  }

  @Get('files')
  async listUploadedFiles() {
    try {
      const files = await this.storageService.listFiles('uploads');
      const storageType = await this.getStorageInfo();
      
      const fileDetails = await Promise.all(
        files.map(async (filename) => {
          try {
            const metadata = await this.storageService.getFileMetadata(filename, 'uploads');
            return {
              filename,
              originalName: this.extractOriginalName(filename),
              size: this.getMetadataSize(metadata),
              sizeFormatted: this.formatFileSize(this.getMetadataSize(metadata)),
              created: this.getMetadataDate(metadata, 'created'),
              modified: this.getMetadataDate(metadata, 'updated'),
              downloadUrl: `/files/${filename}`
            };
          } catch (error) {
            console.warn(`Could not get metadata for ${filename}:`, error.message);
            return {
              filename,
              originalName: this.extractOriginalName(filename),
              size: 0,
              sizeFormatted: '0 B',
              created: new Date(),
              modified: new Date(),
              downloadUrl: `/files/${filename}`
            };
          }
        })
      );

      const sortedFiles = fileDetails.sort((a, b) => 
        new Date(b.created).getTime() - new Date(a.created).getTime()
      );

      return {
        success: true,
        files: sortedFiles,
        total: sortedFiles.length,
        totalSize: sortedFiles.reduce((sum, file) => sum + file.size, 0),
        totalSizeFormatted: this.formatFileSize(sortedFiles.reduce((sum, file) => sum + file.size, 0)),
        storage: storageType
      };
    } catch (error) {
      console.error('Failed to list files:', error);
      return {
        success: false,
        message: 'Failed to list files',
        error: error.message
      };
    }
  }

  @Get('files/:filename')
  async downloadFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const buffer = await this.storageService.downloadFile(filename, 'uploads');
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      });
      
      res.send(buffer);
    } catch (error) {
      console.error(`Failed to download file ${filename}:`, error);
      res.status(404).json({
        success: false,
        message: 'File not found',
        error: error.message
      });
    }
  }

  @Get('files/:filename/info')
  async getFileInfo(@Param('filename') filename: string) {
    try {
      const exists = await this.storageService.fileExists(filename, 'uploads');
      
      if (!exists) {
        return {
          success: false,
          message: 'File not found'
        };
      }

      const metadata = await this.storageService.getFileMetadata(filename, 'uploads');
      const storageType = await this.getStorageInfo();
      
      return {
        success: true,
        file: {
          filename,
          size: this.getMetadataSize(metadata),
          sizeFormatted: this.formatFileSize(this.getMetadataSize(metadata)),
          created: this.getMetadataDate(metadata, 'created'),
          modified: this.getMetadataDate(metadata, 'updated')
        },
        storage: storageType
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get file info',
        error: error.message
      };
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getClientIP(req: Request): string {
    return req.headers['x-forwarded-for'] as string || 
           req.headers['x-real-ip'] as string || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           'unknown';
  }

  private async getStorageInfo(): Promise<string> {
    const gcsEnabled = process.env.UPLOADS_BUCKET && process.env.QUIZ_STORAGE_BUCKET;
    return gcsEnabled ? 'Google Cloud Storage' : 'Local Storage';
  }

  private extractOriginalName(filename: string): string {
    // Extract original name from generated filename (format: file-timestamp-random.ext)
    if (filename.includes('-') && filename.split('-').length >= 3) {
      const parts = filename.split('-');
      return parts.slice(2).join('-'); // Remove "file" and timestamp parts
    }
    return filename;
  }

  private getMetadataSize(metadata: any): number {
    return metadata.size || metadata.contentLength || 0;
  }

  private getMetadataDate(metadata: any, type: 'created' | 'updated'): Date {
    if (type === 'created') {
      return new Date(metadata.created || metadata.timeCreated || metadata.birthtime || Date.now());
    } else {
      return new Date(metadata.updated || metadata.timeUpdated || metadata.mtime || Date.now());
    }
  }
}