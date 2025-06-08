import { Injectable, Logger } from '@nestjs/common';
import { FileServerService } from './file-server.service';
import { AiService } from './ai.service';
import { Quiz, QuizQuestion, PdfToQuizOptions } from './models/quiz.model';
import { PdfProcessingResult } from './models/pdf.model';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class QuizmakerService {
  private readonly logger = new Logger(QuizmakerService.name);
  private readonly quizStorageDir = './quiz-storage';

  constructor(
    private readonly fileServerService: FileServerService,
    private readonly aiService: AiService
  ) {
    this.initializeStorage();
  }

  /**
   * Initialize quiz storage directory
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
   * Save quiz to file storage
   */
  private async saveQuiz(quiz: Quiz): Promise<string> {
    try {
      const magicLink = this.generateMagicLink();
      const filename = `${magicLink}.json`;
      const filePath = path.join(this.quizStorageDir, filename);

      // Add magic link to quiz metadata
      const quizWithMagicLink = {
        ...quiz,
        magicLink,
        metadata: {
          ...quiz.metadata,
          magicLink,
          savedAt: new Date()
        }
      };

      await fs.writeFile(filePath, JSON.stringify(quizWithMagicLink, null, 2), 'utf8');
      
      this.logger.log(`💾 Quiz saved successfully with magic link: ${magicLink}`);
      this.logger.log(`📂 Quiz file: ${filename}`);
      
      return magicLink;
    } catch (error) {
      this.logger.error(`❌ Failed to save quiz: ${error.message}`);
      throw new Error(`Failed to save quiz: ${error.message}`);
    }
  }

  /**
   * Convert a PDF file to a quiz using AI and save it with a magic link
   */
  async pdfToQuiz(filePath: string, options: PdfToQuizOptions = {}): Promise<{ quiz: Quiz; magicLink: string }> {
    const defaultOptions: Required<PdfToQuizOptions> = {
      questionsPerPage: options.questionsPerPage ?? parseInt(process.env.DEFAULT_QUESTIONS_PER_PAGE || '2'),
      difficulty: options.difficulty ?? 'mixed',
      includeExplanations: options.includeExplanations ?? true,
      generateImages: options.generateImages ?? false,
      language: options.language ?? 'en'
    };

    this.logger.log(`🎯 Starting PDF to quiz conversion for: ${filePath}`);
    this.logger.log(`📋 Options: ${JSON.stringify(defaultOptions)}`);

    try {
      // Step 1: Process PDF file
      const fileResult = await this.fileServerService.splitPdfToPages(filePath, defaultOptions.generateImages);

      if (!fileResult.pages || fileResult.pages.length === 0) {
        throw new Error('No readable content found in the PDF');
      }

      this.logger.log(`📄 PDF processing completed: ${fileResult.pages.length} pages extracted`);

      // Step 2: Generate questions for each page using AI
      const allQuestions: QuizQuestion[] = [];
      const maxPages = parseInt(process.env.MAX_PAGES_PER_PDF || '50');
      const pagesToProcess = fileResult.pages.slice(0, maxPages);

      for (const page of pagesToProcess) {
        // Skip pages with insufficient content
        if (page.textContent.trim().length < 50) {
          this.logger.warn(`⏭️ Skipping page ${page.pageNumber} - insufficient content (${page.textContent.length} characters)`);
          continue;
        }

        this.logger.log(`🤖 Processing page ${page.pageNumber}/${fileResult.totalPages} (${page.textContent.length} characters)`);

        try {
          const questions = await this.aiService.generateQuestionsFromPageContent(
            page.textContent,
            page.pageNumber,
            defaultOptions
          );

          if (questions.length > 0) {
            allQuestions.push(...questions);
            this.logger.log(`✅ Generated ${questions.length} questions for page ${page.pageNumber}`);
          } else {
            this.logger.warn(`⚠️ No questions generated for page ${page.pageNumber}`);
          }

        } catch (error) {
          this.logger.error(`❌ Failed to generate questions for page ${page.pageNumber}: ${error.message}`);
          // Continue with other pages instead of failing completely
        }
      }

      if (allQuestions.length === 0) {
        throw new Error('No questions could be generated from the PDF content');
      }

      // Step 3: Create quiz object
      const quiz: Quiz = {
        id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: this.generateQuizTitle(path.basename(filePath), defaultOptions.language),
        description: this.generateQuizDescription(fileResult.totalPages, allQuestions.length, defaultOptions.language),
        questions: allQuestions,
        metadata: {
          sourceFile: path.basename(filePath),
          totalPages: fileResult.totalPages,
          createdAt: new Date(),
          estimatedDuration: Math.ceil(allQuestions.length * 1.5), // ~1.5 minutes per question
          language: defaultOptions.language,
          questionsPerPage: defaultOptions.questionsPerPage,
          difficulty: defaultOptions.difficulty
        }
      };

      // Step 4: Save quiz and generate magic link
      const magicLink = await this.saveQuiz(quiz);

      this.logger.log(`🎉 Quiz generation completed successfully!`);
      this.logger.log(`📊 Final stats: ${allQuestions.length} questions from ${pagesToProcess.length} pages`);
      this.logger.log(`🔗 Magic link: ${magicLink}`);

      return { quiz, magicLink };

    } catch (error) {
      this.logger.error(`💥 Quiz generation failed: ${error.message}`, error.stack);
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }

  /**
   * Get quiz by magic link
   */
  async getQuizByMagicLink(magicLink: string): Promise<Quiz | null> {
    try {
      const filename = `${magicLink}.json`;
      const filePath = path.join(this.quizStorageDir, filename);

      this.logger.log(`🔍 Retrieving quiz with magic link: ${magicLink}`);

      const quizData = await fs.readFile(filePath, 'utf8');
      const quiz = JSON.parse(quizData);

      this.logger.log(`✅ Quiz retrieved successfully: ${quiz.title}`);
      return quiz;

    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.warn(`❌ Quiz not found for magic link: ${magicLink}`);
        return null;
      }
      this.logger.error(`❌ Failed to retrieve quiz: ${error.message}`);
      throw new Error(`Failed to retrieve quiz: ${error.message}`);
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

      // Otherwise, search through stored quizzes
      const files = await fs.readdir(this.quizStorageDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.quizStorageDir, file);
          const quizData = await fs.readFile(filePath, 'utf8');
          const quiz = JSON.parse(quizData);
          
          if (quiz.id === quizId) {
            this.logger.log(`✅ Quiz found by ID: ${quiz.title}`);
            return quiz;
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
  async listQuizzes(limit: number = 20, offset: number = 0): Promise<{ quizzes: Quiz[]; total: number }> {
    try {
      this.logger.log(`📋 Listing quizzes (limit: ${limit}, offset: ${offset})`);
      
      const files = await fs.readdir(this.quizStorageDir);
      const quizFiles = files.filter(file => file.endsWith('.json'));
      
      // Sort by creation date (most recent first)
      const quizzes: Quiz[] = [];
      
      for (const file of quizFiles) {
        try {
          const filePath = path.join(this.quizStorageDir, file);
          const quizData = await fs.readFile(filePath, 'utf8');
          const quiz = JSON.parse(quizData);
          quizzes.push(quiz);
        } catch (error) {
          this.logger.warn(`⚠️ Failed to read quiz file ${file}: ${error.message}`);
        }
      }

      // Sort by creation date
      quizzes.sort((a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime());
      
      // Apply pagination
      const paginatedQuizzes = quizzes.slice(offset, offset + limit);
      
      this.logger.log(`✅ Retrieved ${paginatedQuizzes.length} quizzes (total: ${quizzes.length})`);
      
      return {
        quizzes: paginatedQuizzes,
        total: quizzes.length
      };

    } catch (error) {
      this.logger.error(`❌ Failed to list quizzes: ${error.message}`);
      return { quizzes: [], total: 0 };
    }
  }

  /**
   * Delete quiz by magic link
   */
  async deleteQuizByMagicLink(magicLink: string): Promise<boolean> {
    try {
      const filename = `${magicLink}.json`;
      const filePath = path.join(this.quizStorageDir, filename);

      await fs.unlink(filePath);
      this.logger.log(`🗑️ Quiz deleted successfully: ${magicLink}`);
      return true;

    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.warn(`❌ Quiz not found for deletion: ${magicLink}`);
        return false;
      }
      this.logger.error(`❌ Failed to delete quiz: ${error.message}`);
      return false;
    }
  }

  /**
   * Utility methods
   */
  private generateQuizId(): string {
    return `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getFileName(filePath: string): string {
    return filePath.split('/').pop()?.replace('.pdf', '') || 'Unknown';
  }

  private generateQuizTitle(filename: string, language: string): string {
    const baseName = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    
    const titles = {
      'en': `Quiz: ${baseName}`,
      'es': `Cuestionario: ${baseName}`,
      'fr': `Quiz: ${baseName}`,
      'de': `Quiz: ${baseName}`,
      'it': `Quiz: ${baseName}`,
      'pt': `Questionário: ${baseName}`,
      'ru': `Викторина: ${baseName}`,
      'zh': `测验: ${baseName}`,
      'ja': `クイズ: ${baseName}`,
      'ko': `퀴즈: ${baseName}`,
      'ar': `اختبار: ${baseName}`,
      'hi': `प्रश्नोत्तरी: ${baseName}`,
      'nl': `Quiz: ${baseName}`,
      'sv': `Frågesport: ${baseName}`,
      'da': `Quiz: ${baseName}`,
      'no': `Quiz: ${baseName}`
    };

    return titles[language] || titles['en'];
  }

  private generateQuizDescription(totalPages: number, totalQuestions: number, language: string): string {
    const descriptions = {
      'en': `Generated from a ${totalPages}-page document with ${totalQuestions} questions covering key concepts and important information.`,
      'es': `Generado a partir de un documento de ${totalPages} páginas con ${totalQuestions} preguntas que cubren conceptos clave e información importante.`,
      'fr': `Généré à partir d'un document de ${totalPages} pages avec ${totalQuestions} questions couvrant les concepts clés et les informations importantes.`,
      'de': `Erstellt aus einem ${totalPages}-seitigen Dokument mit ${totalQuestions} Fragen zu wichtigen Konzepten und Informationen.`,
      'it': `Generato da un documento di ${totalPages} pagine con ${totalQuestions} domande sui concetti chiave e informazioni importanti.`,
      'pt': `Gerado a partir de um documento de ${totalPages} páginas com ${totalQuestions} perguntas cobrindo conceitos-chave e informações importantes.`,
      'ru': `Создано из документа на ${totalPages} страницах с ${totalQuestions} вопросами по ключевым концепциям и важной информации.`,
      'zh': `从 ${totalPages} 页文档生成，包含 ${totalQuestions} 个涵盖关键概念和重要信息的问题。`,
      'ja': `${totalPages}ページの文書から生成され、重要な概念と情報をカバーする${totalQuestions}の質問が含まれています。`,
      'ko': `${totalPages}페이지 문서에서 생성되었으며, 핵심 개념과 중요한 정보를 다루는 ${totalQuestions}개의 질문이 포함되어 있습니다.`,
      'ar': `تم إنشاؤه من وثيقة مكونة من ${totalPages} صفحة مع ${totalQuestions} سؤالاً يغطي المفاهيم الأساسية والمعلومات المهمة.`,
      'hi': `${totalPages} पृष्ठों के दस्तावेज़ से उत्पन्न, जिसमें मुख्य अवधारणाओं और महत्वपूर्ण जानकारी को कवर करने वाले ${totalQuestions} प्रश्न हैं।`,
      'nl': `Gegenereerd uit een document van ${totalPages} pagina's met ${totalQuestions} vragen die belangrijke concepten en informatie behandelen.`,
      'sv': `Genererad från ett ${totalPages}-sidigt dokument med ${totalQuestions} frågor som täcker viktiga koncept och information.`,
      'da': `Genereret fra et ${totalPages}-siders dokument med ${totalQuestions} spørgsmål, der dækker vigtige begreber og information.`,
      'no': `Generert fra et ${totalPages}-siders dokument med ${totalQuestions} spørsmål som dekker viktige konsepter og informasjon.`
    };

    return descriptions[language] || descriptions['en'];
  }

  /**
   * Stream quiz generation with real-time question updates
   */
  pdfToQuizStream(filePath: string, options: PdfToQuizOptions = {}): Observable<any> {
    const subject = new Subject<any>();
    
    // Start the streaming generation process
    this.generateQuizStreamingProcess(filePath, options, subject);
    
    return subject.asObservable();
  }

  private async generateQuizStreamingProcess(
    filePath: string, 
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
    const allQuestions: QuizQuestion[] = [];

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

      this.logger.log(`🎯 Starting streaming PDF to quiz conversion for: ${filePath}`);

      // Step 1: Process PDF file
      subject.next({
        type: 'progress',
        data: { message: 'Processing PDF file...', stage: 'pdf-processing' }
      });

      const fileResult = await this.fileServerService.splitPdfToPages(filePath, defaultOptions.generateImages);

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

      // Step 2: Generate questions for each page using AI
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
            allQuestions.push(...questions);
            
            // Emit each new question immediately
            for (const question of questions) {
              subject.next({
                type: 'question-generated',
                data: {
                  question,
                  totalQuestions: allQuestions.length,
                  pageNumber: page.pageNumber,
                  message: `Generated question ${allQuestions.length}`
                }
              });
            }

            this.logger.log(`✅ Generated ${questions.length} questions for page ${page.pageNumber}`);
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

      if (allQuestions.length === 0) {
        throw new Error('No questions could be generated from the PDF content');
      }

      // Step 3: Create final quiz object
      subject.next({
        type: 'finalizing',
        data: { message: 'Creating final quiz...', totalQuestions: allQuestions.length }
      });

      const quiz: Quiz = {
        id: quizId,
        title: this.generateQuizTitle(path.basename(filePath), defaultOptions.language),
        description: this.generateQuizDescription(fileResult.totalPages, allQuestions.length, defaultOptions.language),
        questions: allQuestions,
        metadata: {
          sourceFile: path.basename(filePath),
          totalPages: fileResult.totalPages,
          createdAt: new Date(),
          estimatedDuration: Math.ceil(allQuestions.length * 1.5),
          language: defaultOptions.language,
          questionsPerPage: defaultOptions.questionsPerPage,
          difficulty: defaultOptions.difficulty
        }
      };

      // Step 4: Save quiz and generate magic link
      const magicLink = await this.saveQuiz(quiz);

      // Emit completion
      subject.next({
        type: 'completed',
        data: {
          quiz,
          magicLink,
          shareUrl: `${process.env.WEB_URL || 'http://localhost:3000'}/quiz/${magicLink}`,
          message: 'Quiz generation completed successfully!',
          stats: {
            totalQuestions: allQuestions.length,
            pagesProcessed: pagesToProcess.length,
            totalPages: fileResult.totalPages
          }
        }
      });

      this.logger.log(`🎉 Streaming quiz generation completed successfully!`);
      subject.complete();

    } catch (error) {
      this.logger.error(`💥 Streaming quiz generation failed: ${error.message}`, error.stack);
      
      subject.next({
        type: 'error',
        data: {
          error: error.message,
          message: 'Quiz generation failed',
          quizId
        }
      });
      
      subject.error(error);
    }
  }
} 