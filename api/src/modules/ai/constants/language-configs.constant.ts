/**
 * Language configuration for AI prompts and instructions
 * Supports multiple languages for quiz generation
 */
export interface LanguageConfig {
  name: string;
  prompt: string;
  difficultyLabels: {
    easy: string;
    medium: string;
    hard: string;
  };
}

/**
 * Supported languages with their configurations
 */
export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
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
} as const;

/**
 * Get supported languages as array of objects
 */
export function getSupportedLanguages(): Array<{ code: string; name: string }> {
  return Object.entries(LANGUAGE_CONFIGS).map(([code, config]) => ({
    code,
    name: config.name,
  }));
}

/**
 * Get language configuration or fallback to English
 */
export function getLanguageConfig(language: string): LanguageConfig {
  return LANGUAGE_CONFIGS[language] || LANGUAGE_CONFIGS['en'];
}