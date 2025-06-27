import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  QuizQuestion,
  PdfToQuizOptions,
  MultipleChoiceQuestion,
  FlashcardQuestion,
  TrueFalseQuestion,
  FillInBlankQuestion,
  MatchingQuestion,
  MultipleSelectQuestion,
  ShortAnswerQuestion,
  OrderingQuestion,
  isMultipleChoiceQuestion,
  isFlashcardQuestion,
  isTrueFalseQuestion,
  convertLegacyQuestion,
} from '../../models/quiz.model';

interface GenerateQuestionsOptions {
  questionsPerPage?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  includeExplanations?: boolean;
  language?: string;
  questionTypes?: (
    | 'multiple-choice'
    | 'flashcard'
    | 'true-false'
    | 'fill-in-blank'
    | 'matching'
    | 'multiple-select'
    | 'short-answer'
    | 'ordering'
  )[];
  quizType?:
    | 'mixed'
    | 'multiple-choice'
    | 'flashcard'
    | 'true-false'
    | 'fill-in-blank'
    | 'matching'
    | 'multiple-select'
    | 'short-answer'
    | 'ordering';
}

// Language configuration for prompts and instructions
const LANGUAGE_CONFIGS = {
  en: {
    name: 'English',
    prompt: 'Generate quiz questions in English',
    difficultyLabels: { easy: 'easy', medium: 'medium', hard: 'hard' },
  },
  es: {
    name: 'Spanish',
    prompt: 'Genera preguntas de examen en español',
    difficultyLabels: { easy: 'fácil', medium: 'intermedio', hard: 'difícil' },
  },
  fr: {
    name: 'French',
    prompt: 'Générez des questions de quiz en français',
    difficultyLabels: { easy: 'facile', medium: 'moyen', hard: 'difficile' },
  },
  de: {
    name: 'German',
    prompt: 'Erstellen Sie Quizfragen auf Deutsch',
    difficultyLabels: { easy: 'einfach', medium: 'mittel', hard: 'schwer' },
  },
  it: {
    name: 'Italian',
    prompt: 'Genera domande per quiz in italiano',
    difficultyLabels: { easy: 'facile', medium: 'medio', hard: 'difficile' },
  },
  pt: {
    name: 'Portuguese',
    prompt: 'Gere perguntas de questionário em português',
    difficultyLabels: { easy: 'fácil', medium: 'médio', hard: 'difícil' },
  },
  ru: {
    name: 'Russian',
    prompt: 'Создайте вопросы для викторины на русском языке',
    difficultyLabels: { easy: 'легкий', medium: 'средний', hard: 'сложный' },
  },
  zh: {
    name: 'Chinese',
    prompt: '用中文生成测验问题',
    difficultyLabels: { easy: '简单', medium: '中等', hard: '困难' },
  },
  ja: {
    name: 'Japanese',
    prompt: '日本語でクイズの質問を生成してください',
    difficultyLabels: { easy: '簡単', medium: '普通', hard: '難しい' },
  },
  ko: {
    name: 'Korean',
    prompt: '한국어로 퀴즈 문제를 생성하세요',
    difficultyLabels: { easy: '쉬움', medium: '보통', hard: '어려움' },
  },
  ar: {
    name: 'Arabic',
    prompt: 'قم بإنشاء أسئلة اختبار باللغة العربية',
    difficultyLabels: { easy: 'سهل', medium: 'متوسط', hard: 'صعب' },
  },
  hi: {
    name: 'Hindi',
    prompt: 'हिंदी में प्रश्नोत्तरी के प्रश्न उत्पन्न करें',
    difficultyLabels: { easy: 'आसान', medium: 'मध्यम', hard: 'कठिन' },
  },
  nl: {
    name: 'Dutch',
    prompt: 'Genereer quizvragen in het Nederlands',
    difficultyLabels: {
      easy: 'gemakkelijk',
      medium: 'gemiddeld',
      hard: 'moeilijk',
    },
  },
  sv: {
    name: 'Swedish',
    prompt: 'Generera frågor för frågesport på svenska',
    difficultyLabels: { easy: 'lätt', medium: 'medel', hard: 'svår' },
  },
  da: {
    name: 'Danish',
    prompt: 'Generer quizspørgsmål på dansk',
    difficultyLabels: { easy: 'let', medium: 'mellem', hard: 'svær' },
  },
  no: {
    name: 'Norwegian',
    prompt: 'Generer quizspørsmål på norsk',
    difficultyLabels: { easy: 'lett', medium: 'middels', hard: 'vanskelig' },
  },
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
      name: config.name,
    }));
  }

  /**
   * Generate quiz questions from page content using ChatGPT
   */
  async generateQuestionsFromPageContent(
    pageContent: string,
    pageNumber: number,
    options: Required<PdfToQuizOptions>,
  ): Promise<QuizQuestion[]> {
    const startTime = Date.now();

    // Determine question types to generate
    const questionTypes = this.getQuestionTypesToGenerate(options);

    this.logger.log(
      `🤖 AI Question Generation Starting for page ${pageNumber}`,
    );
    this.logger.log(`📝 Content length: ${pageContent.length} characters`);
    this.logger.log(
      `⚙️ Options: ${JSON.stringify({
        questionsPerPage: options.questionsPerPage,
        difficulty: options.difficulty,
        includeExplanations: options.includeExplanations,
        language: options.language || 'en',
        questionTypes: questionTypes,
        quizType: options.quizType,
      })}`,
    );

    // Try up to 2 attempts
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        this.logger.debug(
          `🎯 Attempt ${attempt}/2: Sending request to OpenAI API...`,
        );

        const prompt = this.buildPrompt(pageContent, options, questionTypes);

        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(
                options.language || 'en',
                options.includeExplanations,
                questionTypes,
              ),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        });

        const duration = Date.now() - startTime;
        const usage = response.usage;

        this.logger.log(
          `✅ OpenAI API response received in ${duration}ms (attempt ${attempt})`,
        );
        this.logger.log(
          `📊 Token usage: ${usage?.prompt_tokens} prompt + ${usage?.completion_tokens} completion = ${usage?.total_tokens} total`,
        );

        const responseContent = response.choices[0]?.message?.content;
        if (!responseContent) {
          throw new Error('Empty response from OpenAI');
        }

        this.logger.debug(
          `🤖 AI Response length: ${responseContent.length} characters`,
        );

        const questions = this.parseAiResponse(
          responseContent,
          pageNumber,
          options.language || 'en',
          questionTypes,
        );

        if (questions.length > 0) {
          this.logger.log(
            `🎉 Successfully generated ${questions.length} questions for page ${pageNumber} on attempt ${attempt}`,
          );
          return questions;
        } else {
          throw new Error('No questions could be parsed from AI response');
        }
      } catch (error) {
        this.logger.warn(
          `⚠️ Attempt ${attempt}/2 failed for page ${pageNumber}: ${error.message}`,
        );

        // If this is the last attempt, throw the error
        if (attempt === 2) {
          this.logger.error(
            `❌ All attempts failed for page ${pageNumber}. Skipping question generation.`,
          );
          return []; // Return empty array instead of throwing
        }

        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // This should never be reached, but just in case
    return [];
  }

  /**
   * Generate AI-powered quiz title based on document content
   */
  async generateQuizTitle(
    documentContent: string,
    filename: string,
    language: string = 'en',
  ): Promise<string> {
    const startTime = Date.now();

    this.logger.log(
      `📝 AI Title Generation Starting for document: ${filename}`,
    );
    this.logger.log(`📝 Content length: ${documentContent.length} characters`);
    this.logger.log(`🌐 Language: ${language}`);

    try {
      const prompt = this.buildTitlePrompt(documentContent, filename, language);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: this.getTitleSystemPrompt(language),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent titles
        max_tokens: 100,
      });

      const duration = Date.now() - startTime;
      const usage = response.usage;

      this.logger.log(`✅ OpenAI title generation completed in ${duration}ms`);
      this.logger.log(
        `📊 Token usage: ${usage?.prompt_tokens} prompt + ${usage?.completion_tokens} completion = ${usage?.total_tokens} total`,
      );

      const generatedTitle = response.choices[0]?.message?.content?.trim();
      if (!generatedTitle) {
        throw new Error('Empty title response from OpenAI');
      }

      this.logger.log(`🎉 Successfully generated title: "${generatedTitle}"`);
      return generatedTitle;
    } catch (error) {
      this.logger.error(`❌ Failed to generate AI title: ${error.message}`);
      // Fallback to filename-based title
      const fallbackTitle = this.getFallbackTitle(filename, language);
      this.logger.log(`📋 Using fallback title: "${fallbackTitle}"`);
      return fallbackTitle;
    }
  }

  /**
   * Generate AI-powered quiz description based on document content
   */
  async generateQuizDescription(
    documentContent: string,
    totalPages: number,
    totalQuestions: number,
    language: string = 'en',
  ): Promise<string> {
    const startTime = Date.now();

    this.logger.log(`📝 AI Description Generation Starting`);
    this.logger.log(`📝 Content length: ${documentContent.length} characters`);
    this.logger.log(
      `📊 Stats: ${totalPages} pages, ${totalQuestions} questions`,
    );
    this.logger.log(`🌐 Language: ${language}`);

    try {
      const prompt = this.buildDescriptionPrompt(
        documentContent,
        totalPages,
        totalQuestions,
        language,
      );

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: this.getDescriptionSystemPrompt(language),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4, // Slightly higher for more creative descriptions
        max_tokens: 200,
      });

      const duration = Date.now() - startTime;
      const usage = response.usage;

      this.logger.log(
        `✅ OpenAI description generation completed in ${duration}ms`,
      );
      this.logger.log(
        `📊 Token usage: ${usage?.prompt_tokens} prompt + ${usage?.completion_tokens} completion = ${usage?.total_tokens} total`,
      );

      const generatedDescription =
        response.choices[0]?.message?.content?.trim();
      if (!generatedDescription) {
        throw new Error('Empty description response from OpenAI');
      }

      this.logger.log(
        `🎉 Successfully generated description: "${generatedDescription.substring(0, 100)}..."`,
      );
      return generatedDescription;
    } catch (error) {
      this.logger.error(
        `❌ Failed to generate AI description: ${error.message}`,
      );
      // Fallback to static description
      const fallbackDescription = this.getFallbackDescription(
        totalPages,
        totalQuestions,
        language,
      );
      this.logger.log(
        `📋 Using fallback description: "${fallbackDescription}"`,
      );
      return fallbackDescription;
    }
  }

  private getSystemPrompt(
    language: string,
    includeExplanations: boolean,
    questionTypes: string[],
  ): string {
    const langConfig = LANGUAGE_CONFIGS[language] || LANGUAGE_CONFIGS['en'];

    // If only multiple-choice, use the original prompt format for backward compatibility
    if (questionTypes.length === 1 && questionTypes[0] === 'multiple-choice') {
      return this.getMultipleChoiceSystemPrompt(language, includeExplanations);
    }

    const baseInstructions = {
      en: {
        role: 'You are an expert quiz creator that generates high-quality educational questions from content.',
        format: 'Always respond with valid JSON in exactly this format',
        explanations: includeExplanations
          ? 'Include detailed explanations for each question.'
          : 'Do not include explanations.',
      },
      es: {
        role: 'Eres un creador experto de cuestionarios que genera preguntas educativas de alta calidad a partir del contenido.',
        format: 'Siempre responde con JSON válido en exactamente este formato',
        explanations: includeExplanations
          ? 'Incluye explicaciones detalladas para cada pregunta.'
          : 'No incluyas explicaciones.',
      },
      fr: {
        role: 'Vous êtes un créateur expert de quiz qui génère des questions éducatives de haute qualité à partir du contenu.',
        format:
          'Répondez toujours avec du JSON valide dans exactement ce format',
        explanations: includeExplanations
          ? 'Incluez des explications détaillées pour chaque question.'
          : "N'incluez pas d'explications.",
      },
      de: {
        role: 'Sie sind ein Experte für die Erstellung von Quiz, der hochwertige Bildungsfragen aus Inhalten generiert.',
        format: 'Antworten Sie immer mit gültigem JSON in genau diesem Format',
        explanations: includeExplanations
          ? 'Fügen Sie detaillierte Erklärungen für jede Frage hinzu.'
          : 'Fügen Sie keine Erklärungen hinzu.',
      },
    };

    const instructions = baseInstructions[language] || baseInstructions['en'];
    const questionFormats = this.getQuestionFormats(
      questionTypes,
      includeExplanations,
    );

    return `${instructions.role}

${langConfig.prompt}.

Generate questions of the following types: ${questionTypes.join(', ')}.

${instructions.format}:
[
${questionFormats}
]

${instructions.explanations}
- Ensure all content is in ${langConfig.name}
- Make questions clear and unambiguous
- Base questions directly on the provided content
- Use the "type" field to specify the question type
- Vary question types as requested`;
  }

  /**
   * Build a prompt for the AI to generate quiz questions
   */
  private buildPrompt(
    content: string,
    options: Required<PdfToQuizOptions>,
    questionTypes: string[],
  ): string {
    const language = options.language || 'en';
    const langConfig = LANGUAGE_CONFIGS[language] || LANGUAGE_CONFIGS['en'];

    // If only multiple-choice, use original prompt for backward compatibility
    if (questionTypes.length === 1 && questionTypes[0] === 'multiple-choice') {
      const prompts = {
        en: `Generate ${options.questionsPerPage} multiple-choice questions with difficulty level "${options.difficulty}" based on this content:\n\n${content}`,
        es: `Genera ${options.questionsPerPage} preguntas de opción múltiple con nivel de dificultad "${options.difficulty}" basadas en este contenido:\n\n${content}`,
        fr: `Générez ${options.questionsPerPage} questions à choix multiples avec niveau de difficulté "${options.difficulty}" basées sur ce contenu:\n\n${content}`,
        de: `Erstellen Sie ${options.questionsPerPage} Multiple-Choice-Fragen mit Schwierigkeitsgrad "${options.difficulty}" basierend auf diesem Inhalt:\n\n${content}`,
      };
      return prompts[language] || prompts['en'];
    }

    // For multiple question types
    const questionTypesList = questionTypes.join(', ');
    const prompts = {
      en: `Generate ${options.questionsPerPage} questions of types: ${questionTypesList} with difficulty level "${options.difficulty}" based on this content:\n\n${content}`,
      es: `Genera ${options.questionsPerPage} preguntas de tipos: ${questionTypesList} con nivel de dificultad "${options.difficulty}" basadas en este contenido:\n\n${content}`,
      fr: `Générez ${options.questionsPerPage} questions de types: ${questionTypesList} avec niveau de difficulté "${options.difficulty}" basées sur ce contenu:\n\n${content}`,
      de: `Erstellen Sie ${options.questionsPerPage} Fragen der Typen: ${questionTypesList} mit Schwierigkeitsgrad "${options.difficulty}" basierend auf diesem Inhalt:\n\n${content}`,
    };

    return prompts[language] || prompts['en'];
  }

  /**
   * Parse AI response into structured quiz questions
   */
  private parseAiResponse(
    response: string,
    pageNumber: number,
    language: string = 'en',
    questionTypes: string[] = ['multiple-choice'],
  ): QuizQuestion[] {
    try {
      this.logger.debug('Attempting to parse AI response as JSON...');

      // Clean the response - sometimes AI wraps JSON in markdown code blocks
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse
          .replace(/```json\n?/, '')
          .replace(/```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/```$/, '');
      }

      const parsedQuestions = JSON.parse(cleanResponse);

      if (!Array.isArray(parsedQuestions)) {
        throw new Error('Response is not an array');
      }

      this.logger.debug(
        `Parsed ${parsedQuestions.length} questions from AI response`,
      );

      const questions: QuizQuestion[] = parsedQuestions.map((q, index) => {
        const baseQuestion = {
          id: `q${pageNumber}_${index + 1}_${Date.now()}`,
          difficulty: q.difficulty || 'medium',
          explanation: q.explanation || '',
          pageNumber: pageNumber,
          language: language,
        };

        // If no type field, assume multiple-choice for backward compatibility
        const questionType = q.type || 'multiple-choice';

        switch (questionType) {
          case 'multiple-choice':
            return {
              ...baseQuestion,
              type: 'multiple-choice' as const,
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
            } as MultipleChoiceQuestion;

          case 'flashcard':
            return {
              ...baseQuestion,
              type: 'flashcard' as const,
              front: q.front,
              back: q.back,
            } as FlashcardQuestion;

          case 'true-false':
            return {
              ...baseQuestion,
              type: 'true-false' as const,
              statement: q.statement,
              correctAnswer: q.correctAnswer,
            } as TrueFalseQuestion;

          case 'fill-in-blank':
            return {
              ...baseQuestion,
              type: 'fill-in-blank' as const,
              text: q.text,
              blanks: q.blanks || [],
            } as FillInBlankQuestion;

          case 'short-answer':
            return {
              ...baseQuestion,
              type: 'short-answer' as const,
              question: q.question,
              expectedAnswer: q.expectedAnswer,
              keywords: q.keywords || [],
            } as ShortAnswerQuestion;

          default:
            // Fallback to multiple-choice if unknown type
            this.logger.warn(
              `Unknown question type: ${questionType}, falling back to multiple-choice`,
            );
            return {
              ...baseQuestion,
              type: 'multiple-choice' as const,
              question: q.question || 'Unknown question format',
              options: q.options || {
                A: 'Option A',
                B: 'Option B',
                C: 'Option C',
                D: 'Option D',
              },
              correctAnswer: q.correctAnswer || 'A',
            } as MultipleChoiceQuestion;
        }
      });

      this.logger.debug(`Successfully converted to quiz question format`);
      return questions;
    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${error.message}`);
      this.logger.debug(`Raw response: ${response.substring(0, 500)}...`);

      // Return empty array instead of fallback questions
      return [];
    }
  }

  /**
   * Build system prompt for title generation
   */
  private getTitleSystemPrompt(language: string): string {
    const prompts = {
      en: 'You are an expert at creating engaging and descriptive titles for educational quizzes. Create a concise, informative title that captures the main topic and purpose of the content. The title should be engaging and professional, typically 3-10 words long.',
      es: 'Eres un experto en crear títulos atractivos y descriptivos para cuestionarios educativos. Crea un título conciso e informativo que capture el tema principal y propósito del contenido. El título debe ser atractivo y profesional, típicamente de 3-10 palabras.',
      fr: 'Vous êtes un expert en création de titres attrayants et descriptifs pour les quiz éducatifs. Créez un titre concis et informatif qui capture le sujet principal et le but du contenu. Le titre doit être engageant et professionnel, généralement de 3-10 mots.',
      de: 'Sie sind ein Experte für die Erstellung ansprechender und beschreibender Titel für Bildungsquiz. Erstellen Sie einen prägnanten, informativen Titel, der das Hauptthema und den Zweck des Inhalts erfasst. Der Titel sollte ansprechend und professionell sein, typischerweise 3-10 Wörter lang.',
      it: "Sei un esperto nella creazione di titoli coinvolgenti e descrittivi per quiz educativi. Crea un titolo conciso e informativo che catturi l'argomento principale e lo scopo del contenuto. Il titolo dovrebbe essere coinvolgente e professionale, tipicamente di 3-10 parole.",
      pt: 'Você é um especialista em criar títulos envolventes e descritivos para questionários educacionais. Crie um título conciso e informativo que capture o tópico principal e o propósito do conteúdo. O título deve ser envolvente e profissional, tipicamente de 3-10 palavras.',
      ru: 'Вы эксперт по созданию привлекательных и описательных заголовков для образовательных викторин. Создайте лаконичный, информативный заголовок, который отражает основную тему и цель контента. Заголовок должен быть привлекательным и профессиональным, обычно 3-10 слов.',
      zh: '您是创建引人入胜和描述性教育测验标题的专家。创建一个简洁、信息丰富的标题，捕捉内容的主要主题和目的。标题应该引人入胜且专业，通常3-10个词。',
      ja: 'あなたは教育クイズの魅力的で説明的なタイトルを作成する専門家です。コンテンツの主要なトピックと目的を捉える、簡潔で情報豊富なタイトルを作成してください。タイトルは魅力的でプロフェッショナルであり、通常3-10語です。',
      ko: '당신은 교육 퀴즈를 위한 매력적이고 설명적인 제목을 만드는 전문가입니다. 내용의 주요 주제와 목적을 포착하는 간결하고 정보가 풍부한 제목을 만드세요. 제목은 매력적이고 전문적이어야 하며, 일반적으로 3-10단어입니다.',
      ar: 'أنت خبير في إنشاء عناوين جذابة ووصفية للاختبارات التعليمية. أنشئ عنوانًا موجزًا ومفيدًا يلتقط الموضوع الرئيسي والغرض من المحتوى. يجب أن يكون العنوان جذابًا ومهنيًا، عادة من 3-10 كلمات.',
      hi: 'आप शैक्षिक प्रश्नोत्तरी के लिए आकर्षक विवरण बनाने के विशेषज्ञ हैं। एक स्पष्ट, जानकारीपूर्ण विवरण लिखें जो बताता हो कि प्रश्नोत्तरी क्या कवर करती है, इसका शैक्षिक मूल्य, और शिक्षार्थी क्या उम्मीद कर सकते हैं। विवरण 1-3 वाक्यों का होना चाहिए और पेशेवर रूप से लिखा होना चाहिए।',
      nl: 'Je bent een expert in het maken van overtuigende beschrijvingen voor educatieve quizzen. Schrijf een duidelijke, informatieve beschrijving die uitlegt wat de quiz behandelt, de educatieve waarde ervan en wat leerlingen kunnen verwachten. De beschrijving moet 1-3 zinnen lang zijn en professioneel geschreven.',
      sv: 'Du är expert på att skapa övertygande beskrivningar för utbildningsfrågor. Skriv en tydlig, informativ beskrivning som förklarar vad quizet täcker, dess utbildningsvärde och vad elever kan förvänta sig. Beskrivningen ska vara 1-3 meningar lång och professionellt skriven.',
      da: 'Du er ekspert i at skabe overbevisende beskrivelser til uddannelsesquizzer. Skriv en klar, informativ beskrivelse, der forklarer, hvad quizzen dækker, dens uddannelsesmæssige værdi, og hvad eleverne kan forvente. Beskrivelsen skal være 1-3 sætninger lang og professionelt skrevet.',
      no: 'Du er ekspert på å lage overbevisende beskrivelser for utdanningsquizer. Skriv en klar, informativ beskrivelse som forklarer hva quizen dekker, dens utdanningsmessige verdi og hva elevene kan forvente. Beskrivelsen skal være 1-3 setninger lang og profesjonelt skrevet.',
    };

    return prompts[language] || prompts['en'];
  }

  /**
   * Build system prompt for description generation
   */
  private getDescriptionSystemPrompt(language: string): string {
    const prompts = {
      en: 'You are an expert at creating compelling descriptions for educational quizzes. Write a clear, informative description that explains what the quiz covers, its educational value, and what learners can expect. The description should be 1-3 sentences long and professionally written.',
      es: 'Eres un experto en crear descripciones convincentes para cuestionarios educativos. Escribe una descripción clara e informativa que explique qué cubre el cuestionario, su valor educativo y qué pueden esperar los estudiantes. La descripción debe tener 1-3 oraciones y estar escrita profesionalmente.',
      fr: 'Vous êtes un expert en création de descriptions convaincantes pour les quiz éducatifs. Rédigez une description claire et informative qui explique ce que couvre le quiz, sa valeur éducative et ce que les apprenants peuvent attendre. La description doit faire 1-3 phrases et être rédigée professionnellement.',
      de: 'Sie sind ein Experte für die Erstellung überzeugender Beschreibungen für Bildungsquiz. Schreiben Sie eine klare, informative Beschreibung, die erklärt, was das Quiz abdeckt, seinen Bildungswert und was Lernende erwarten können. Die Beschreibung sollte 1-3 Sätze lang und professionell geschrieben sein.',
      it: 'Sei un esperto nella creazione di descrizioni convincenti per quiz educativi. Scrivi una descrizione chiara e informativa che spieghi cosa copre il quiz, il suo valore educativo e cosa possono aspettarsi gli studenti. La descrizione dovrebbe essere di 1-3 frasi e scritta professionalmente.',
      pt: 'Você é um especialista em criar descrições convincentes para questionários educacionais. Escreva uma descrição clara e informativa que explique o que o questionário aborda, seu valor educacional e o que os estudantes podem esperar. A descrição deve ter 1-3 frases e ser escrita profissionalmente.',
      ru: 'Вы эксперт по созданию убедительных описаний для образовательных викторин. Напишите ясное, информативное описание, объясняющее, что охватывает викторина, её образовательную ценность и что могут ожидать учащиеся. Описание должно быть длиной 1-3 предложения и написано профессионально.',
      zh: '您是为教育测验创建引人注目描述的专家。编写一个清晰、信息丰富的描述，解释测验涵盖的内容、其教育价值以及学习者可以期待什么。描述应该是1-3句话，并且专业撰写。',
      ja: 'あなたは教育クイズの魅力的な説明を作成する専門家です。クイズが何をカバーし、その教育的価値、学習者が何を期待できるかを説明する、明確で情報豊富な説明を書いてください。説明は1-3文で、専門的に書かれている必要があります。',
      ko: '당신은 교육 퀴즈를 위한 매력적인 설명을 만드는 전문가입니다. 퀴즈가 무엇을 다루는지, 교육적 가치, 학습자가 무엇을 기대할 수 있는지 설명하는 명확하고 정보가 풍부한 설명을 작성하세요. 설명은 1-3문장이어야 하며 전문적으로 작성되어야 합니다.',
      ar: 'أنت خبير في إنشاء وصف مقنع للاختبارات التعليمية. اكتب وصفًا واضحًا ومفيدًا يشرح ما يغطيه الاختبار وقيمته التعليمية وما يمكن للمتعلمين توقعه. يجب أن يكون الوصف من 1-3 جمل ومكتوبًا بشكل مهني.',
      hi: 'आप शैक्षिक प्रश्नोत्तरी के लिए आकर्षक विवरण बनाने के विशेषज्ञ हैं। एक स्पष्ट, जानकारीपूर्ण विवरण लिखें जो बताता हो कि प्रश्नोत्तरी क्या कवर करती है, इसका शैक्षिक मूल्य, और शिक्षार्थी क्या उम्मीद कर सकते हैं। विवरण 1-3 वाक्यों का होना चाहिए और पेशेवर रूप से लिखा होना चाहिए।',
      nl: 'Je bent een expert in het maken van overtuigende beschrijvingen voor educatieve quizzen. Schrijf een duidelijke, informatieve beschrijving die uitlegt wat de quiz behandelt, de educatieve waarde ervan en wat leerlingen kunnen verwachten. De beschrijving moet 1-3 zinnen lang zijn en professioneel geschreven.',
      sv: 'Du är expert på att skapa övertygande beskrivningar för utbildningsfrågor. Skriv en tydlig, informativ beskrivning som förklarar vad quizet täcker, dess utbildningsvärde och vad elever kan förvänta sig. Beskrivningen ska vara 1-3 meningar lång och professionellt skriven.',
      da: 'Du er ekspert i at skabe overbevisende beskrivelser til uddannelsesquizzer. Skriv en klar, informativ beskrivelse, der forklarer, hvad quizzen dækker, dens uddannelsesmæssige værdi, og hvad eleverne kan forvente. Beskrivelsen skal være 1-3 sætninger lang og professionelt skrevet.',
      no: 'Du er ekspert på å lage overbevisende beskrivelser for utdanningsquizer. Skriv en klar, informativ beskrivelse som forklarer hva quizen dekker, dens utdanningsmessige verdi og hva elevene kan forvente. Beskrivelsen skal være 1-3 setninger lang og profesjonelt skrevet.',
    };

    return prompts[language] || prompts['en'];
  }

  /**
   * Build prompt for title generation
   */
  private buildTitlePrompt(
    documentContent: string,
    filename: string,
    language: string,
  ): string {
    // Limit content to first 2000 characters for title generation
    const limitedContent = documentContent.substring(0, 2000);

    const prompts = {
      en: `Based on the following document content, create an engaging and descriptive title for a quiz about this material. The filename is "${filename}" but create a better, more descriptive title that captures the main topic.\n\nDocument content:\n${limitedContent}\n\nGenerate only the title, nothing else.`,
      es: `Basándote en el siguiente contenido del documento, crea un título atractivo y descriptivo para un cuestionario sobre este material. El nombre del archivo es "${filename}" pero crea un título mejor y más descriptivo que capture el tema principal.\n\nContenido del documento:\n${limitedContent}\n\nGenera solo el título, nada más.`,
      fr: `Basé sur le contenu du document suivant, créez un titre attrayant et descriptif pour un quiz sur ce matériel. Le nom du fichier est "${filename}" mais créez un titre meilleur et plus descriptif qui capture le sujet principal.\n\nContenu du document:\n${limitedContent}\n\nGénérez seulement le titre, rien d'autre.`,
      de: `Basierend auf dem folgenden Dokumentinhalt, erstellen Sie einen ansprechenden und beschreibenden Titel für ein Quiz über dieses Material. Der Dateiname ist "${filename}", aber erstellen Sie einen besseren, aussagekräftigeren Titel, der das Hauptthema erfasst.\n\nDokumentinhalt:\n${limitedContent}\n\nGenerieren Sie nur den Titel, sonst nichts.`,
    };

    return prompts[language] || prompts['en'];
  }

  /**
   * Build prompt for description generation
   */
  private buildDescriptionPrompt(
    documentContent: string,
    totalPages: number,
    totalQuestions: number,
    language: string,
  ): string {
    // Limit content to first 3000 characters for description generation
    const limitedContent = documentContent.substring(0, 3000);

    const prompts = {
      en: `Based on the following document content, create a compelling description for a quiz with ${totalQuestions} questions generated from a ${totalPages}-page document. The description should explain what topics the quiz covers and what learners will gain from taking it.\n\nDocument content:\n${limitedContent}\n\nGenerate only the description, nothing else.`,
      es: `Basándote en el siguiente contenido del documento, crea una descripción convincente para un cuestionario con ${totalQuestions} preguntas generadas de un documento de ${totalPages} páginas. La descripción debe explicar qué temas cubre el cuestionario y qué ganarán los estudiantes al tomarlo.\n\nContenido del documento:\n${limitedContent}\n\nGenera solo la descripción, nada más.`,
      fr: `Basé sur le contenu du document suivant, créez une description convaincante pour un quiz avec ${totalQuestions} questions générées à partir d'un document de ${totalPages} pages. La description doit expliquer quels sujets le quiz couvre et ce que les apprenants gagneront en le prenant.\n\nContenu du document:\n${limitedContent}\n\nGénérez seulement la description, rien d'autre.`,
      de: `Basierend auf dem folgenden Dokumentinhalt, erstellen Sie eine überzeugende Beschreibung für ein Quiz mit ${totalQuestions} Fragen, die aus einem ${totalPages}-seitigen Dokument generiert wurden. Die Beschreibung sollte erklären, welche Themen das Quiz abdeckt und was die Lernenden durch die Teilnahme gewinnen werden.\n\nDokumentinhalt:\n${limitedContent}\n\nGenerieren Sie nur die Beschreibung, sonst nichts.`,
    };

    return prompts[language] || prompts['en'];
  }

  /**
   * Get fallback title when AI generation fails
   */
  private getFallbackTitle(filename: string, language: string): string {
    const baseName = filename.replace(/\.[^/.]+$/, ''); // Remove extension

    const titles = {
      en: `Quiz: ${baseName}`,
      es: `Cuestionario: ${baseName}`,
      fr: `Quiz: ${baseName}`,
      de: `Quiz: ${baseName}`,
      it: `Quiz: ${baseName}`,
      pt: `Questionário: ${baseName}`,
      ru: `Викторина: ${baseName}`,
      zh: `测验: ${baseName}`,
      ja: `クイズ: ${baseName}`,
      ko: `퀴즈: ${baseName}`,
      ar: `اختبار: ${baseName}`,
      hi: `प्रश्नोत्तरी: ${baseName}`,
      nl: `Quiz: ${baseName}`,
      sv: `Frågesport: ${baseName}`,
      da: `Quiz: ${baseName}`,
      no: `Quiz: ${baseName}`,
    };

    return titles[language] || titles['en'];
  }

  /**
   * Get fallback description when AI generation fails
   */
  private getFallbackDescription(
    totalPages: number,
    totalQuestions: number,
    language: string,
  ): string {
    const descriptions = {
      en: `Generated from a ${totalPages}-page document with ${totalQuestions} questions covering key concepts and important information.`,
      es: `Generado a partir de un documento de ${totalPages} páginas con ${totalQuestions} preguntas que cubren conceptos clave e información importante.`,
      fr: `Généré à partir d'un document de ${totalPages} pages avec ${totalQuestions} questions couvrant les concepts clés et les informations importantes.`,
      de: `Erstellt aus einem ${totalPages}-seitigen Dokument mit ${totalQuestions} Fragen zu wichtigen Konzepten und Informationen.`,
      it: `Generato da un documento di ${totalPages} pagine con ${totalQuestions} domande sui concetti chiave e informazioni importanti.`,
      pt: `Gerado a partir de um documento de ${totalPages} páginas com ${totalQuestions} perguntas cobrindo conceitos-chave e informações importantes.`,
      ru: `Создано из документа на ${totalPages} страницах с ${totalQuestions} вопросами по ключевым концепциям и важной информации.`,
      zh: `从 ${totalPages} 页文档生成，包含 ${totalQuestions} 个涵盖关键概念和重要信息的问题。`,
      ja: `${totalPages}ページの文書から生成され、重要な概念と情報をカバーする${totalQuestions}の質問が含まれています。`,
      ko: `${totalPages}페이지 문서에서 생성되었으며, 핵심 개념과 중요한 정보를 다루는 ${totalQuestions}개의 질문이 포함되어 있습니다.`,
      ar: `تم إنشاؤه من وثيقة مكونة من ${totalPages} صفحة مع ${totalQuestions} سؤالاً يغطي المفاهيم الأساسية والمعلومات المهمة.`,
      hi: `${totalPages} पृष्ठों के दस्तावेज़ से उत्पन्न, जिसमें मुख्य अवधारणाओं और महत्वपूर्ण जानकारी को कवर करने वाले ${totalQuestions} प्रश्न हैं।`,
      nl: `Gegenereerd uit een document van ${totalPages} pagina's met ${totalQuestions} vragen die belangrijke concepten en informatie behandelen.`,
      sv: `Genererad från ett ${totalPages}-sidigt dokument med ${totalQuestions} frågor som täcker viktiga koncept och information.`,
      da: `Genereret fra et ${totalPages}-siders dokument med ${totalQuestions} spørgsmål, der dækker vigtige begreber og information.`,
      no: `Generert fra et ${totalPages}-siders dokument med ${totalQuestions} spørsmål som dekker viktige konsepter og informasjon.`,
    };

    return descriptions[language] || descriptions['en'];
  }

  /**
   * Get the original multiple-choice system prompt for backward compatibility
   */
  private getMultipleChoiceSystemPrompt(
    language: string,
    includeExplanations: boolean,
  ): string {
    const langConfig = LANGUAGE_CONFIGS[language] || LANGUAGE_CONFIGS['en'];

    const baseInstructions = {
      en: {
        role: 'You are an expert quiz creator that generates high-quality multiple-choice questions from educational content.',
        format: 'Always respond with valid JSON in exactly this format',
        explanations: includeExplanations
          ? 'Include detailed explanations for why each answer is correct.'
          : 'Do not include explanations.',
      },
      es: {
        role: 'Eres un creador experto de cuestionarios que genera preguntas de opción múltiple de alta calidad a partir de contenido educativo.',
        format: 'Siempre responde con JSON válido en exactamente este formato',
        explanations: includeExplanations
          ? 'Incluye explicaciones detalladas de por qué cada respuesta es correcta.'
          : 'No incluyas explicaciones.',
      },
      fr: {
        role: 'Vous êtes un créateur expert de quiz qui génère des questions à choix multiples de haute qualité à partir de contenu éducatif.',
        format:
          'Répondez toujours avec du JSON valide dans exactement ce format',
        explanations: includeExplanations
          ? 'Incluez des explications détaillées sur pourquoi chaque réponse est correcte.'
          : "N'incluez pas d'explications.",
      },
      de: {
        role: 'Sie sind ein Experte für die Erstellung von Quiz, der hochwertige Multiple-Choice-Fragen aus Bildungsinhalten generiert.',
        format: 'Antworten Sie immer mit gültigem JSON in genau diesem Format',
        explanations: includeExplanations
          ? 'Fügen Sie detaillierte Erklärungen hinzu, warum jede Antwort richtig ist.'
          : 'Fügen Sie keine Erklärungen hinzu.',
      },
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
   * Get question format examples for different question types
   */
  private getQuestionFormats(
    questionTypes: string[],
    includeExplanations: boolean,
  ): string {
    const formats: string[] = [];

    if (questionTypes.includes('multiple-choice')) {
      formats.push(`  {
    "type": "multiple-choice",
    "question": "Question text here?",
    "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
    "correctAnswer": "A",
    "difficulty": "easy|medium|hard",
    "explanation": "${includeExplanations ? 'Explanation here' : ''}"
  }`);
    }

    if (questionTypes.includes('flashcard')) {
      formats.push(`  {
    "type": "flashcard",
    "front": "Question or concept",
    "back": "Answer or explanation",
    "difficulty": "easy|medium|hard",
    "explanation": "${includeExplanations ? 'Additional context' : ''}"
  }`);
    }

    if (questionTypes.includes('true-false')) {
      formats.push(`  {
    "type": "true-false",
    "statement": "Statement to evaluate",
    "correctAnswer": true,
    "difficulty": "easy|medium|hard",
    "explanation": "${includeExplanations ? 'Why this is true/false' : ''}"
  }`);
    }

    if (questionTypes.includes('fill-in-blank')) {
      formats.push(`  {
    "type": "fill-in-blank",
    "text": "Text with {{blank}} to fill",
    "blanks": ["correct answer"],
    "difficulty": "easy|medium|hard",
    "explanation": "${includeExplanations ? 'Explanation of answer' : ''}"
  }`);
    }

    if (questionTypes.includes('short-answer')) {
      formats.push(`  {
    "type": "short-answer",
    "question": "Question requiring short answer",
    "expectedAnswer": "Expected answer",
    "keywords": ["key", "terms"],
    "difficulty": "easy|medium|hard",
    "explanation": "${includeExplanations ? 'Answer explanation' : ''}"
  }`);
    }

    return formats.join(',\n');
  }

  /**
   * Determine which question types to generate based on options
   */
  private getQuestionTypesToGenerate(
    options: Required<PdfToQuizOptions>,
  ): string[] {
    // If specific question types are provided, use them
    if (options.questionTypes && options.questionTypes.length > 0) {
      return options.questionTypes;
    }

    // If quiz type is specified and not mixed, use that type
    if (options.quizType && options.quizType !== 'mixed') {
      return [options.quizType];
    }

    // Default to multiple-choice for backward compatibility
    return ['multiple-choice'];
  }
}
