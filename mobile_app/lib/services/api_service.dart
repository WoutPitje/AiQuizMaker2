import 'dart:io';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';
import '../models/quiz.dart';
import '../models/file_upload.dart';
import '../utils/constants.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late final Dio _dio;

  void initialize() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConstants.apiUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 60),
    ));

    _dio.interceptors.add(LogInterceptor(
      requestBody: false, // Don't log large file uploads
      responseBody: true,
      logPrint: (obj) => print('🌐 API: $obj'),
    ));
  }

  // Upload PDF file - matches web app implementation
  Future<FileUploadResponse> uploadFile(
    File file, {
    Function(int sent, int total)? onSendProgress,
  }) async {
    try {
      print('📤 Uploading file: ${file.path}');
      
      // Validate file type (additional client-side validation)
      if (!file.path.toLowerCase().endsWith('.pdf')) {
        throw Exception('Only PDF files are allowed. Please select a valid PDF file.');
      }

      // Validate file size (100MB limit like web app)
      final fileSize = await file.length();
      if (fileSize > AppConstants.maxFileSizeBytes) {
        final fileSizeMB = (fileSize / (1024 * 1024)).round();
        throw Exception('PDF file is too large (${fileSizeMB}MB). Maximum size is ${AppConstants.maxFileSizeMB}MB.');
      }

      final fileName = file.path.split('/').last;
      print('📄 File name: $fileName');
      print('📏 File size: ${(fileSize / (1024 * 1024)).toStringAsFixed(2)}MB');

      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
          contentType: MediaType('application', 'pdf'), // Explicitly set MIME type
        ),
      });

      print('📤 Sending upload request...');
      
      final response = await _dio.post(
        '/upload',
        data: formData,
        onSendProgress: onSendProgress,
        options: Options(
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        ),
      );

      print('📥 Upload response status: ${response.statusCode}');
      print('📥 Upload response: ${response.data}');

      if (response.statusCode == 201 || response.statusCode == 200) {
        return FileUploadResponse.fromJson(response.data);
      } else {
        throw Exception('Upload failed with status: ${response.statusCode}');
      }
    } catch (e) {
      print('🚨 Upload failed: $e');
      throw _handleError(e);
    }
  }

  // Generate quiz from uploaded file
  Future<Quiz> generateQuiz(
    String filename, {
    String language = 'en',
    String difficulty = 'medium',
    int questionsPerPage = 5,
  }) async {
    try {
      final response = await _dio.post('/generate-quiz', data: {
        'filename': filename,
        'language': language,
        'difficulty': difficulty,
        'questionsPerPage': questionsPerPage,
      });

      return Quiz.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Get API configuration
  Future<Map<String, dynamic>> getConfig() async {
    try {
      final response = await _dio.get('/config');
      return response.data;
    } catch (e) {
      print('⚠️ Failed to load config: $e');
      // Return fallback config
      return {
        'success': true,
        'config': {
          'maxPdfSize': AppConstants.maxFileSizeBytes,
          'maxPdfSizeMB': AppConstants.maxFileSizeMB,
        }
      };
    }
  }

  // Get server configuration
  Future<Map<String, dynamic>> getServerConfig() async {
    try {
      final response = await _dio.get('/config');
      return response.data;
    } catch (e) {
      print('🚨 Failed to get server config: $e');
      throw _handleError(e);
    }
  }

  // Get supported languages
  Future<List<Map<String, dynamic>>> getSupportedLanguages() async {
    try {
      final response = await _dio.get('/languages');
      print('🌐 Languages API response: ${response.data}');
      
      if (response.data['success'] == true && response.data['languages'] != null) {
        final languages = response.data['languages'] as List;
        return languages.map((lang) => {
          'code': lang['code'],
          'name': lang['name'],
        }).toList();
      } else {
        throw Exception('Invalid response format from languages API');
      }
    } catch (e) {
      print('🚨 Failed to get supported languages: $e');
      throw _handleError(e);
    }
  }

  // Generate quiz with streaming (Server-Sent Events)
  Future<Stream<Map<String, dynamic>>> generateQuizStream(
    String filename, {
    String language = 'en',
    int questionsPerPage = 2,
    String difficulty = 'mixed',
    bool includeExplanations = true,
  }) async {
    try {
      print('🌊 Starting streaming quiz generation for: $filename');
      print('🎯 Options: language=$language, questionsPerPage=$questionsPerPage, difficulty=$difficulty, explanations=$includeExplanations');

      final options = {
        'language': language,
        'questionsPerPage': questionsPerPage,
        'difficulty': difficulty,
        'includeExplanations': includeExplanations,
      };

      final response = await _dio.post(
        '/generate-quiz-stream/$filename',
        data: options,
        options: Options(
          headers: {
            'Accept': 'text/event-stream',
          },
          responseType: ResponseType.stream,
        ),
      );

      print('📊 Streaming response status: ${response.statusCode}');
      
      // Accept both 200 and 201 status codes
      if (response.statusCode == 200 || response.statusCode == 201) {
        // Handle ResponseBody properly
        final responseBody = response.data;
        
        if (responseBody is ResponseBody) {
          return responseBody.stream
            .cast<List<int>>() // Ensure proper type casting
            .transform(utf8.decoder)
            .transform(const LineSplitter())
            .map((line) {
              if (line.startsWith('data: ')) {
                try {
                  final jsonStr = line.substring(6); // Remove 'data: '
                  if (jsonStr.trim().isNotEmpty && jsonStr.trim() != '[DONE]') {
                    final eventData = jsonDecode(jsonStr) as Map<String, dynamic>;
                    print('📡 SSE Event: ${eventData['type']} - ${eventData['data']?['message'] ?? ''}');
                    return eventData;
                  }
                } catch (e) {
                  print('⚠️ Failed to parse SSE data: $e');
                }
              }
              return <String, dynamic>{};
            })
            .where((event) => event.isNotEmpty);
        } else {
          throw Exception('Unexpected response type: ${responseBody.runtimeType}');
        }
      } else {
        throw Exception('Streaming failed with status: ${response.statusCode}');
      }
    } catch (e) {
      print('🚨 Streaming quiz generation failed: $e');
      throw _handleError(e);
    }
  }

  Exception _handleError(dynamic error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return Exception('Connection timeout. Please check your internet connection.');
        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode;
          final message = error.response?.data?['message'] ?? 
                          error.response?.data?['error'] ?? 
                          'Server error occurred';
          
          // Handle specific status codes like web app
          switch (statusCode) {
            case 413:
              return Exception('PDF file is too large. Maximum size is ${AppConstants.maxFileSizeMB}MB.');
            case 400:
              if (message.contains('PDF') || message.contains('file')) {
                return Exception('Only PDF files are allowed. Please select a valid PDF file.');
              }
              return Exception(message);
            case 500:
            case 502:
            case 503:
              return Exception('Server error. Please try again later.');
            default:
              return Exception('Upload failed: $message');
          }
        case DioExceptionType.cancel:
          return Exception('Request was cancelled');
        case DioExceptionType.unknown:
          if (error.error is SocketException) {
            return Exception('Network error. Please check your internet connection.');
          }
          return Exception('Network error. Please check your internet connection.');
        default:
          return Exception('An unexpected error occurred');
      }
    }
    
    // Handle other exceptions
    if (error is Exception) {
      return error;
    }
    
    return Exception('An unexpected error occurred: ${error.toString()}');
  }
} 