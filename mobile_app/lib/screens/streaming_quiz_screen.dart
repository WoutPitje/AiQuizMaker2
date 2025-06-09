import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/quiz.dart';
import '../widgets/quiz/question_card.dart';
import '../widgets/quiz/score_card.dart';
import '../widgets/common/custom_card.dart';
import '../composables/quiz_interactions_composable.dart';

class StreamingQuizScreen extends StatefulWidget {
  final Quiz quiz;
  final Map<String, dynamic>? quizStats;

  const StreamingQuizScreen({
    super.key,
    required this.quiz,
    this.quizStats,
  });

  @override
  State<StreamingQuizScreen> createState() => _StreamingQuizScreenState();
}

class _StreamingQuizScreenState extends State<StreamingQuizScreen> {
  late QuizInteractionsComposable _quizInteractions;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _quizInteractions = QuizInteractionsComposable();
    _quizInteractions.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _quizInteractions.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToTop() {
    _scrollController.animateTo(
      0,
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(widget.quiz.title),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: _scrollToTop,
            icon: const Icon(Icons.keyboard_arrow_up),
            tooltip: 'Back to Top',
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          controller: _scrollController,
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              // Quiz Ready Section
              _buildQuizReadySection(),
              
              const SizedBox(height: 16),
              
              // Score Card
              if (_quizInteractions.totalAnswered > 0)
                ScoreCard(
                  correctAnswers: _quizInteractions.totalCorrect,
                  totalAnswered: _quizInteractions.totalAnswered,
                  totalQuestions: widget.quiz.questions.length,
                ),
              
              const SizedBox(height: 16),
              
              // Questions List
              _buildQuestionsList(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuizReadySection() {
    return CustomCard(
      child: Column(
        children: [
          // Success Icon and Title
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.check_circle, color: Colors.green[500], size: 32),
              const SizedBox(width: 12),
              const Text(
                'Quiz Ready to Share!',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // Share Section
          if (widget.quiz.magicLink != null) _buildShareSection(),
          
          const SizedBox(height: 20),
          
          // Generation Stats
          if (widget.quizStats != null) _buildGenerationStats(),
          
          const SizedBox(height: 20),
          
          // Action Buttons
          _buildActionButtons(),
        ],
      ),
    );
  }

  Widget _buildShareSection() {
    final shareUrl = 'https://quizai.nl/quiz/magic/${widget.quiz.magicLink}';
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Share this quiz:',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: Text(
                    shareUrl,
                    style: const TextStyle(
                      fontSize: 12,
                      fontFamily: 'monospace',
                      color: Colors.black87,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton.icon(
                onPressed: _quizInteractions.copyingLink ? null : () => _quizInteractions.copyShareUrl(shareUrl),
                icon: Icon(
                  _quizInteractions.copyingLink ? Icons.check : Icons.copy,
                  size: 16,
                ),
                label: Text(_quizInteractions.copyingLink ? 'Copied!' : 'Copy'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey[100],
                  foregroundColor: Colors.black87,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGenerationStats() {
    final stats = widget.quizStats!;
    
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _buildStatItem('Questions', '${widget.quiz.questions.length}'),
        _buildStatItem('Pages', '${stats['totalPages'] ?? 'N/A'}'),
        _buildStatItem('Time', '${stats['totalTime'] ?? 'N/A'}s'),
      ],
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.blue[600],
          ),
        ),
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

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Back to Home'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton(
            onPressed: () {
              // Start quiz or scroll to questions
              _scrollController.animateTo(
                _scrollController.position.maxScrollExtent,
                duration: const Duration(milliseconds: 500),
                curve: Curves.easeInOut,
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue[600],
              foregroundColor: Colors.white,
            ),
            child: const Text('Start Quiz'),
          ),
        ),
      ],
    );
  }

  Widget _buildQuestionsList() {
    return Column(
      children: widget.quiz.questions.asMap().entries.map((entry) {
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
    );
  }
} 