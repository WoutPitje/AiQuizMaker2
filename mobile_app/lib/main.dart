import 'package:flutter/material.dart';
import 'services/api_service.dart';
import 'models/file_upload.dart';
import 'utils/constants.dart';
import 'utils/error_handler.dart';

void main() {
  runApp(const QuizAiApp());
}

class QuizAiApp extends StatelessWidget {
  const QuizAiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConstants.appName,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const ApiTestScreen(),
    );
  }
}

class ApiTestScreen extends StatefulWidget {
  const ApiTestScreen({super.key});

  @override
  State<ApiTestScreen> createState() => _ApiTestScreenState();
}

class _ApiTestScreenState extends State<ApiTestScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  String _status = 'Ready to test API connection';
  ApiConfig? _config;
  String? _error;

  @override
  void initState() {
    super.initState();
    _testConnection();
  }

  Future<void> _testConnection() async {
    setState(() {
      _isLoading = true;
      _status = 'Testing API connection...';
      _error = null;
      _config = null;
    });

    try {
      print('🔄 Testing connection to: ${_apiService.baseUrl}');
      
      final config = await _apiService.getConfig();
      
      setState(() {
        _isLoading = false;
        _status = 'API connection successful! ✅';
        _config = config;
      });
      
      print('✅ Connection successful!');
    } catch (e) {
      final errorMessage = ErrorHandler.getErrorMessage(e);
      
      setState(() {
        _isLoading = false;
        _status = 'API connection failed ❌';
        _error = errorMessage;
      });
      
      print('❌ Connection failed: $errorMessage');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(AppConstants.appName),
      ),
      body: Padding(
        padding: const EdgeInsets.all(AppConstants.padding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(AppConstants.padding),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'API Connection Test',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text('Base URL: ${_apiService.baseUrl}'),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (_isLoading)
                          const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        if (!_isLoading)
                          Icon(
                            _config != null ? Icons.check_circle : Icons.error,
                            color: _config != null ? Colors.green : Colors.red,
                          ),
                        const SizedBox(width: 8),
                        Expanded(child: Text(_status)),
                      ],
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red.shade200),
                        ),
                        child: Text(
                          _error!,
                          style: TextStyle(color: Colors.red.shade700),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _testConnection,
              icon: const Icon(Icons.refresh),
              label: const Text('Test Connection Again'),
            ),
            const SizedBox(height: 24),
            if (_config != null) ...[
              const Text(
                'API Configuration',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(AppConstants.padding),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildConfigRow('Max PDF Size', '${_config!.config.maxPdfSizeMB} MB'),
                      _buildConfigRow('Max Pages', '${_config!.config.maxPagesPerPdf}'),
                      _buildConfigRow('Questions/Page', '${_config!.config.defaultQuestionsPerPage}'),
                      _buildConfigRow('Languages', '${_config!.config.supportedLanguages.length}'),
                      const SizedBox(height: 8),
                      const Text(
                        'Supported Languages:',
                        style: TextStyle(fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 8,
                        children: _config!.config.supportedLanguages
                            .take(5) // Show first 5 languages
                            .map((lang) => Chip(
                                  label: Text('${lang.code.toUpperCase()} - ${lang.name}'),
                                  visualDensity: VisualDensity.compact,
                                ))
                            .toList(),
                      ),
                      if (_config!.config.supportedLanguages.length > 5)
                        Text(
                          '... and ${_config!.config.supportedLanguages.length - 5} more',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 12,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildConfigRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Text(value),
        ],
      ),
    );
  }
}
