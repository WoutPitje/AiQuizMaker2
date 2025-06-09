import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/quiz.dart';
import '../services/api_service.dart';

class QuizGenerationComposable extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  bool _isGenerating = false;
  String _currentStatus = '';
  List<Question> _generatedQuestions = [];
  int _currentPage = 0;
  int _totalPages = 0;
  String? _error;
  Quiz? _completedQuiz;
  StreamSubscription? _streamSubscription;

  // Getters
  bool get isGenerating => _isGenerating;
  String get currentStatus => _currentStatus;
  List<Question> get generatedQuestions => _generatedQuestions;
  int get currentPage => _currentPage;
  int get totalPages => _totalPages;
  String? get error => _error;
  Quiz? get completedQuiz => _completedQuiz;

  Future<void> startQuizGeneration({
    required String filename,
    String language = 'en',
    int questionsPerPage = 2,
    String difficulty = 'mixed',
    bool includeExplanations = true,
  }) async {
    try {
      _reset();
      _isGenerating = true;
      _currentStatus = 'Starting quiz generation...';
      notifyListeners();

      final stream = await _apiService.generateQuizStream(
        filename,
        language: language,
        questionsPerPage: questionsPerPage,
        difficulty: difficulty,
        includeExplanations: includeExplanations,
      );

      _streamSubscription = stream.listen(
        _handleStreamEvent,
        onError: (error) {
          _error = 'Streaming error: ${error.toString()}';
          _isGenerating = false;
          notifyListeners();
        },
        onDone: () {
          if (_completedQuiz == null && _error == null) {
            _error = 'Quiz generation completed but no quiz received';
            _isGenerating = false;
            notifyListeners();
          }
        },
      );
    } catch (e) {
      _error = 'Failed to generate quiz: ${e.toString()}';
      _isGenerating = false;
      notifyListeners();
    }
  }

  void _handleStreamEvent(Map<String, dynamic> data) {
    final type = data['type'];
    final eventData = data['data'];

    switch (type) {
      case 'progress':
        _currentStatus = eventData['message'] ?? 'Processing...';
        break;
      case 'page':
        _currentPage = eventData['page'] ?? 0;
        _totalPages = eventData['totalPages'] ?? 0;
        _currentStatus = 'Processing page $_currentPage of $_totalPages...';
        break;
      case 'question':
        if (eventData != null) {
          final question = Question.fromJson(eventData);
          _generatedQuestions.add(question);
          _currentStatus = 'Generated ${_generatedQuestions.length} questions...';
        }
        break;
      case 'completed':
        if (eventData != null && eventData['quiz'] != null) {
          _completedQuiz = Quiz.fromJson(eventData['quiz']);
          _isGenerating = false;
          _currentStatus = 'Quiz generation completed successfully!';
        }
        break;
      case 'error':
        _error = eventData['error'] ?? 'An error occurred during quiz generation';
        _isGenerating = false;
        break;
    }
    notifyListeners();
  }

  void _reset() {
    _isGenerating = false;
    _currentStatus = '';
    _generatedQuestions.clear();
    _currentPage = 0;
    _totalPages = 0;
    _error = null;
    _completedQuiz = null;
    _streamSubscription?.cancel();
  }

  @override
  void dispose() {
    _streamSubscription?.cancel();
    super.dispose();
  }
} 