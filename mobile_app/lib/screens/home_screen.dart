import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';
import 'dart:async';
import '../services/api_service.dart';
import '../models/file_upload.dart';
import '../models/quiz.dart';
import '../utils/constants.dart';
import '../utils/error_handler.dart';
import 'live_quiz_generation_screen.dart';
import '../widgets/file_upload/file_upload_card.dart';
import '../widgets/settings/quiz_settings_card.dart';
import '../widgets/quiz/score_card.dart';
import '../widgets/generation/generation_progress_card.dart';
import '../composables/file_upload_composable.dart';
import '../composables/quiz_interactions_composable.dart';
import '../widgets/common/custom_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _apiService = ApiService();
  
  // Composables - initialized directly instead of using late
  FileUploadComposable? _fileUpload;
  QuizInteractionsComposable? _quizInteractions;
  
  // State
  Map<String, dynamic>? _serverConfig;
  List<Map<String, dynamic>> _supportedLanguages = [];
  String _selectedLanguage = 'en';
  int _questionsPerPage = 2;
  String _difficulty = 'mixed';
  bool _includeExplanations = true;

  @override
  void initState() {
    super.initState();
    _initializeComposables();
    _loadServerConfig();
    _loadSupportedLanguages();
  }

  void _initializeComposables() {
    _fileUpload = FileUploadComposable();
    _quizInteractions = QuizInteractionsComposable();
    
    _fileUpload?.addListener(() => setState(() {}));
    _quizInteractions?.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _fileUpload?.dispose();
    _quizInteractions?.dispose();
    super.dispose();
  }

  Future<void> _loadServerConfig() async {
    try {
      final config = await _apiService.getServerConfig();
      setState(() {
        _serverConfig = config;
      });
    } catch (e) {
      setState(() {
        _serverConfig = {
          'maxFileSizeBytes': 100 * 1024 * 1024,
          'allowedFileTypes': ['pdf'],
        };
      });
    }
  }

  Future<void> _loadSupportedLanguages() async {
    try {
      final languages = await _apiService.getSupportedLanguages();
      setState(() {
        _supportedLanguages = languages;
        if (_supportedLanguages.isNotEmpty && 
            !_supportedLanguages.any((lang) => lang['code'] == _selectedLanguage)) {
          _selectedLanguage = _supportedLanguages.first['code'] as String;
        }
      });
    } catch (e) {
      setState(() {
        _supportedLanguages = [
          {'code': 'en', 'name': 'English'},
          {'code': 'es', 'name': 'Spanish'},
          {'code': 'fr', 'name': 'French'},
          {'code': 'de', 'name': 'German'},
          {'code': 'it', 'name': 'Italian'},
          {'code': 'pt', 'name': 'Portuguese'},
          {'code': 'ru', 'name': 'Russian'},
          {'code': 'zh', 'name': 'Chinese'},
        ];
      });
    }
  }

  String get _maxFileSizeDisplay {
    if (_serverConfig?['config']?['maxPdfSizeMB'] != null) {
      return '${_serverConfig!['config']['maxPdfSizeMB']}MB';
    }
    return '${AppConstants.maxFileSizeMB}MB';
  }

  void _generateQuiz() {
    if (_fileUpload?.uploadedFile != null && _fileUpload?.uploadedFileInfo != null) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => LiveQuizGenerationScreen(
            pdfFile: _fileUpload!.uploadedFile!,
            fileName: _fileUpload!.uploadedFileInfo!.filename,
            language: _selectedLanguage,
            questionsPerPage: _questionsPerPage,
            difficulty: _difficulty,
            includeExplanations: _includeExplanations,
          ),
        ),
      );
    }
  }

  void _removeFile() {
    _fileUpload?.clearUploadedFile();
  }

  @override
  Widget build(BuildContext context) {
    // Safety check to ensure composables are initialized
    if (_fileUpload == null || _quizInteractions == null) {
      return Scaffold(
        backgroundColor: const Color(0xFFF9FAFB), // gray-50
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Header - Match web design
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                child: const Text(
                  '🧠 QuizAi',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF111827), // gray-900
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              // Main Content
              Container(
                constraints: const BoxConstraints(maxWidth: 896), // max-w-7xl equivalent
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 32),
                child: Column(
                  children: [
                    // Hero Section - Match web design but simplified
                    if (!_fileUpload!.hasUploadedFile) ...[
                      const Text(
                        'Transform Any PDF into an',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF111827), // gray-900
                          height: 1.1,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const Text(
                        'Interactive Quiz',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2563EB), // blue-600
                          height: 1.1,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Upload your study materials, textbooks, or documents and instantly generate personalized, AI-powered quizzes.',
                        style: TextStyle(
                          fontSize: 18,
                          color: Color(0xFF6B7280), // gray-500
                          height: 1.5,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      
                      // Feature badges - simplified from web version
                      Wrap(
                        alignment: WrapAlignment.center,
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDCFCE7), // green-100
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              '✨ Powered by Advanced AI',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF166534), // green-800
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDBEAFE), // blue-100
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              '⚡ Instant Generation',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF1E40AF), // blue-800
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),

                      const Text(
                        'Get Started - Upload Your PDF Below',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1F2937), // gray-800
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Maximum file size: $_maxFileSizeDisplay • PDF files only • Free to use',
                        style: const TextStyle(
                          fontSize: 14,
                          color: Color(0xFF6B7280), // gray-500
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),
                    ],

                    // File Upload Section
                    if (!_fileUpload!.hasUploadedFile) 
                      FileUploadCard(
                        onUploadPressed: _fileUpload!.selectAndUploadFile,
                        isUploading: _fileUpload!.isUploading,
                        uploadProgress: _fileUpload!.uploadProgress,
                        maxFileSize: _maxFileSizeDisplay,
                        error: _fileUpload!.uploadError,
                        uploadedFile: _fileUpload!.uploadedFile,
                      ),

                    // File Uploaded - Pre-Generation Options
                    if (_fileUpload!.hasUploadedFile) ...[
                      const SizedBox(height: 32),
                      Container(
                        width: double.infinity,
                        constraints: const BoxConstraints(maxWidth: 672), // max-w-2xl
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFE5E7EB)), // gray-200
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 32,
                                  height: 32,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFF10B981), // green-500
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.check,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                const Text(
                                  '📄 PDF Uploaded Successfully!',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF111827), // gray-900
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Your PDF is ready for quiz generation. Not the right file?',
                              style: TextStyle(
                                fontSize: 16,
                                color: Color(0xFF6B7280), // gray-600
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            OutlinedButton.icon(
                              onPressed: _removeFile,
                              icon: const Icon(Icons.attach_file),
                              label: const Text('📎 Upload Different File'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFFEA580C), // orange-600
                                side: const BorderSide(color: Color(0xFFEA580C)), // orange-600
                                backgroundColor: const Color(0xFFFFF7ED), // orange-50
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 24),
                      
                      // Quiz Settings
                      QuizSettingsCard(
                        supportedLanguages: _supportedLanguages,
                        selectedLanguage: _selectedLanguage,
                        onLanguageChanged: (language) {
                          setState(() {
                            _selectedLanguage = language;
                          });
                        },
                        questionsPerPage: _questionsPerPage,
                        onQuestionsPerPageChanged: (count) {
                          setState(() {
                            _questionsPerPage = count;
                          });
                        },
                        difficulty: _difficulty,
                        onDifficultyChanged: (difficulty) {
                          setState(() {
                            _difficulty = difficulty;
                          });
                        },
                        includeExplanations: _includeExplanations,
                        onIncludeExplanationsChanged: (include) {
                          setState(() {
                            _includeExplanations = include;
                          });
                        },
                      ),
                      
                      const SizedBox(height: 24),
                      
                      // Generate Quiz Button
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton.icon(
                          onPressed: _generateQuiz,
                          icon: const Icon(Icons.auto_awesome, size: 24),
                          label: const Text(
                            'Generate Quiz ⚡',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2563EB), // blue-600
                            foregroundColor: Colors.white,
                            elevation: 2,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ),
                    ],


                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }


} 