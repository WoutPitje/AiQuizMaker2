import 'package:flutter/material.dart';

class QuizSettingsCard extends StatelessWidget {
  final List<Map<String, dynamic>> supportedLanguages;
  final String selectedLanguage;
  final int questionsPerPage;
  final String difficulty;
  final bool includeExplanations;
  final Function(String) onLanguageChanged;
  final Function(int) onQuestionsPerPageChanged;
  final Function(String) onDifficultyChanged;
  final Function(bool) onIncludeExplanationsChanged;

  const QuizSettingsCard({
    super.key,
    required this.supportedLanguages,
    required this.selectedLanguage,
    required this.questionsPerPage,
    required this.difficulty,
    required this.includeExplanations,
    required this.onLanguageChanged,
    required this.onQuestionsPerPageChanged,
    required this.onDifficultyChanged,
    required this.onIncludeExplanationsChanged,
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
          const Text(
            'Quiz Settings',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 20),
          
          // Language Selection
          _buildSettingRow(
            'Language',
            DropdownButton<String>(
              value: selectedLanguage,
              onChanged: (value) => onLanguageChanged(value!),
              items: supportedLanguages.map((lang) {
                return DropdownMenuItem<String>(
                  value: lang['code'],
                  child: Text(lang['name']),
                );
              }).toList(),
            ),
          ),
          
          // Questions per Page
          _buildSettingRow(
            'Questions per Page',
            DropdownButton<int>(
              value: questionsPerPage,
              onChanged: (value) => onQuestionsPerPageChanged(value!),
              items: [1, 2, 3, 4, 5].map((count) {
                return DropdownMenuItem<int>(
                  value: count,
                  child: Text(count.toString()),
                );
              }).toList(),
            ),
          ),
          
          // Difficulty
          _buildSettingRow(
            'Difficulty',
            DropdownButton<String>(
              value: difficulty,
              onChanged: (value) => onDifficultyChanged(value!),
              items: const [
                DropdownMenuItem(value: 'easy', child: Text('Easy')),
                DropdownMenuItem(value: 'medium', child: Text('Medium')),
                DropdownMenuItem(value: 'hard', child: Text('Hard')),
                DropdownMenuItem(value: 'mixed', child: Text('Mixed')),
              ],
            ),
          ),
          
          // Include Explanations
          _buildSettingRow(
            'Include Explanations',
            Switch(
              value: includeExplanations,
              onChanged: onIncludeExplanationsChanged,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingRow(String label, Widget control) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.black87,
            ),
          ),
          control,
        ],
      ),
    );
  }
} 