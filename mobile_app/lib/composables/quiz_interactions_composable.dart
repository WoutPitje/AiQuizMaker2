import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class QuizInteractionsComposable extends ChangeNotifier {
  final Map<String, bool> _showAnswers = {};
  final Map<String, String> _selectedAnswers = {};
  final Map<String, bool> _answeredQuestions = {};
  final Map<String, bool> _correctAnswers = {};
  bool _copyingLink = false;

  // Getters
  Map<String, bool> get showAnswers => _showAnswers;
  Map<String, String> get selectedAnswers => _selectedAnswers;
  Map<String, bool> get answeredQuestions => _answeredQuestions;
  Map<String, bool> get correctAnswers => _correctAnswers;
  bool get copyingLink => _copyingLink;
  
  // Score tracking computed properties
  int get totalAnswered => _answeredQuestions.values.where((answered) => answered).length;
  int get totalCorrect => _correctAnswers.values.where((correct) => correct).length;
  double get scorePercentage => totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;

  Color get scoreColor {
    if (scorePercentage >= 80) return const Color(0xFF4CAF50); // Green
    if (scorePercentage >= 60) return const Color(0xFFFF9800); // Orange
    return const Color(0xFFF44336); // Red
  }

  void selectAnswer(String questionId, String answer, bool isCorrect) {
    _selectedAnswers[questionId] = answer;
    _answeredQuestions[questionId] = true;
    _correctAnswers[questionId] = isCorrect;
    notifyListeners();
  }

  void toggleShowAnswers(String questionId) {
    _showAnswers[questionId] = !(_showAnswers[questionId] ?? false);
    notifyListeners();
  }

  Future<void> copyShareUrl(String url) async {
    try {
      _copyingLink = true;
      notifyListeners();
      
      await Clipboard.setData(ClipboardData(text: url));
      
      // Keep the "Copied!" state for 2 seconds
      await Future.delayed(const Duration(seconds: 2));
      
      _copyingLink = false;
      notifyListeners();
    } catch (e) {
      _copyingLink = false;
      notifyListeners();
      rethrow;
    }
  }

  void reset() {
    _showAnswers.clear();
    _selectedAnswers.clear();
    _answeredQuestions.clear();
    _correctAnswers.clear();
    _copyingLink = false;
    notifyListeners();
  }
} 