import { Injectable, Logger } from '@nestjs/common';
import { FileServerService } from './file-server.service';
import { AiService } from './ai.service';
import { Quiz, QuizQuestion, PdfToQuizOptions } from './models/quiz.model';
import { PdfProcessingResult } from './models/pdf.model';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import { Observable, Subject } from 'rxjs';
import { StorageService } from './storage.service';

@Injectable()
export class QuizmakerService {
  private readonly logger = new Logger(QuizmakerService.name);
  private readonly quizStorageDir = './quiz-storage';

  constructor(
    private readonly fileServerService: FileServerService,
    private readonly aiService: AiService,
    private readonly storageService: StorageService
  ) {
    this.initializeStorage();
  }

  /**
   * Initialize quiz storage directory for local fallback
   */
  private async initializeStorage() {
    try {
      await fs.mkdir(this.quizStorageDir, { recursive: true });
      this.logger.log(`📁 Quiz storage directory initialized: ${this.quizStorageDir}`);
    } catch (error) {
      this.logger.error(`❌ Failed to initialize quiz storage directory: ${error.message}`);
    }
  }

  /**
   * Generate a secure magic link for quiz access
   */
  private generateMagicLink(): string {
    // Generate a cryptographically secure random string
    const randomBytes = crypto.randomBytes(32);
    const magicLink = randomBytes.toString('base64url'); // URL-safe base64
    return magicLink;
  }

  /**
   * Save quiz to storage service
   */
  async saveQuiz(quiz: any): Promise<void> {
    try {
      await this.storageService.saveQuizData(quiz.id, quiz);
      this.logger.log(`Quiz saved: ${quiz.id}`);
    } catch (error) {
      this.logger.error(`Failed to save quiz ${quiz.id}:`, error);
      throw error;
    }
  }

  /**
   * Get quiz by magic link
   */
  async getQuizByMagicLink(magicLink: string): Promise<any> {
    try {
      const quiz = await this.storageService.loadQuizData(magicLink);
      return quiz;
    } catch (error) {
      this.logger.warn(`Quiz not found for magic link: ${magicLink}`);
      return null;
    }
  }

  /**
   * Get quiz by ID (backwards compatibility)
   */
  async getQuizById(quizId: string): Promise<Quiz | null> {
    try {
      this.logger.log(`🔍 Retrieving quiz with ID: ${quizId}`);
      
      // Check if it's a magic link format (base64url)
      if (quizId.match(/^[A-Za-z0-9_-]+$/)) {
        return await this.getQuizByMagicLink(quizId);
      }

      // Search through stored quizzes using storage service
      const files = await this.storageService.listFiles('quiz-storage');
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const quizId_from_file = file.replace('.json', '');
            const quiz = await this.storageService.loadQuizData(quizId_from_file);
            
            if (quiz.id === quizId) {
              this.logger.log(`✅ Quiz found by ID: ${quiz.title}`);
              return quiz;
            }
          } catch (error) {
            this.logger.warn(`Failed to load quiz file ${file}:`, error.message);
          }
        }
      }

      this.logger.warn(`❌ Quiz not found with ID: ${quizId}`);
      return null;

    } catch (error) {
      this.logger.error(`❌ Failed to retrieve quiz by ID: ${error.message}`);
      return null;
    }
  }

  /**
   * List all quizzes with pagination
   */
  async listQuizzes(): Promise<{ quizzes: any[], total: number }> {
    try {
      const files = await this.storageService.listFiles('quiz-storage');
      const quizFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('temp_'));
      
      const quizzes = await Promise.allSettled(
        quizFiles.map(async (filename) => {
          const quizId = filename.replace('.json', '');
          return await this.storageService.loadQuizData(quizId);
        })
      );

      const validQuizzes = quizzes
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(quiz => quiz !== null);

      return {
        quizzes: validQuizzes,
        total: validQuizzes.length
      };
    } catch (error) {
      this.logger.error('Failed to list quizzes:', error);
      return { quizzes: [], total: 0 };
    }
  }

  /**
   * Delete quiz by magic link
   */
  async deleteQuizByMagicLink(magicLink: string): Promise<boolean> {
    try {
      await this.storageService.deleteFile(`${magicLink}.json`, 'quiz-storage');
      this.logger.log(`🗑️ Quiz deleted successfully: ${magicLink}`);
      return true;
    } catch (error) {
      this.logger.warn(`❌ Failed to delete quiz: ${magicLink} - ${error.message}`);
      return false;
    }
  }

  /**
   * Cleanup old uploaded files - now works with storage service
   */
  async cleanupOldUploadedFiles(olderThanHours: number = 24): Promise<{ cleaned: number; errors: string[] }> {
    let cleaned = 0;
    const errors: string[] = [];

    try {
      const files = await this.storageService.listFiles('uploads');
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);

      for (const file of files) {
        try {
          const metadata = await this.storageService.getFileMetadata(file, 'uploads');
          const fileTime = new Date(metadata.created || metadata.timeCreated || 0).getTime();
          
          if (fileTime < cutoffTime) {
            await this.storageService.deleteFile(file, 'uploads');
            cleaned++;
            this.logger.log(`🗑️ Cleaned up old file: ${file} (${Math.round((Date.now() - fileTime) / (1000 * 60 * 60))}h old)`);
          }
        } catch (error) {
          const errorMsg = `Failed to process file ${file}: ${error.message}`;
          errors.push(errorMsg);
          this.logger.warn(`⚠️ ${errorMsg}`);
        }
      }

      this.logger.log(`🧹 Cleanup completed: ${cleaned} files removed, ${errors.length} errors`);
      return { cleaned, errors };

    } catch (error) {
      const errorMsg = `Failed to list files for cleanup: ${error.message}`;
      errors.push(errorMsg);
      this.logger.error(`❌ ${errorMsg}`);
      return { cleaned, errors };
    }
  }

  /**
   * Process PDF to quiz stream - now works with storage service
   * @param filename - filename of the uploaded PDF in storage
   * @param options - quiz generation options
   */
  pdfToQuizStream(filename: string, options: PdfToQuizOptions = {}): Observable<any> {
    const subject = new Subject<any>();
    
    // Start the streaming generation process
    this.generateQuizStreamingProcess(filename, options, subject);
    
    return subject.asObservable();
  }

  private async generateQuizStreamingProcess(
    filename: string, 
    options: PdfToQuizOptions, 
    subject: Subject<any>
  ) {
    const defaultOptions: Required<PdfToQuizOptions> = {
      questionsPerPage: options.questionsPerPage ?? parseInt(process.env.DEFAULT_QUESTIONS_PER_PAGE || '2'),
      difficulty: options.difficulty ?? 'mixed',
      includeExplanations: options.includeExplanations ?? true,
      generateImages: options.generateImages ?? false,
      language: options.language ?? 'en'
    };

    const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let tempFilePath: string | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;

    try {
      // Emit start event
      subject.next({
        type: 'start',
        data: {
          quizId,
          message: 'Starting quiz generation...',
          options: defaultOptions
        }
      });

      this.logger.log(`🎯 Starting streaming PDF to quiz conversion for: ${filename}`);

      // Step 1: Download file from storage and save to temp location for processing
      subject.next({
        type: 'progress',
        data: { message: 'Downloading PDF file from storage...', stage: 'file-download' }
      });

      const fileBuffer = await this.storageService.downloadFile(filename, 'uploads');
      const tempFilePath = path.join('./uploads', `temp_${Date.now()}_${filename}`);
      
      // Create temp file for processing
      await fs.writeFile(tempFilePath, fileBuffer);
      
      // Step 2: Create temporary quiz storage file
      const tempQuizPath = await this.createTempQuizFile(quizId);

      // Step 3: Process PDF file
      subject.next({
        type: 'progress',
        data: { message: 'Processing PDF file...', stage: 'pdf-processing' }
      });

      const fileResult = await this.fileServerService.splitPdfToPages(tempFilePath, defaultOptions.generateImages);

      if (!fileResult.pages || fileResult.pages.length === 0) {
        throw new Error('No readable content found in the PDF');
      }

      const maxPages = parseInt(process.env.MAX_PAGES_PER_PDF || '50');
      const pagesToProcess = fileResult.pages.slice(0, maxPages);

      subject.next({
        type: 'pdf-processed',
        data: {
          totalPages: fileResult.totalPages,
          pagesToProcess: pagesToProcess.length,
          message: `PDF processed: ${pagesToProcess.length} pages to analyze`
        }
      });

      this.logger.log(`📄 PDF processing completed: ${fileResult.pages.length} pages extracted`);

      let totalQuestions = 0;
      
      // Send periodic heartbeat to keep connection alive
      heartbeatInterval = setInterval(() => {
        subject.next({
          type: 'heartbeat',
          data: { 
            message: 'Connection active',
            timestamp: new Date().toISOString()
          }
        });
      }, 30000); // Send heartbeat every 30 seconds

      // Step 4: Generate questions for each page using AI
      for (let i = 0; i < pagesToProcess.length; i++) {
        const page = pagesToProcess[i];
        
        // Skip pages with insufficient content
        if (page.textContent.trim().length < 50) {
          subject.next({
            type: 'page-skipped',
            data: {
              pageNumber: page.pageNumber,
              reason: 'insufficient-content',
              message: `Skipping page ${page.pageNumber} - insufficient content`
            }
          });
          continue;
        }

        // Emit page processing start
        subject.next({
          type: 'page-processing',
          data: {
            pageNumber: page.pageNumber,
            currentPage: i + 1,
            totalPages: pagesToProcess.length,
            message: `Generating questions for page ${page.pageNumber}...`
          }
        });

        try {
          const questions = await this.aiService.generateQuestionsFromPageContent(
            page.textContent,
            page.pageNumber,
            defaultOptions
          );

          if (questions.length > 0) {
            // Store questions incrementally to storage
            await this.appendQuestionsToTempFile(tempQuizPath, questions);
            totalQuestions += questions.length;
            
            // Emit each new question immediately
            for (const question of questions) {
              subject.next({
                type: 'question-generated',
                data: {
                  question,
                  totalQuestions,
                  pageNumber: page.pageNumber,
                  message: `Generated question ${totalQuestions}`
                }
              });
            }

            this.logger.log(`✅ Generated ${questions.length} questions for page ${page.pageNumber} (total: ${totalQuestions})`);
          } else {
            subject.next({
              type: 'page-warning',
              data: {
                pageNumber: page.pageNumber,
                message: `No questions generated for page ${page.pageNumber}`
              }
            });
          }

        } catch (error) {
          this.logger.error(`❌ Failed to generate questions for page ${page.pageNumber}: ${error.message}`);
          
          subject.next({
            type: 'page-error',
            data: {
              pageNumber: page.pageNumber,
              error: error.message,
              message: `Failed to process page ${page.pageNumber}`
            }
          });
        }
      }

      if (totalQuestions === 0) {
        throw new Error('No questions could be generated from the PDF content');
      }

      // Step 5: Generate AI-powered title and description
      subject.next({
        type: 'generating-metadata',
        data: { message: 'Generating AI-powered title and description...', totalQuestions }
      });

      // Collect all document content for AI generation
      const allDocumentContent = pagesToProcess
        .map(page => page.textContent)
        .join('\n\n')
        .substring(0, 10000); // Limit to first 10,000 characters for performance

      // Generate AI title and description in parallel
      this.logger.log(`🤖 Generating AI-powered title and description...`);
      const [aiTitle, aiDescription] = await Promise.all([
        this.aiService.generateQuizTitle(
          allDocumentContent,
          filename,
          defaultOptions.language
        ),
        this.aiService.generateQuizDescription(
          allDocumentContent,
          fileResult.totalPages,
          totalQuestions,
          defaultOptions.language
        )
      ]);

      subject.next({
        type: 'metadata-generated',
        data: { 
          message: 'AI title and description generated successfully!',
          title: aiTitle,
          description: aiDescription.substring(0, 100) + '...'
        }
      });

      // Step 6: Finalize quiz from temporary storage
      subject.next({
        type: 'finalizing',
        data: { message: 'Creating final quiz...', totalQuestions }
      });

      const finalQuizData: Partial<Quiz> = {
        id: quizId,
        title: aiTitle,
        description: aiDescription,
        metadata: {
          sourceFile: filename,
          totalPages: fileResult.totalPages,
          pagesProcessed: pagesToProcess.length,
          totalQuestions,
          generatedAt: new Date().toISOString(),
          language: defaultOptions.language,
          difficulty: defaultOptions.difficulty,
          includeExplanations: defaultOptions.includeExplanations
        }
      };

      // Create final quiz from temp file
      const finalQuiz = await this.finalizeTempQuiz(tempQuizPath, finalQuizData);

      // Save final quiz
      await this.saveQuiz(finalQuiz);

      // Clean up heartbeat interval
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      
      // Clean up temp files
      try {
        await fs.unlink(tempFilePath);
        await fs.unlink(tempQuizPath);
      } catch (error) {
        this.logger.warn(`Failed to cleanup temp files: ${error.message}`);
      }

      // Emit final completion
      subject.next({
        type: 'completed',
        data: {
          quiz: finalQuiz,
          quizId,
          magicLink: quizId,
          shareUrl: `${process.env.WEB_URL || 'http://localhost:3000'}/quiz/${quizId}`,
          totalQuestions,
          title: aiTitle,
          message: 'Quiz generation completed successfully!',
          stats: {
            totalPages: fileResult.totalPages,
            pagesProcessed: pagesToProcess.length,
            totalQuestions,
            generatedAt: new Date().toISOString()
          }
        }
      });

      this.logger.log(`🎉 Quiz generation completed: ${quizId} with ${totalQuestions} questions`);
      
      subject.complete();

    } catch (error) {
      this.logger.error(`❌ Quiz generation failed: ${error.message}`);
      
      // Clean up heartbeat interval on error
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      
      // Clean up temp files on error
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          this.logger.warn(`Failed to cleanup temp file: ${cleanupError.message}`);
        }
      }

      subject.error(error);
    }
  }

  /**
   * Create a temporary storage file for quiz generation
   */
  private async createTempQuizFile(quizId: string): Promise<string> {
    const tempFilePath = path.join(this.quizStorageDir, `temp_${quizId}.json`);
    const initialData = {
      id: quizId,
      questions: [],
      metadata: {
        createdAt: new Date(),
        status: 'generating'
      }
    };
    
    await fs.writeFile(tempFilePath, JSON.stringify(initialData, null, 2), 'utf8');
    this.logger.log(`📝 Created temporary quiz file: ${tempFilePath}`);
    
    return tempFilePath;
  }

  /**
   * Append questions to temporary quiz file
   */
  private async appendQuestionsToTempFile(tempFilePath: string, questions: QuizQuestion[]): Promise<void> {
    try {
      const fileData = await fs.readFile(tempFilePath, 'utf8');
      const tempQuiz = JSON.parse(fileData);
      
      tempQuiz.questions.push(...questions);
      tempQuiz.metadata.lastUpdated = new Date();
      
      await fs.writeFile(tempFilePath, JSON.stringify(tempQuiz, null, 2), 'utf8');
      this.logger.debug(`✏️ Appended ${questions.length} questions to temp file (total: ${tempQuiz.questions.length})`);
    } catch (error) {
      this.logger.error(`❌ Failed to append questions to temp file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Finalize temporary quiz file into permanent storage
   */
  private async finalizeTempQuiz(tempFilePath: string, finalQuizData: Partial<Quiz>): Promise<Quiz> {
    try {
      const fileData = await fs.readFile(tempFilePath, 'utf8');
      const tempQuiz = JSON.parse(fileData);
      
      const finalQuiz: Quiz = {
        ...tempQuiz,
        ...finalQuizData,
        questions: tempQuiz.questions,
        metadata: {
          ...tempQuiz.metadata,
          ...finalQuizData.metadata,
          status: 'completed',
          finalizedAt: new Date()
        }
      };
      
      // Clean up temp file
      await fs.unlink(tempFilePath);
      this.logger.log(`🗑️ Cleaned up temporary file: ${tempFilePath}`);
      
      return finalQuiz;
    } catch (error) {
      this.logger.error(`❌ Failed to finalize temp quiz: ${error.message}`);
      throw error;
    }
  }
} 