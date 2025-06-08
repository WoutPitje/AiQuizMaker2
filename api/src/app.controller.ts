import { Controller, Get, Post, UploadedFile, UseInterceptors, BadRequestException, Body, Param, Res, Sse } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { QuizmakerService } from './quizmaker.service';
import { AiService } from './ai.service';
import { PdfToQuizOptions } from './models/quiz.model';
import { Response } from 'express';
import { Observable } from 'rxjs';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly quizmakerService: QuizmakerService,
    private readonly aiService: AiService,
    private readonly configService: ConfigService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
        cb(null, filename);
      },
    }),
    limits: {
      fileSize: parseInt(process.env.MAX_PDF_SIZE || '104857600'), // 100MB default (100 * 1024 * 1024)
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
  uploadFile(@UploadedFile() file: Express.Multer.File) {
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

    // Log file size for debugging
    const maxSizeBytes = parseInt(process.env.MAX_PDF_SIZE || '104857600');
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
    
    console.log(`📁 File uploaded: ${file.originalname}`);
    console.log(`📊 File size: ${Math.round(file.size / (1024 * 1024))}MB / ${maxSizeMB}MB max`);

    return {
      success: true,
      message: 'PDF file uploaded successfully',
      file: {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      }
    };
  }

  @Post('generate-quiz/:filename')
  async generateQuiz(
    @Param('filename') filename: string,
    @Body() options?: PdfToQuizOptions
  ) {
    try {
      const filePath = `./uploads/${filename}`;
      
      // Log the language selection
      if (options?.language) {
        console.log(`🌐 Generating quiz in language: ${options.language}`);
      }
      
      const result = await this.quizmakerService.pdfToQuiz(filePath, options);
      
      return {
        success: true,
        message: 'Quiz generated successfully',
        quiz: result.quiz,
        magicLink: result.magicLink,
        shareUrl: `${process.env.WEB_URL || 'http://localhost:3000'}/quiz/${result.magicLink}`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate quiz',
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
        supportedLanguages: this.aiService.getSupportedLanguages()
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

  @Post('generate-quiz-stream/:filename')
  generateQuizStream(
    @Param('filename') filename: string,
    @Res() response: Response,
    @Body() options: PdfToQuizOptions = {}
  ) {
    console.log('🌊 Streaming endpoint called!');
    console.log('📁 Filename:', filename);
    console.log('📋 Options:', options);
    
    const filePath = `./uploads/${filename}`;
    
    // Log the language selection
    if (options?.language) {
      console.log(`🌐 Streaming quiz generation in language: ${options.language}`);
    }
    
    // Set SSE headers
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Content-Type');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    
    // Start streaming
    const subscription = this.quizmakerService.pdfToQuizStream(filePath, options).subscribe({
      next: (data) => {
        response.write(`data: ${JSON.stringify(data)}\n\n`);
      },
      error: (error) => {
        response.write(`data: ${JSON.stringify({ type: 'error', data: { error: error.message } })}\n\n`);
        response.end();
      },
      complete: () => {
        response.end();
      }
    });
    
    // Handle client disconnect
    response.on('close', () => {
      subscription.unsubscribe();
    });
    
    return response;
  }
}