class Quiz {
  final String id;
  final String title;
  final String? description;
  final List<Question> questions;
  final Map<String, dynamic> metadata;
  final String? magicLink;
  final String? language;
  final DateTime? createdAt;
  final String? sourceFile;

  Quiz({
    required this.id,
    required this.title,
    this.description,
    required this.questions,
    required this.metadata,
    this.magicLink,
    this.language,
    this.createdAt,
    this.sourceFile,
  });

  factory Quiz.fromJson(Map<String, dynamic> json) {
    return Quiz(
      id: json['id'] ?? '',
      title: json['title'] ?? 'Quiz',
      description: json['description'],
      questions: (json['questions'] as List? ?? [])
          .map((q) => Question.fromJson(q))
          .toList(),
      metadata: json['metadata'] ?? {},
      magicLink: json['magicLink'],
      language: json['language'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      sourceFile: json['sourceFile'],
    );
  }

  int get totalQuestions => questions.length;
  
  int calculateScore(Map<int, String> answers) {
    int correct = 0;
    for (int i = 0; i < questions.length; i++) {
      final userAnswer = answers[i];
      if (userAnswer != null) {
        final question = questions[i];
        // Find the index of the user's answer in the options
        final userAnswerIndex = question.options.indexOf(userAnswer);
        if (userAnswerIndex != -1) {
          // Convert index to letter (0=A, 1=B, 2=C, 3=D)
          final userAnswerLetter = String.fromCharCode(65 + userAnswerIndex);
          if (question.isCorrectAnswer(userAnswerLetter)) {
            correct++;
          }
        }
      }
    }
    return correct;
  }

}

class Question {
  final String id;
  final String question;
  final List<String> options;
  final String correctAnswer; // Changed to String to match web app
  final String? explanation;
  final String difficulty;
  final int? pageNumber;

  Question({
    required this.id,
    required this.question,
    required this.options,
    required this.correctAnswer,
    this.explanation,
    this.difficulty = 'medium',
    this.pageNumber,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    // Handle options as either Map (from API) or List (for compatibility)
    List<String> optionsList = [];
    final optionsData = json['options'];
    
    if (optionsData is Map) {
      // API format: {"A": "text", "B": "text", "C": "text", "D": "text"}
      optionsList = [
        optionsData['A']?.toString() ?? '',
        optionsData['B']?.toString() ?? '',
        optionsData['C']?.toString() ?? '',
        optionsData['D']?.toString() ?? ''
      ];
    } else if (optionsData is List) {
      // List format for compatibility
      optionsList = List<String>.from(optionsData);
    }
    
    return Question(
      id: json['id']?.toString() ?? '',
      question: json['question'] ?? '',
      options: optionsList,
      correctAnswer: json['correctAnswer']?.toString() ?? 'A',
      explanation: json['explanation'],
      difficulty: json['difficulty'] ?? 'medium',
      pageNumber: json['pageNumber'],
    );
  }

  bool isCorrectAnswer(String answer) {
    return answer.toLowerCase().trim() == correctAnswer.toLowerCase().trim();
  }
} 