import 'package:flutter/material.dart';
import '../common/custom_card.dart';
import '../common/loading_indicator.dart';

class GenerationProgressCard extends StatelessWidget {
  final bool isGenerating;
  final String currentStatus;
  final int currentPage;
  final int totalPages;
  final int generatedQuestions;
  final String? error;
  final bool isCompleted;
  final int? totalQuestions;
  final VoidCallback? onRetry;
  final VoidCallback? onStartQuiz;
  final VoidCallback? onGenerateAnother;

  const GenerationProgressCard({
    super.key,
    required this.isGenerating,
    required this.currentStatus,
    this.currentPage = 0,
    this.totalPages = 0,
    this.generatedQuestions = 0,
    this.error,
    this.isCompleted = false,
    this.totalQuestions,
    this.onRetry,
    this.onStartQuiz,
    this.onGenerateAnother,
  });

  @override
  Widget build(BuildContext context) {
    return CustomCard(
      child: Column(
        children: [
          if (isGenerating) ..._buildGeneratingState(),
          if (error != null) ..._buildErrorState(),
          if (isCompleted) ..._buildCompletedState(),
        ],
      ),
    );
  }

  List<Widget> _buildGeneratingState() {
    return [
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
      if (totalPages > 0)
        Text(
          'Page $currentPage/$totalPages',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
          ),
        ),
      const SizedBox(height: 16),
      if (totalPages > 0)
        LinearProgressIndicator(
          value: totalPages > 0 ? currentPage / totalPages : 0,
          backgroundColor: Colors.grey[300],
          valueColor: AlwaysStoppedAnimation<Color>(Colors.blue[600]!),
        ),
      const SizedBox(height: 16),
      Text(
        currentStatus,
        style: TextStyle(
          fontSize: 14,
          color: Colors.grey[600],
        ),
        textAlign: TextAlign.center,
      ),
      if (generatedQuestions > 0) ...[
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle, color: Colors.green[500], size: 20),
            const SizedBox(width: 8),
            Text(
              '$generatedQuestions questions generated',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[700],
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ],
    ];
  }

  List<Widget> _buildErrorState() {
    return [
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
        error!,
        style: TextStyle(
          fontSize: 14,
          color: Colors.red[600],
        ),
        textAlign: TextAlign.center,
      ),
      const SizedBox(height: 20),
      if (onRetry != null)
        ElevatedButton(
          onPressed: onRetry,
          child: const Text('Try Again'),
        ),
    ];
  }

  List<Widget> _buildCompletedState() {
    return [
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
      if (totalQuestions != null)
        Text(
          'Generated $totalQuestions questions',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
          ),
        ),
      const SizedBox(height: 20),
      Row(
        children: [
          if (onGenerateAnother != null)
            Expanded(
              child: OutlinedButton(
                onPressed: onGenerateAnother,
                child: const Text('Generate Another'),
              ),
            ),
          if (onGenerateAnother != null && onStartQuiz != null)
            const SizedBox(width: 12),
          if (onStartQuiz != null)
            Expanded(
              child: ElevatedButton(
                onPressed: onStartQuiz,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue[600],
                  foregroundColor: Colors.white,
                ),
                child: const Text('Start Quiz'),
              ),
            ),
        ],
      ),
    ];
  }
} 