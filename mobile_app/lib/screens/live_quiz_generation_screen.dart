import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/quiz.dart';
import '../widgets/generation/generation_progress_card.dart';
import '../widgets/quiz/question_card.dart';
import '../widgets/quiz/score_card.dart';
import '../widgets/common/custom_card.dart';
import '../composables/quiz_interactions_composable.dart';
import '../utils/constants.dart';
import 'streaming_quiz_screen.dart';

class LiveQuizGenerationScreen extends StatefulWidget {
  final File pdfFile;
  final String fileName;
  final String language;
  final int questionsPerPage;
  final String difficulty;
  final bool includeExplanations;

  const LiveQuizGenerationScreen({
    super.key,
    required this.pdfFile,
    required this.fileName,
    this.language = 'en',
    this.questionsPerPage = 2,
    this.difficulty = 'mixed',
    this.includeExplanations = true,
  });

  @override
  State<LiveQuizGenerationScreen> createState() => _LiveQuizGenerationScreenState();
}

class _LiveQuizGenerationScreenState extends State<LiveQuizGenerationScreen>
    with TickerProviderStateMixin {
  
  // Generation state
  bool _isGenerating = true;
  String _currentStatus = 'Starting quiz generation...';
  double _progress = 0.0;
  int _totalPages = 0;
  int _processedPages = 0;
  int _totalQuestions = 0;
  String? _error;
  
  // Quiz data
  final List<Question> _questions = [];
  Quiz? _completedQuiz;
  
  // Composables
  late QuizInteractionsComposable _quizInteractions;
  
  // Animation controllers
  late AnimationController _progressAnimationController;
  late AnimationController _questionAnimationController;
  late Animation<double> _progressAnimation;
  
  // Scroll controller for questions
  final ScrollController _scrollController = ScrollController();

  // Score tracking computed properties
  int get totalAnswered => _quizInteractions.totalAnswered;
  int get totalCorrect => _quizInteractions.totalCorrect;
  double get scorePercentage => totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;

  Color get scoreColor {
    if (scorePercentage >= 80) return Colors.green[600]!;
    if (scorePercentage >= 60) return Colors.orange[600]!;
    return Colors.red[600]!;
  }

  @override
  void initState() {
    super.initState();
    _quizInteractions = QuizInteractionsComposable();
    _quizInteractions.addListener(() => setState(() {}));
    _setupAnimations();
    _startQuizGeneration();
  }

  @override
  void dispose() {
    _quizInteractions.dispose();
    _progressAnimationController.dispose();
    _questionAnimationController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _setupAnimations() {
    _progressAnimationController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    
    _questionAnimationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _progressAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _progressAnimationController,
      curve: Curves.easeInOut,
    ));
  }

  Future<void> _startQuizGeneration() async {
    try {
      final uri = Uri.parse('${AppConstants.apiUrl}generate-quiz-stream/${widget.fileName}');
      final request = http.Request('POST', uri);
      
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode({
        'questionsPerPage': widget.questionsPerPage,
        'difficulty': widget.difficulty,
        'includeExplanations': widget.includeExplanations,
        'language': widget.language,
      });

      print('🚀 Starting streaming quiz generation...');
      
      final streamedResponse = await request.send();
      
      if (streamedResponse.statusCode == 200 || streamedResponse.statusCode == 201) {
        await _handleStreamingResponse(streamedResponse);
      } else {
        throw Exception('Failed to generate quiz: ${streamedResponse.statusCode}');
      }
    } catch (e) {
      print('❌ Error during quiz generation: $e');
      _handleError('Failed to generate quiz: $e');
    }
  }

  Future<void> _handleStreamingResponse(http.StreamedResponse response) async {
    await for (String line in response.stream
        .transform(utf8.decoder)
        .transform(const LineSplitter())
        .where((line) => line.trim().isNotEmpty && line.startsWith('data:'))) {
      
      final data = line.substring(5).trim();
      if (data == '[DONE]') break;
      
      try {
        final eventData = jsonDecode(data);
        await _handleStreamEvent(eventData);
      } catch (e) {
        print('Error parsing stream data: $e');
      }
    }
  }

  Future<void> _handleStreamEvent(Map<String, dynamic> eventData) async {
    final type = eventData['type'];
    final data = eventData['data'];
    
    print('📡 SSE Event: $type - ${data?['message'] ?? ''}');
    
    setState(() {
      switch (type) {
        case 'start':
          _currentStatus = 'Starting quiz generation...';
          _progress = 0.1;
          break;
          
        case 'pdf-processed':
          _totalPages = data['totalPages'] ?? 0;
          _currentStatus = 'PDF processed successfully! Found $_totalPages pages';
          _progress = 0.2;
          break;
          
        case 'page-processing':
          final pageNumber = data['pageNumber'] ?? 0;
          _processedPages = pageNumber;
          _currentStatus = 'Processing page $pageNumber of $_totalPages...';
          _progress = 0.2 + (0.6 * (pageNumber / _totalPages));
          break;
          
        case 'question-generated':
          final question = Question.fromJson(data['question']);
          _questions.add(question);
          _totalQuestions = data['totalQuestions'] ?? _questions.length;
          _currentStatus = 'Generated question ${_questions.length}';
          
          // Animate new question appearance
          _questionAnimationController.forward().then((_) {
            _questionAnimationController.reset();
          });
          
          // Auto-scroll to show new question
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (_scrollController.hasClients) {
              _scrollController.animateTo(
                _scrollController.position.maxScrollExtent,
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeOut,
              );
            }
          });
          break;
          
        case 'generating-metadata':
          _currentStatus = 'Generating AI-powered title and description...';
          _progress = 0.9;
          break;
          
        case 'metadata-generated':
          _currentStatus = 'AI title and description generated successfully!';
          break;
          
        case 'finalizing':
          _currentStatus = 'Creating final quiz...';
          _progress = 0.95;
          break;
          
        case 'completed':
          _completedQuiz = Quiz.fromJson(data['quiz']);
          _currentStatus = 'Quiz generation completed successfully!';
          _progress = 1.0;
          _isGenerating = false;
          
          _progressAnimationController.forward();
          
          // Quiz completed, questions are now interactive
          break;
          
        case 'error':
          _handleError(data['message'] ?? 'Unknown error occurred');
          break;
      }
    });
  }

  void _handleError(String error) {
    setState(() {
      _isGenerating = false;
      _currentStatus = 'Error: $error';
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(error),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 5),
      ),
    );
  }

  void _navigateToStreamingQuiz() {
    if (_completedQuiz != null) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => StreamingQuizScreen(
            quiz: _completedQuiz!,
            quizStats: {
              'totalPages': _totalPages,
              'totalTime': 0, // You'd track this properly
            },
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Generating Quiz ⚡'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          controller: _scrollController,
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              // Progress Card
              GenerationProgressCard(
                isGenerating: _isGenerating,
                currentStatus: _currentStatus,
                currentPage: _processedPages,
                totalPages: _totalPages,
                generatedQuestions: _questions.length,
                error: _error,
                isCompleted: _completedQuiz != null,
                totalQuestions: _completedQuiz?.questions.length,
                onRetry: () => Navigator.of(context).pop(),
                onStartQuiz: _navigateToStreamingQuiz,
                onGenerateAnother: () => Navigator.of(context).pop(),
              ),
              
              // Info Card about live generation
              if (_isGenerating) ...[
                const SizedBox(height: 16),
                CustomCard(
                  backgroundColor: Colors.blue[50],
                  border: Border.all(color: Colors.blue[200]!),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Icon(Icons.info, color: Colors.blue[600], size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Live Quiz Generation',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.blue[700],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Questions will appear below as they\'re generated. You can answer them while more are being created!',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.blue[700],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              
              // Score Card (if user has answered questions)
              if (_quizInteractions.totalAnswered > 0) ...[
                const SizedBox(height: 16),
                ScoreCard(
                  correctAnswers: _quizInteractions.totalCorrect,
                  totalAnswered: _quizInteractions.totalAnswered,
                  totalQuestions: _questions.length,
                ),
              ],
              
              // Live Questions Display
              if (_questions.isNotEmpty) ...[
                const SizedBox(height: 20),
                CustomCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Live Generated Questions (${_questions.length})',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 16),
                      ..._questions.asMap().entries.map((entry) {
                        final index = entry.key;
                        final question = entry.value;
                        final questionId = 'question_$index';
                        
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: QuestionCard(
                            question: question,
                            questionNumber: index + 1,
                            selectedAnswer: _quizInteractions.selectedAnswers[questionId],
                            showCorrectAnswer: _quizInteractions.showAnswers[questionId] ?? false,
                            onAnswerSelected: (answer) {
                              // Find the option index for the selected answer
                              final optionIndex = question.options.indexOf(answer);
                              final optionLetter = String.fromCharCode(65 + optionIndex); // Convert to A, B, C, D
                              final isCorrect = question.isCorrectAnswer(optionLetter);
                              
                              _quizInteractions.selectAnswer(questionId, answer, isCorrect);
                              _quizInteractions.toggleShowAnswers(questionId);
                            },
                          ),
                        );
                      }).toList(),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
} 