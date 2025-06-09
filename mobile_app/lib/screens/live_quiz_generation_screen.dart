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

  const LiveQuizGenerationScreen({
    super.key,
    required this.pdfFile,
    required this.fileName,
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
        'questionsPerPage': 2,
        'difficulty': 'mixed',
        'includeExplanations': true,
        'language': 'en',
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Generating Quiz'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 1,
        leading: _isGenerating 
          ? null 
          : IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => Navigator.pop(context),
            ),
      ),
      body: Column(
        children: [
          // Progress Section
          _buildProgressSection(),
          
          // Questions Section
          Expanded(
            child: _buildQuestionsSection(),
          ),
          
          // Score card when questions are available
          if (_questions.isNotEmpty) _buildScoreCard(),
        ],
      ),
    );
  }

  Widget _buildProgressSection() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.blue[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  _isGenerating ? Icons.auto_awesome : Icons.check_circle,
                  color: Colors.blue[600],
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.fileName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _currentStatus,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Progress Bar
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Progress',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Colors.grey[700],
                    ),
                  ),
                  Text(
                    '${(_progress * 100).toInt()}%',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.blue[600],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: _progress,
                  backgroundColor: Colors.grey[200],
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.blue[600]!),
                  minHeight: 8,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Stats Row
          Row(
            children: [
              _buildStatChip('Questions', _totalQuestions.toString(), Icons.quiz),
              const SizedBox(width: 12),
              if (_totalPages > 0) _buildStatChip('Pages', '$_processedPages/$_totalPages', Icons.description),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatChip(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: Colors.grey[600],
          ),
          const SizedBox(width: 6),
          Text(
            '$label: $value',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Colors.grey[700],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionsSection() {
    if (_questions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.auto_awesome,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              _isGenerating 
                ? 'Questions will appear here as they\'re generated...'
                : 'No questions generated yet',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              'Generated Questions (${_questions.length})',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              itemCount: _questions.length,
              itemBuilder: (context, index) {
                return AnimatedBuilder(
                  animation: _questionAnimationController,
                  builder: (context, child) {
                    // Animate only the newest question
                    final isLatest = index == _questions.length - 1;
                    final scale = isLatest ? 
                      0.8 + (0.2 * _questionAnimationController.value) : 1.0;
                    final opacity = isLatest ?
                      0.3 + (0.7 * _questionAnimationController.value) : 1.0;
                    
                    return Transform.scale(
                      scale: scale,
                      child: Opacity(
                        opacity: opacity,
                        child: _buildQuestionCard(_questions[index], index),
                      ),
                    );
                  },
                );
              },
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
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Question Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.blue[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'Q${index + 1}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.blue[600],
                  ),
                ),
              ),
              const Spacer(),
              if (question.pageNumber != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'Page ${question.pageNumber}',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[600],
                    ),
                  ),
                ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Question Text
          Text(
            question.question,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              height: 1.4,
            ),
          ),
          
          const SizedBox(height: 12),
          
          // Interactive Options (like web app)
          ...question.options.asMap().entries.map((entry) {
            final optionIndex = entry.key;
            final option = entry.value;
            final optionLetter = String.fromCharCode(65 + optionIndex);
            final isSelected = _quizInteractions.selectedAnswers[question.id] == optionLetter;
            final isCorrect = optionLetter == question.correctAnswer;
            final isShowingAnswer = _quizInteractions.showAnswers[question.id] ?? false;
            
            Color backgroundColor;
            Color borderColor;
            
            if (isShowingAnswer && isCorrect) {
              backgroundColor = Colors.green[100]!;
              borderColor = Colors.green[300]!;
            } else if (isShowingAnswer && isSelected && !isCorrect) {
              backgroundColor = Colors.red[100]!;
              borderColor = Colors.red[300]!;
            } else if (isSelected) {
              backgroundColor = Colors.blue[100]!;
              borderColor = Colors.blue[300]!;
            } else {
              backgroundColor = Colors.grey[50]!;
              borderColor = Colors.grey[200]!;
            }
            
            return GestureDetector(
              onTap: () => _quizInteractions.selectAnswer(question.id, optionLetter, isCorrect),
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: backgroundColor,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: borderColor, width: 2),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: isSelected || (isShowingAnswer && isCorrect) 
                          ? (isCorrect ? Colors.green[200] : Colors.blue[200])
                          : Colors.grey[100],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(
                          optionLetter,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isSelected || (isShowingAnswer && isCorrect)
                              ? Colors.white
                              : Colors.grey[700],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        option,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                          color: isShowingAnswer && isCorrect
                            ? Colors.green[800]
                            : (isShowingAnswer && isSelected && !isCorrect)
                              ? Colors.red[800]
                              : Colors.grey[800],
                        ),
                      ),
                    ),
                    if (isShowingAnswer && isCorrect)
                      Icon(
                        Icons.check_circle,
                        color: Colors.green[600],
                        size: 20,
                      ),
                  ],
                ),
              ),
            );
          }),
          
          const SizedBox(height: 16),
          
          // Show/Hide Answer and Selected Answer Display
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton(
                onPressed: () => _quizInteractions.toggleShowAnswers(question.id),
                child: Text(
                  (_quizInteractions.showAnswers[question.id] ?? false) ? 'Hide Answer' : 'Show Answer',
                  style: TextStyle(
                    color: Colors.blue[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              if (_quizInteractions.selectedAnswers[question.id] != null)
                Text(
                  'Your answer: ${_quizInteractions.selectedAnswers[question.id]}',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
            ],
          ),
          
          // Answer Explanation
          if ((_quizInteractions.showAnswers[question.id] ?? false) && question.explanation != null)
            Container(
              margin: const EdgeInsets.only(top: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.green[200]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.lightbulb,
                        color: Colors.green[600],
                        size: 16,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Explanation',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: Colors.green[800],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    question.explanation!,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.green[700],
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildScoreCard() {
    if (_questions.isEmpty) return const SizedBox();
    
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildScoreItem('Answered', '$totalAnswered/${_questions.length}', Colors.blue),
          _buildScoreItem('Correct', '$totalCorrect', Colors.green),
          _buildScoreItem('Score', '${scorePercentage.toInt()}%', scoreColor),
        ],
      ),
    );
  }

  Widget _buildScoreItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }
} 