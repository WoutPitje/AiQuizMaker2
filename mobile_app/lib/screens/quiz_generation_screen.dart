import 'package:flutter/material.dart';
import '../models/quiz.dart';
import '../widgets/common/loading_indicator.dart';
import '../widgets/common/custom_card.dart';
import '../widgets/quiz/question_card.dart';
import '../composables/quiz_generation_composable.dart';
import 'quiz_screen.dart';

class QuizGenerationScreen extends StatefulWidget {
  final String filename;
  final String language;
  final int questionsPerPage;
  final String difficulty;
  final bool includeExplanations;

  const QuizGenerationScreen({
    super.key,
    required this.filename,
    this.language = 'en',
    this.questionsPerPage = 2,
    this.difficulty = 'mixed',
    this.includeExplanations = true,
  });

  @override
  State<QuizGenerationScreen> createState() => _QuizGenerationScreenState();
}

class _QuizGenerationScreenState extends State<QuizGenerationScreen> {
  late QuizGenerationComposable _quizGeneration;

  @override
  void initState() {
    super.initState();
    _quizGeneration = QuizGenerationComposable();
    _quizGeneration.addListener(_onQuizGenerationChanged);
    _startQuizGeneration();
  }

  @override
  void dispose() {
    _quizGeneration.removeListener(_onQuizGenerationChanged);
    _quizGeneration.dispose();
    super.dispose();
  }

  void _onQuizGenerationChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _startQuizGeneration() async {
    await _quizGeneration.startQuizGeneration(
      filename: widget.filename,
      language: widget.language,
      questionsPerPage: widget.questionsPerPage,
      difficulty: widget.difficulty,
      includeExplanations: widget.includeExplanations,
    );
  }

  void _startQuiz() {
    if (_quizGeneration.completedQuiz != null) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => QuizScreen(quiz: _quizGeneration.completedQuiz!),
        ),
      );
    }
  }

  void _goBack() {
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Generating Quiz'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
        leading: _quizGeneration.isGenerating ? null : IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _goBack,
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              _buildProgressCard(),
              if (_quizGeneration.generatedQuestions.isNotEmpty) ...[
                const SizedBox(height: 20),
                _buildQuestionPreview(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProgressCard() {
    return CustomCard(
      child: Column(
        children: [
          if (_quizGeneration.isGenerating) ...[
            const LoadingIndicator(),
            const SizedBox(height: 20),
            const Text(
              'Generating Quiz...',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            if (_quizGeneration.totalPages > 0)
              Text(
                'Page ${_quizGeneration.currentPage}/${_quizGeneration.totalPages}',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
            const SizedBox(height: 16),
            if (_quizGeneration.totalPages > 0)
              LinearProgressIndicator(
                value: _quizGeneration.totalPages > 0 ? _quizGeneration.currentPage / _quizGeneration.totalPages : 0,
                backgroundColor: Colors.grey[300],
                valueColor: AlwaysStoppedAnimation<Color>(Colors.blue[600]!),
              ),
            const SizedBox(height: 16),
            Text(
              _quizGeneration.currentStatus,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            if (_quizGeneration.generatedQuestions.isNotEmpty) ...[
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.check_circle, color: Colors.green[500], size: 20),
                  const SizedBox(width: 8),
                  Text(
                    '${_quizGeneration.generatedQuestions.length} questions generated',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[700],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ] else if (_quizGeneration.error != null) ...[
            Icon(Icons.error, color: Colors.red[500], size: 48),
            const SizedBox(height: 16),
            const Text(
              'Generation Failed',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _quizGeneration.error!,
              style: TextStyle(
                fontSize: 14,
                color: Colors.red[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _goBack,
              child: const Text('Try Again'),
            ),
          ] else if (_quizGeneration.completedQuiz != null) ...[
            Icon(Icons.check_circle, color: Colors.green[500], size: 48),
            const SizedBox(height: 16),
            const Text(
              '🎉 Quiz Ready!',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Generated ${_quizGeneration.completedQuiz!.totalQuestions} questions',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _goBack,
                    child: const Text('Generate Another'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _startQuiz,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue[600],
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Start Quiz'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildQuestionPreview() {
    return Expanded(
      child: CustomCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Preview Questions',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.builder(
                itemCount: _quizGeneration.generatedQuestions.length,
                itemBuilder: (context, index) {
                  final question = _quizGeneration.generatedQuestions[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: QuestionCard(
                      question: question,
                      questionNumber: index + 1,
                      onAnswerSelected: (_) {}, // Read-only preview
                      showCorrectAnswer: true,
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
} 