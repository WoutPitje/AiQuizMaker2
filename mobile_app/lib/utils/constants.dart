class AppConstants {
  // API Configuration
  static const String devApiUrl = 'http://127.0.0.1:3001';
  static const String prodApiUrl = 'https://quizai.nl/api';
  
  // Environment
  static const bool isDev = true; // Change to false for production
  static String get apiUrl => isDev ? devApiUrl : prodApiUrl;
  
  // API Endpoints
  static const String uploadEndpoint = '/upload';
  static const String configEndpoint = '/config';
  static const String languagesEndpoint = '/languages';
  static const String quizzesEndpoint = '/quizzes';
  static const String filesEndpoint = '/files';
  
  // Quiz Generation
  static String quizStreamEndpoint(String filename) => '/generate-quiz-stream/$filename';
  static String quizByIdEndpoint(String quizId) => '/quiz/$quizId';
  static String quizByMagicLinkEndpoint(String magicLink) => '/quiz/magic/$magicLink';
  
  // File Constraints
  static const int maxFileSizeBytes = 104857600; // 100MB
  static const int maxFileSizeMB = 100;
  static const List<String> allowedFileTypes = ['pdf'];
  
  // Quiz Settings
  static const int defaultQuestionsPerPage = 2;
  static const int maxQuestionsPerPage = 5;
  static const int minQuestionsPerPage = 1;
  
  // Network Settings
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 60);
  static const Duration sendTimeout = Duration(seconds: 60);
  static const int maxRetries = 3;
  
  // App Settings
  static const String appName = 'QuizAi';
  static const String appVersion = '1.0.0';
  
  // Storage Keys
  static const String settingsKey = 'app_settings';
  static const String quizCacheKey = 'cached_quizzes';
  static const String languageKey = 'selected_language';
  static const String themeKey = 'selected_theme';
  
  // UI Constants
  static const double borderRadius = 12.0;
  static const double padding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  
  // Animation Durations
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 400);
  static const Duration longAnimation = Duration(milliseconds: 600);
  
  // Quiz Generation Events
  static const String eventQuizStarted = 'quiz-started';
  static const String eventProcessingPdf = 'processing-pdf';
  static const String eventExtractingText = 'extracting-text';
  static const String eventGeneratingMetadata = 'generating-metadata';
  static const String eventMetadataGenerated = 'metadata-generated';
  static const String eventGeneratingQuestions = 'generating-questions';
  static const String eventQuestionGenerated = 'question-generated';
  static const String eventQuizCompleted = 'quiz-completed';
  static const String eventError = 'error';
} 