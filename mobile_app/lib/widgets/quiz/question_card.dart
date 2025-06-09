import 'package:flutter/material.dart';
import '../../models/quiz.dart';

class QuestionCard extends StatelessWidget {
  final Question question;
  final String? selectedAnswer;
  final Function(String) onAnswerSelected;
  final int questionNumber;
  final bool showCorrectAnswer;

  const QuestionCard({
    super.key,
    required this.question,
    required this.onAnswerSelected,
    required this.questionNumber,
    this.selectedAnswer,
    this.showCorrectAnswer = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$questionNumber. ${question.question}',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 24),
          ...question.options.asMap().entries.map((entry) {
            final index = entry.key;
            final option = entry.value;
            final optionLetter = String.fromCharCode(65 + index);
            final isSelected = selectedAnswer == option;
            final isCorrect = showCorrectAnswer && optionLetter == question.correctAnswer;
            final isWrong = showCorrectAnswer && isSelected && optionLetter != question.correctAnswer;

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              child: InkWell(
                onTap: showCorrectAnswer ? null : () => onAnswerSelected(option),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _getOptionColor(isSelected, isCorrect, isWrong),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: _getOptionBorderColor(isSelected, isCorrect, isWrong),
                      width: isSelected || isCorrect ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: _getOptionIconColor(isSelected, isCorrect, isWrong),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Center(
                          child: Text(
                            optionLetter,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: _getOptionIconTextColor(isSelected, isCorrect, isWrong),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Text(
                          option,
                          style: TextStyle(
                            fontSize: 16,
                            color: _getOptionTextColor(isSelected, isCorrect, isWrong),
                            fontWeight: isSelected || isCorrect ? FontWeight.w500 : FontWeight.normal,
                          ),
                        ),
                      ),
                      if (isCorrect)
                        Icon(Icons.check_circle, color: Colors.green[600], size: 20),
                      if (isWrong)
                        Icon(Icons.cancel, color: Colors.red[600], size: 20),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
          if (showCorrectAnswer && question.explanation != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue[200]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.lightbulb, color: Colors.blue[600], size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Explanation',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.blue[700],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    question.explanation!,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.blue[700],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Color _getOptionColor(bool isSelected, bool isCorrect, bool isWrong) {
    if (isCorrect) return Colors.green[50]!;
    if (isWrong) return Colors.red[50]!;
    if (isSelected) return Colors.blue[50]!;
    return Colors.grey[50]!;
  }

  Color _getOptionBorderColor(bool isSelected, bool isCorrect, bool isWrong) {
    if (isCorrect) return Colors.green[300]!;
    if (isWrong) return Colors.red[300]!;
    if (isSelected) return Colors.blue[300]!;
    return Colors.grey[200]!;
  }

  Color _getOptionIconColor(bool isSelected, bool isCorrect, bool isWrong) {
    if (isCorrect) return Colors.green[600]!;
    if (isWrong) return Colors.red[600]!;
    if (isSelected) return Colors.blue[600]!;
    return Colors.grey[300]!;
  }

  Color _getOptionIconTextColor(bool isSelected, bool isCorrect, bool isWrong) {
    if (isCorrect || isWrong || isSelected) return Colors.white;
    return Colors.grey[600]!;
  }

  Color _getOptionTextColor(bool isSelected, bool isCorrect, bool isWrong) {
    if (isCorrect) return Colors.green[700]!;
    if (isWrong) return Colors.red[700]!;
    if (isSelected) return Colors.blue[700]!;
    return Colors.black87;
  }
} 