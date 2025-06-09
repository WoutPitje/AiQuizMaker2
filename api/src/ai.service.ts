import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { QuizQuestion, PdfToQuizOptions } from './models/quiz.model';

interface GenerateQuestionsOptions {
  questionsPerPage?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  includeExplanations?: boolean;
  language?: string;
}

// Language configuration for prompts and instructions
const LANGUAGE_CONFIGS = {
  'en': {
    name: 'English',
    prompt: 'Generate quiz questions in English',
    difficultyLabels: { easy: 'easy', medium: 'medium', hard: 'hard' }
  },
  'es': {
    name: 'Spanish',
    prompt: 'Genera preguntas de examen en español',
    difficultyLabels: { easy: 'fácil', medium: 'intermedio', hard: 'difícil' }
  },
  'fr': {
    name: 'French',
    prompt: 'Générez des questions de quiz en français',
    difficultyLabels: { easy: 'facile', medium: 'moyen', hard: 'difficile' }
  },
  'de': {
    name: 'German',
    prompt: 'Erstellen Sie Quizfragen auf Deutsch',
    difficultyLabels: { easy: 'einfach', medium: 'mittel', hard: 'schwer' }
  },
  'it': {
    name: 'Italian',
    prompt: 'Genera domande per quiz in italiano',
    difficultyLabels: { easy: 'facile', medium: 'medio', hard: 'difficile' }
  },
  'pt': {
    name: 'Portuguese',
    prompt: 'Gere perguntas de questionário em português',
    difficultyLabels: { easy: 'fácil', medium: 'médio', hard: 'difícil' }
  },
  'ru': {
    name: 'Russian',
    prompt: 'Создайте вопросы для викторины на русском языке',
    difficultyLabels: { easy: 'легкий', medium: 'средний', hard: 'сложный' }
  },
  'zh': {
    name: 'Chinese',
    prompt: '用中文生成测验问题',
    difficultyLabels: { easy: '简单', medium: '中等', hard: '困难' }
  },
  'ja': {
    name: 'Japanese',
    prompt: '日本語でクイズの質問を生成してください',
    difficultyLabels: { easy: '簡単', medium: '普通', hard: '難しい' }
  },
  'ko': {
    name: 'Korean',
    prompt: '한국어로 퀴즈 문제를 생성하세요',
    difficultyLabels: { easy: '쉬움', medium: '보통', hard: '어려움' }
  },
  'ar': {
    name: 'Arabic',
    prompt: 'قم بإنشاء أسئلة اختبار باللغة العربية',
    difficultyLabels: { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }
  },
  'hi': {
    name: 'Hindi',
    prompt: 'हिंदी में प्रश्नोत्तरी के प्रश्न उत्पन्न करें',
    difficultyLabels: { easy: 'आसान', medium: 'मध्यम', hard: 'कठिन' }
  },
  'nl': {
    name: 'Dutch',
    prompt: 'Genereer quizvragen in het Nederlands',
    difficultyLabels: { easy: 'gemakkelijk', medium: 'gemiddeld', hard: 'moeilijk' }
  },
  'sv': {
    name: 'Swedish',
    prompt: 'Generera frågor för frågesport på svenska',
    difficultyLabels: { easy: 'lätt', medium: 'medel', hard: 'svår' }
  },
  'da': {
    name: 'Danish',
    prompt: 'Generer quizspørgsmål på dansk',
    difficultyLabels: { easy: 'let', medium: 'mellem', hard: 'svær' }
  },
  'no': {
    name: 'Norwegian',
    prompt: 'Generer quizspørsmål på norsk',
    difficultyLabels: { easy: 'lett', medium: 'middels', hard: 'vanskelig' }
  }
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY not found in environment variables');
      throw new Error('OPENAI_API_KEY is required for AI service');
    }
    
    this.logger.log('Initializing OpenAI client...');
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
    this.logger.log('OpenAI client initialized successfully');
  }

  // Get available languages for quiz generation
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return Object.entries(LANGUAGE_CONFIGS).map(([code, config]) => ({
      code,
      name: config.name
    }));
  }

  /**
   * Generate quiz questions from page content using ChatGPT
   */
  async generateQuestionsFromPageContent(
    pageContent: string,
    pageNumber: number,
    options: Required<PdfToQuizOptions>
  ): Promise<QuizQuestion[]> {
    const startTime = Date.now();
    
    this.logger.log(`🤖 AI Question Generation Starting for page ${pageNumber}`);
    this.logger.log(`📝 Content length: ${pageContent.length} characters`);
    this.logger.log(`⚙️ Options: ${JSON.stringify({
      questionsPerPage: options.questionsPerPage,
      difficulty: options.difficulty,
      includeExplanations: options.includeExplanations,
      language: options.language || 'en'
    })}`);

    // Try up to 2 attempts
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        this.logger.debug(`🎯 Attempt ${attempt}/2: Sending request to OpenAI API...`);
        
        const prompt = this.buildPrompt(pageContent, options);
        
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(options.language || 'en', options.includeExplanations)
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        });

        const duration = Date.now() - startTime;
        const usage = response.usage;
        
        this.logger.log(`✅ OpenAI API response received in ${duration}ms (attempt ${attempt})`);
        this.logger.log(`📊 Token usage: ${usage?.prompt_tokens} prompt + ${usage?.completion_tokens} completion = ${usage?.total_tokens} total`);

        const responseContent = response.choices[0]?.message?.content;
        if (!responseContent) {
          throw new Error('Empty response from OpenAI');
        }

        this.logger.debug(`🤖 AI Response length: ${responseContent.length} characters`);

        const questions = this.parseAiResponse(responseContent, pageNumber, options.language || 'en');
        
        if (questions.length > 0) {
          this.logger.log(`🎉 Successfully generated ${questions.length} questions for page ${pageNumber} on attempt ${attempt}`);
          return questions;
        } else {
          throw new Error('No questions could be parsed from AI response');
        }

      } catch (error) {
        this.logger.warn(`⚠️ Attempt ${attempt}/2 failed for page ${pageNumber}: ${error.message}`);
        
        // If this is the last attempt, throw the error
        if (attempt === 2) {
          this.logger.error(`❌ All attempts failed for page ${pageNumber}. Skipping question generation.`);
          return []; // Return empty array instead of throwing
        }
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // This should never be reached, but just in case
    return [];
  }

  private getSystemPrompt(language: string, includeExplanations: boolean): string {
    const langConfig = LANGUAGE_CONFIGS[language] || LANGUAGE_CONFIGS['en'];
    
    const baseInstructions = {
      'en': {
        role: 'You are an expert quiz creator that generates high-quality multiple-choice questions from educational content.',
        format: 'Always respond with valid JSON in exactly this format',
        explanations: includeExplanations ? 'Include detailed explanations for why each answer is correct.' : 'Do not include explanations.'
      },
      'es': {
        role: 'Eres un creador experto de cuestionarios que genera preguntas de opción múltiple de alta calidad a partir de contenido educativo.',
        format: 'Siempre responde con JSON válido en exactamente este formato',
        explanations: includeExplanations ? 'Incluye explicaciones detalladas de por qué cada respuesta es correcta.' : 'No incluyas explicaciones.'
      },
      'fr': {
        role: 'Vous êtes un créateur expert de quiz qui génère des questions à choix multiples de haute qualité à partir de contenu éducatif.',
        format: 'Répondez toujours avec du JSON valide dans exactement ce format',
        explanations: includeExplanations ? 'Incluez des explications détaillées sur pourquoi chaque réponse est correcte.' : 'N\'incluez pas d\'explications.'
      },
      'de': {
        role: 'Sie sind ein Experte für die Erstellung von Quiz, der hochwertige Multiple-Choice-Fragen aus Bildungsinhalten generiert.',
        format: 'Antworten Sie immer mit gültigem JSON in genau diesem Format',
        explanations: includeExplanations ? 'Fügen Sie detaillierte Erklärungen hinzu, warum jede Antwort richtig ist.' : 'Fügen Sie keine Erklärungen hinzu.'
      }
    };

    const instructions = baseInstructions[language] || baseInstructions['en'];

    return `${instructions.role}

${langConfig.prompt}.

${instructions.format}:
[
  {
    "question": "Question text here?",
    "options": {
      "A": "Option A text",
      "B": "Option B text", 
      "C": "Option C text",
      "D": "Option D text"
    },
    "correctAnswer": "A",
    "difficulty": "easy|medium|hard",
    "explanation": "${includeExplanations ? 'Detailed explanation' : ''}"
  }
]

${instructions.explanations}
- Ensure all content is in ${langConfig.name}
- Make questions clear and unambiguous
- Ensure only one correct answer per question
- Base questions directly on the provided content`;
  }

  /**
   * Build a prompt for the AI to generate quiz questions
   */
  private buildPrompt(content: string, options: Required<PdfToQuizOptions>): string {
    const language = options.language || 'en';
    const langConfig = LANGUAGE_CONFIGS[language] || LANGUAGE_CONFIGS['en'];
    
    const prompts = {
      'en': `Generate ${options.questionsPerPage} multiple-choice questions with difficulty level "${options.difficulty}" based on this content:\n\n${content}`,
      'es': `Genera ${options.questionsPerPage} preguntas de opción múltiple con nivel de dificultad "${options.difficulty}" basadas en este contenido:\n\n${content}`,
      'fr': `Générez ${options.questionsPerPage} questions à choix multiples avec niveau de difficulté "${options.difficulty}" basées sur ce contenu:\n\n${content}`,
      'de': `Erstellen Sie ${options.questionsPerPage} Multiple-Choice-Fragen mit Schwierigkeitsgrad "${options.difficulty}" basierend auf diesem Inhalt:\n\n${content}`
    };

    return prompts[language] || prompts['en'];
  }

  /**
   * Parse AI response into structured quiz questions
   */
  private parseAiResponse(response: string, pageNumber: number, language: string = 'en'): QuizQuestion[] {
    try {
      this.logger.debug('Attempting to parse AI response as JSON...');
      
      // Clean the response - sometimes AI wraps JSON in markdown code blocks
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/```$/, '');
      }

      const parsedQuestions = JSON.parse(cleanResponse);
      
      if (!Array.isArray(parsedQuestions)) {
        throw new Error('Response is not an array');
      }

      this.logger.debug(`Parsed ${parsedQuestions.length} questions from AI response`);

      const questions: QuizQuestion[] = parsedQuestions.map((q, index) => ({
        id: `q${pageNumber}_${index + 1}_${Date.now()}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation || '',
        pageNumber: pageNumber,
        language: language
      }));

      this.logger.debug(`Successfully converted to quiz question format`);
      return questions;

    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${error.message}`);
      this.logger.debug(`Raw response: ${response.substring(0, 500)}...`);
      
      // Return empty array instead of fallback questions
      return [];
    }
  }

} 