import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';
import 'dart:async';
import '../services/api_service.dart';
import '../models/file_upload.dart';
import '../models/quiz.dart';
import '../utils/constants.dart';
import '../utils/error_handler.dart';
import 'quiz_generation_screen.dart';
import 'quiz_screen.dart';
import 'streaming_quiz_screen.dart';
import 'live_quiz_generation_screen.dart';
import '../widgets/file_upload/file_upload_card.dart';
import '../widgets/settings/quiz_settings_card.dart';
import '../widgets/quiz/score_card.dart';
import '../widgets/generation/generation_progress_card.dart';
import '../composables/file_upload_composable.dart';
import '../composables/quiz_generation_composable.dart';
import '../composables/quiz_interactions_composable.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _apiService = ApiService();
  
  // State matching web app
  bool _isUploading = false;
  double _uploadProgress = 0.0;
  String? _uploadError;
  File? _uploadedFile;
  UploadedFile? _uploadedFileInfo;
  bool _hasUploadedFile = false;
  bool _isGeneratingQuiz = false;
  bool _hasGeneratedQuiz = false;
  String? _quizError;
  Map<String, dynamic>? _serverConfig;
  String _selectedLanguage = 'en';
  List<Map<String, dynamic>> _supportedLanguages = [];
  int _questionsPerPage = 2;
  String _difficulty = 'mixed';
  bool _includeExplanations = true;

  // Streaming quiz generation state (like web app)
  String _streamingProgress = '';
  List<Question> _streamingQuestions = [];
  int _currentPage = 0;
  int _totalPages = 0;
  Quiz? _completedQuiz;
  StreamSubscription? _streamSubscription;
  Map<String, dynamic>? _quizStats;

  @override
  void initState() {
    super.initState();
    _loadServerConfig();
    _loadSupportedLanguages();
  }

  Future<void> _loadServerConfig() async {
    try {
      final config = await _apiService.getServerConfig();
      setState(() {
        _serverConfig = config;
      });
    } catch (e) {
      print('⚠️ Failed to load server config: $e');
      // Provide defaults
      setState(() {
        _serverConfig = {
          'maxFileSizeBytes': 100 * 1024 * 1024, // 100MB
          'allowedFileTypes': ['pdf'],
        };
      });
    }
  }

  Future<void> _loadSupportedLanguages() async {
    try {
      print('🌐 Loading supported languages...');
      final languages = await _apiService.getSupportedLanguages();
      print('🌐 Loaded ${languages.length} languages: ${languages.map((l) => l['name']).join(', ')}');
      setState(() {
        _supportedLanguages = languages;
        // Ensure selected language is valid
        if (_supportedLanguages.isNotEmpty && 
            !_supportedLanguages.any((lang) => lang['code'] == _selectedLanguage)) {
          _selectedLanguage = _supportedLanguages.first['code'] as String;
        }
      });
    } catch (e) {
      print('⚠️ Failed to load supported languages: $e');
      // Provide fallback languages that match the web app
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

  Future<void> _selectAndUploadFile() async {
    print('🔍 _selectAndUploadFile called'); // Debug log
    
    try {
      // Clear previous state
      setState(() {
        _uploadError = null;
      });

      print('📁 Opening file picker...'); // Debug log
      
      FilePickerResult? result;
      
      try {
        // Primary approach: Custom type with PDF extension
        result = await FilePicker.platform.pickFiles(
          type: FileType.custom,
          allowedExtensions: ['pdf'],
          allowMultiple: false,
          allowCompression: false,
          withData: false,
          withReadStream: false,
          lockParentWindow: false,
        );
      } catch (e) {
        print('⚠️ Custom file picker failed, trying fallback: $e');
        
        // Fallback approach: Any file type, we'll validate later
        try {
          result = await FilePicker.platform.pickFiles(
            type: FileType.any,
            allowMultiple: false,
            allowCompression: false,
            withData: false,
            withReadStream: false,
            lockParentWindow: false,
          );
        } catch (e2) {
          print('💥 Fallback file picker also failed: $e2');
          throw Exception('File picker not available on this device. Error: ${e2.toString()}');
        }
      }

      print('📁 File picker result: $result'); // Debug log
      print('📁 Result files: ${result?.files}'); // Debug log
      print('📁 Result count: ${result?.count}'); // Debug log

      if (result != null) {
        print('📁 Files found: ${result.files.length}'); // Debug log
        
        if (result.files.isNotEmpty) {
          final pickedFile = result.files.first;
          print('📄 Picked file details:'); // Debug log
          print('  - Name: ${pickedFile.name}'); // Debug log
          print('  - Path: ${pickedFile.path}'); // Debug log
          print('  - Size: ${pickedFile.size}'); // Debug log
          print('  - Extension: ${pickedFile.extension}'); // Debug log
          
          // Validate file is PDF
          if (!pickedFile.name.toLowerCase().endsWith('.pdf') && 
              pickedFile.extension?.toLowerCase() != 'pdf') {
            setState(() {
              _uploadError = '"${pickedFile.name}" is not a PDF file. Only PDF files are allowed.';
            });
            return;
          }
          
          if (pickedFile.path != null) {
            final file = File(pickedFile.path!);
            print('📄 Selected file: ${file.path}'); // Debug log
            await _uploadFile(file);
          } else {
            print('❌ File path is null'); // Debug log
            setState(() {
              _uploadError = 'Unable to access the selected file. Please try again or select a different file.';
            });
          }
        } else {
          print('❌ No files in result'); // Debug log
          // User cancelled or no files selected - don't show error
        }
      } else {
        print('❌ File picker result is null - user likely cancelled'); // Debug log
        // User cancelled - don't show error
      }
    } catch (e) {
      print('💥 File picker error: $e'); // Debug log
      setState(() {
        _uploadError = 'Failed to open file picker: ${e.toString()}. Make sure the app has permission to access files.';
      });
    }
  }

  Future<void> _uploadFile(File file) async {
    // Validate file type (client-side validation like web app)
    if (file.path.split('.').last.toLowerCase() != 'pdf') {
      setState(() {
        _uploadError = '"${file.path.split('/').last}" is not a PDF file. Only PDF files are allowed.';
      });
      return;
    }

    // Validate file size
    try {
      final fileSize = await file.length();
      final maxSize = _serverConfig?['config']?['maxPdfSize'] ?? AppConstants.maxFileSizeBytes;
      
      if (fileSize > maxSize) {
        final maxSizeMB = (maxSize / (1024 * 1024)).round();
        final fileSizeMB = (fileSize / (1024 * 1024)).round();
        setState(() {
          _uploadError = '"${file.path.split('/').last}" is too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB.';
        });
        return;
      }

      setState(() {
        _isUploading = true;
        _uploadProgress = 0.0;
        _hasUploadedFile = false;
        _uploadedFileInfo = null;
      });

      try {
        final response = await _apiService.uploadFile(
          file,
          onSendProgress: (sent, total) {
            setState(() {
              _uploadProgress = sent / total;
            });
          },
        );

        if (response.success && response.file != null) {
          setState(() {
            _isUploading = false;
            _hasUploadedFile = true;
            _uploadedFileInfo = response.file;
            _uploadedFile = file; // Keep reference to the file for quiz generation
          });
          
          // Show success message
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('✅ PDF uploaded successfully!'),
                backgroundColor: Colors.green,
                duration: Duration(seconds: 2),
              ),
            );
          }
        } else {
          setState(() {
            _isUploading = false;
            _uploadError = response.error ?? 'Upload failed';
          });
        }
      } catch (e) {
        setState(() {
          _isUploading = false;
          _uploadError = e.toString();
        });
      }
    } catch (e) {
      setState(() {
        _uploadError = 'Failed to read file: ${e.toString()}';
      });
    }
  }

  void _generateQuiz() async {
    if (_uploadedFile == null) {
      setState(() {
        _uploadError = 'No file uploaded. Please upload a PDF file first.';
      });
      return;
    }

    try {
      print('🎯 Navigating to live quiz generation screen...');
      print('📋 Options: language=$_selectedLanguage, questionsPerPage=$_questionsPerPage, difficulty=$_difficulty, explanations=$_includeExplanations');
      
      // Navigate to live generation screen immediately
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => LiveQuizGenerationScreen(
            pdfFile: _uploadedFile!,
            fileName: _uploadedFileInfo?.filename ?? 'document.pdf',
          ),
        ),
      );
      
    } catch (e) {
      setState(() {
        _quizError = 'Failed to start quiz generation: ${e.toString()}';
      });
    }
  }

  void _handleStreamEvent(Map<String, dynamic> data) {
    if (!mounted) return;
    
    setState(() {
      final type = data['type'];
      final eventData = data['data'];
      
      print('📡 Handling stream event: $type');
      
      switch (type) {
        case 'start':
          _streamingProgress = eventData?['message'] ?? 'Starting quiz generation...';
          break;
        case 'progress':
          _streamingProgress = eventData?['message'] ?? 'Processing...';
          break;
        case 'pdf-processed':
          _streamingProgress = eventData?['message'] ?? 'PDF processed successfully';
          if (eventData?['pagesToProcess'] != null) {
            _totalPages = eventData['pagesToProcess'];
          }
          break;
        case 'page-processing':
          _currentPage = eventData?['currentPage'] ?? 0;
          _totalPages = eventData?['totalPages'] ?? _totalPages;
          _streamingProgress = 'Page $_currentPage/$_totalPages: ${eventData?['message'] ?? 'Processing...'}';
          break;
        case 'question-generated':
          if (eventData?['question'] != null) {
            final question = Question.fromJson(eventData['question']);
            _streamingQuestions.add(question);
            final totalQuestions = eventData?['totalQuestions'] ?? _streamingQuestions.length;
            _streamingProgress = 'Generated $totalQuestions questions so far...';
          }
          break;
        case 'page-skipped':
          _streamingProgress = eventData?['message'] ?? 'Page skipped';
          break;
        case 'page-warning':
          print('⚠️ Page warning: ${eventData?['message']}');
          _streamingProgress = eventData?['message'] ?? 'Warning during processing';
          break;
        case 'page-error':
          print('❌ Page error: ${eventData?['error']}');
          _streamingProgress = 'Error on page ${eventData?['pageNumber']}: ${eventData?['error']}';
          break;
        case 'finalizing':
          _streamingProgress = eventData?['message'] ?? 'Finalizing quiz...';
          break;
        case 'completed':
          print('🎉 Quiz generation completed!');
          if (eventData?['quiz'] != null) {
            _completedQuiz = Quiz.fromJson(eventData['quiz']);
            _hasGeneratedQuiz = true;
            _streamingProgress = 'Quiz completed successfully!';
            _quizStats = eventData?['stats'];
            
            // Transfer streaming questions to final quiz
            if (_completedQuiz?.questions != null) {
              _streamingQuestions = _completedQuiz!.questions;
            }
            
            // Navigate to quiz screen when completed
            _navigateToQuizScreen();
          }
          _isGeneratingQuiz = false;
          break;
        case 'error':
          print('❌ Stream error: ${eventData?['error']}');
          _quizError = eventData?['error'] ?? 'An error occurred during quiz generation';
          _isGeneratingQuiz = false;
          break;
        default:
          print('⚠️ Unknown event type: $type');
      }
    });
  }

  @override
  void dispose() {
    _streamSubscription?.cancel();
    super.dispose();
  }

  void _uploadNewFile() {
    setState(() {
      _hasUploadedFile = false;
      _hasGeneratedQuiz = false;
      _uploadedFile = null;
      _uploadedFileInfo = null;
      _uploadError = null;
      _quizError = null;
    });
  }

  void _clearError() {
    setState(() {
      _uploadError = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Header (matching web app)
              _buildHeader(),
              
              // Main Content
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    // Hero Section (matching web app)
                    _buildHeroSection(),
                    
                    const SizedBox(height: 32),
                    
                    // File Upload Section (matching web app logic)
                    if (!_hasUploadedFile) 
                      _buildFileUploadSection()
                    else
                      _buildUploadSuccessSection(),
                    
                    // Error Display (matching web app)
                    if (_uploadError != null) _buildErrorSection(),
                    
                    // Quiz Error Display
                    if (_quizError != null) _buildQuizErrorSection(),
                    
                    // Streaming Progress Display (only during generation)
                    if (_isGeneratingQuiz) 
                      _buildStreamingQuizDisplay(),
                    
                    const SizedBox(height: 40),
                    
                    // Features Section (matching web app)
                    _buildFeaturesSection(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      color: Colors.white,
      child: Container(
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: Colors.grey, width: 0.2)),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 20.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '🧠 QuizAi',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              Row(
                children: [
                  // Simplified header buttons for mobile
                  IconButton(
                    onPressed: () {},
                    icon: const Icon(Icons.info_outline),
                    color: Colors.blue[600],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeroSection() {
    return Column(
      children: [
        const Text(
          'Transform Any PDF into an Interactive Quiz',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        const Text(
          'Upload your study materials, textbooks, or documents and instantly generate personalized, AI-powered quizzes.',
          style: TextStyle(
            fontSize: 16,
            color: Colors.black54,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 20),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          alignment: WrapAlignment.center,
          children: [
            _buildFeatureChip('✨ Powered by Advanced AI', Colors.green),
            _buildFeatureChip('⚡ Instant Quiz Generation', Colors.blue),
            _buildFeatureChip('📚 Any Learning Material', Colors.purple),
          ],
        ),
        const SizedBox(height: 20),
        const Text(
          'Get Started - Upload Your PDF Below',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'Maximum file size: $_maxFileSizeDisplay • PDF files only • Free to use',
          style: const TextStyle(
            fontSize: 14,
            color: Colors.black54,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildFeatureChip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: color.withOpacity(0.8),
        ),
      ),
    );
  }

    Widget _buildFileUploadSection() {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          print('🖱️ Upload box tapped!'); // Debug log
          if (!_isUploading) {
            _selectAndUploadFile();
          } else {
            print('⚠️ Upload in progress, ignoring tap'); // Debug log
          }
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            border: Border.all(
              color: Colors.grey[300]!,
              width: 2,
              style: BorderStyle.solid,
            ),
            borderRadius: BorderRadius.circular(12),
            color: _isUploading ? Colors.grey[100] : Colors.white,
          ),
          child: Column(
          children: [
            Icon(
              Icons.cloud_upload_outlined,
              size: 48,
              color: _isUploading ? Colors.grey : Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              _isUploading ? 'Uploading...' : 'Upload your PDF file',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _isUploading 
                ? '${(_uploadProgress * 100).toInt()}%'
                : 'Tap to browse for your PDF file',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              'Maximum file size: $_maxFileSizeDisplay',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[500],
              ),
              textAlign: TextAlign.center,
            ),
            if (_isUploading) ...[
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
                child: FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: _uploadProgress,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.blue[600],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
        ),
      ),
    );
  }

  Widget _buildUploadSuccessSection() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          // Success header
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.check_circle, color: Colors.green[500], size: 24),
              const SizedBox(width: 8),
              const Text(
                '📄 PDF Uploaded Successfully!',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Your PDF is ready for quiz generation. Not the right file?',
            style: TextStyle(color: Colors.grey[600]),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          
          // Upload different file button
          OutlinedButton.icon(
            onPressed: _uploadNewFile,
            icon: const Icon(Icons.upload_file, size: 16),
            label: const Text('📎 Upload Different File'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.orange[700],
              side: BorderSide(color: Colors.orange[300]!),
              backgroundColor: Colors.orange[50],
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Language Selection (exact match to web app)
          Container(
            margin: const EdgeInsets.only(bottom: 24),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFDBEAFE), // bg-blue-50
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFBFDBFE)), // border-blue-200
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '🌐 Quiz Language',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF1E3A8A), // text-blue-900
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: const Color(0xFF93C5FD)), // border-blue-300
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _supportedLanguages.any((lang) => lang['code'] == _selectedLanguage) 
                          ? _selectedLanguage 
                          : (_supportedLanguages.isNotEmpty ? _supportedLanguages.first['code'] : 'en'),
                      isExpanded: true,
                      items: _supportedLanguages.isEmpty 
                          ? [const DropdownMenuItem<String>(value: 'en', child: Text('English'))]
                          : _supportedLanguages.map((language) {
                              return DropdownMenuItem<String>(
                                value: language['code'],
                                child: Text(language['name'] as String),
                              );
                            }).toList(),
                      onChanged: (String? newValue) {
                        setState(() {
                          _selectedLanguage = newValue ?? 'en';
                        });
                      },
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Questions and answers will be generated in the selected language',
                  style: TextStyle(
                    fontSize: 11,
                    color: const Color(0xFF1D4ED8), // text-blue-700
                  ),
                ),
              ],
            ),
          ),
          
          // Quiz Generation Options (exact match to web app)
          Container(
            margin: const EdgeInsets.only(bottom: 20),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB), // bg-gray-50
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFE5E7EB)), // border-gray-200
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '📋 Quiz Options',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF111827), // text-gray-900
                  ),
                ),
                const SizedBox(height: 12),
                
                // Options grid - mobile: column layout
                Column(
                  children: [
                    // Questions per page
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Questions per page',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: const Color(0xFF374151), // text-gray-700
                                ),
                              ),
                              const SizedBox(height: 4),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: const Color(0xFFD1D5DB)), // border-gray-300
                                ),
                                child: DropdownButtonHideUnderline(
                                  child: DropdownButton<int>(
                                    value: _questionsPerPage,
                                    isExpanded: true,
                                    items: [1, 2, 3, 4, 5].map((value) {
                                      return DropdownMenuItem<int>(
                                        value: value,
                                        child: Text('$value question${value > 1 ? 's' : ''}', 
                                                   style: const TextStyle(fontSize: 12)),
                                      );
                                    }).toList(),
                                    onChanged: (int? newValue) {
                                      setState(() {
                                        _questionsPerPage = newValue ?? 2;
                                      });
                                    },
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.black87,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        
                        const SizedBox(width: 12),
                        
                        // Difficulty
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Difficulty',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: const Color(0xFF374151), // text-gray-700
                                ),
                              ),
                              const SizedBox(height: 4),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: const Color(0xFFD1D5DB)), // border-gray-300
                                ),
                                child: DropdownButtonHideUnderline(
                                  child: DropdownButton<String>(
                                    value: _difficulty,
                                    isExpanded: true,
                                    items: const [
                                      DropdownMenuItem(value: 'mixed', child: Text('Mixed', style: TextStyle(fontSize: 12))),
                                      DropdownMenuItem(value: 'easy', child: Text('Easy', style: TextStyle(fontSize: 12))),
                                      DropdownMenuItem(value: 'medium', child: Text('Medium', style: TextStyle(fontSize: 12))),
                                      DropdownMenuItem(value: 'hard', child: Text('Hard', style: TextStyle(fontSize: 12))),
                                    ],
                                    onChanged: (String? newValue) {
                                      setState(() {
                                        _difficulty = newValue ?? 'mixed';
                                      });
                                    },
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.black87,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Include explanations checkbox
                    Row(
                      children: [
                        Transform.scale(
                          scale: 0.9,
                          child: Checkbox(
                            value: _includeExplanations,
                            onChanged: (bool? value) {
                              setState(() {
                                _includeExplanations = value ?? true;
                              });
                            },
                            activeColor: const Color(0xFF2563EB), // text-blue-600
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(3),
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Include explanations',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: const Color(0xFF374151), // text-gray-700
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Generate Quiz button (exact match to web app)
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _generateQuiz,
              icon: const Icon(Icons.auto_awesome),
              label: const Text('Generate Quiz ⚡'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669), // bg-green-600
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(6),
                ),
                elevation: 0,
                textStyle: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorSection() {
    return Container(
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red[200]!),
      ),
      child: Row(
        children: [
          Icon(Icons.error, color: Colors.red[600]),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Upload Error',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _uploadError!,
                  style: TextStyle(
                    color: Colors.red[700],
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: _clearError,
            child: const Text('Dismiss'),
          ),
        ],
      ),
    );
  }

  Widget _buildQuizErrorSection() {
    return Container(
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2), // bg-red-50
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFFECACA)), // border-red-200
      ),
      child: Row(
        children: [
          Icon(
            Icons.error_outline,
            color: const Color(0xFFDC2626), // text-red-600
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Quiz Generation Failed',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF991B1B), // text-red-800
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _quizError!,
                  style: TextStyle(
                    fontSize: 12,
                    color: const Color(0xFFB91C1C), // text-red-700
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () {
              setState(() {
                _quizError = null;
              });
            },
            icon: Icon(
              Icons.close,
              color: const Color(0xFFDC2626), // text-red-600
              size: 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStreamingQuizDisplay() {
    // Only show progress during generation, quiz will be shown in new screen
    if (!_isGeneratingQuiz) return const SizedBox.shrink();
    
    return Column(
      children: [
        const SizedBox(height: 16),
        
        // Progress Header (during generation only)
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE5E7EB)), // border-gray-200
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
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Generating Quiz...',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF111827), // text-gray-900
                    ),
                  ),
                  if (_totalPages > 0)
                    Text(
                      'Page $_currentPage/$_totalPages',
                      style: TextStyle(
                        fontSize: 14,
                        color: const Color(0xFF6B7280), // text-gray-500
                      ),
                    ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Progress Bar
              if (_totalPages > 0) ...[
                Container(
                  width: double.infinity,
                  height: 12,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE5E7EB), // bg-gray-200
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: _totalPages > 0 ? _currentPage / _totalPages : 0,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF2563EB), // bg-blue-600
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],
              
              // Status Message
              Text(
                _streamingProgress,
                style: TextStyle(
                  fontSize: 14,
                  color: const Color(0xFF6B7280), // text-gray-600
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 16),
              
              // Statistics
              if (_streamingQuestions.isNotEmpty)
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.check_circle,
                      color: const Color(0xFF10B981), // text-green-500
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${_streamingQuestions.length} questions generated',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF374151), // text-gray-700
                      ),
                    ),
                  ],
                ),
              
              const SizedBox(height: 16),
              
              // Info message
              Text(
                'Quiz will open automatically when complete',
                style: TextStyle(
                  fontSize: 12,
                  color: const Color(0xFF6B7280), // text-gray-500
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),

      ],
    );
  }

  Widget _buildStatCard(String value, String label, Color iconColor, Color bgColor) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: iconColor,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: iconColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionCard(Question question, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE5E7EB)), // border-gray-200
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFDBEAFE), // bg-blue-50
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Q${index + 1}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF1D4ED8), // text-blue-700
                  ),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: _getDifficultyColor(_difficulty).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  _difficulty.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: _getDifficultyColor(_difficulty),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            question.question,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF111827), // text-gray-900
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'New question generated from your PDF content',
            style: TextStyle(
              fontSize: 12,
              color: const Color(0xFF6B7280), // text-gray-500
            ),
          ),
        ],
      ),
    );
  }

  Color _getDifficultyColor(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return const Color(0xFF10B981); // green-500
      case 'medium':
        return const Color(0xFFF59E0B); // yellow-500
      case 'hard':
        return const Color(0xFFEF4444); // red-500
      default:
        return const Color(0xFF6B7280); // gray-500
    }
  }

  void _startNewQuiz() {
    setState(() {
      _hasGeneratedQuiz = false;
      _completedQuiz = null;
      _streamingQuestions = [];
      _quizStats = null;
      _streamingProgress = '';
      _currentPage = 0;
      _totalPages = 0;
      _quizError = null;
    });
  }

  void _navigateToQuizScreen() {
    if (_completedQuiz != null) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => StreamingQuizScreen(
            quiz: _completedQuiz!,
            quizStats: _quizStats,
          ),
        ),
      );
    }
  }

  void _viewQuiz() {
    if (_completedQuiz != null) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => QuizGenerationScreen(
            filename: _uploadedFileInfo!.filename,
            language: _selectedLanguage,
            questionsPerPage: _questionsPerPage,
            difficulty: _difficulty,
            includeExplanations: _includeExplanations,
          ),
        ),
      );
    }
  }

  Widget _buildFeaturesSection() {
    return Column(
      children: [
        const Text(
          'Why Choose QuizAi?',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'Experience the future of learning with our advanced AI-powered quiz generation platform',
          style: TextStyle(
            fontSize: 16,
            color: Colors.grey[600],
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        Column(
          children: [
            _buildFeatureCard(
              '🤖',
              'AI-Powered Intelligence',
              'Advanced AI analyzes your PDF content to generate relevant, contextual questions.',
              Colors.blue,
            ),
            const SizedBox(height: 16),
            _buildFeatureCard(
              '⚡',
              'Instant Results',
              'Upload your PDF and get a complete interactive quiz in seconds.',
              Colors.green,
            ),
            const SizedBox(height: 16),
            _buildFeatureCard(
              '📚',
              'Any Learning Material',
              'Works with textbooks, research papers, study guides, and any PDF document.',
              Colors.purple,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFeatureCard(String emoji, String title, String description, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[100]!),
      ),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(32),
            ),
            child: Center(
              child: Text(
                emoji,
                style: const TextStyle(fontSize: 32),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
} 