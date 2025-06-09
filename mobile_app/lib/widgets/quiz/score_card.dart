import 'package:flutter/material.dart';

class ScoreCard extends StatelessWidget {
  final int correctAnswers;
  final int totalAnswered;
  final int totalQuestions;

  const ScoreCard({
    super.key,
    required this.correctAnswers,
    required this.totalAnswered,
    required this.totalQuestions,
  });

  double get percentage => totalAnswered > 0 ? (correctAnswers / totalAnswered) * 100 : 0;

  Color get scoreColor {
    if (percentage >= 80) return Colors.green[600]!;
    if (percentage >= 60) return Colors.orange[600]!;
    return Colors.red[600]!;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          Text(
            'Your Score',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem(
                'Correct',
                '$correctAnswers',
                Colors.green[600]!,
              ),
              _buildStatItem(
                'Answered',
                '$totalAnswered',
                Colors.blue[600]!,
              ),
              _buildStatItem(
                'Total',
                '$totalQuestions',
                Colors.grey[600]!,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: scoreColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '${percentage.toStringAsFixed(1)}%',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: scoreColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
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
} 