import 'package:flutter/foundation.dart';
import '../models/quiz.dart';

class QuizStateComposable extends ChangeNotifier {
  int _currentQuestionIndex = 0;
  final Map<int, String> _userAnswers = {};
  bool _showResults = false;
  int _score = 0;
  double _percentage = 0.0;
  Quiz? _quiz;

  // Getters
  int get currentQuestionIndex => _currentQuestionIndex;
  Map<int, String> get userAnswers => _userAnswers;
} 