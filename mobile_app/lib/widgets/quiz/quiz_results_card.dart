import 'package:flutter/material.dart';
import '../common/custom_card.dart';

class QuizResultsCard extends StatelessWidget {
  final int score;
  final int totalQuestions;
  final double percentage;
  final VoidCallback onRestart;
  final VoidCallback onGoHome;
  final String quizTitle;

  const QuizResultsCard({
    super.key,
    required this.score,
    required this.totalQuestions,
    required this.percentage,
    required this.onRestart,
    required this.onGoHome,
    required this.quizTitle,
  });

  Color get scoreColor {
    if (percentage >= 80) return Colors.green[600]!;
    if (percentage >= 60) return Colors.orange[600]!;
    return Colors.red[600]!;
  }

  String get scoreMessage {
    if (percentage >= 80) return 'Excellent! 🎉';
    if (percentage >= 60) return 'Good job! 👍';
    return 'Keep practicing! 💪';
  }

  @override
  Widget build(BuildContext context) {
    return CustomCard(
      child: Column(
        children: [
          Icon(
            percentage >= 80 ? Icons.emoji_events : 
            percentage >= 60 ? Icons.thumb_up : Icons.school,
            size: 64,
            color: scoreColor,
          ),
          const SizedBox(height: 20),
          Text(
            scoreMessage,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            quizTitle,
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          
          // Score Display
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: scoreColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildScoreStat('Score', '$score/$totalQuestions'),
                _buildScoreStat('Percentage', '${percentage.toStringAsFixed(1)}%'),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Action Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onGoHome,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text('Home'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: onRestart,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: scoreColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text('Try Again'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildScoreStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: scoreColor,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }
} 