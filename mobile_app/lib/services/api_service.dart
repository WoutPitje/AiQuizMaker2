import 'package:dio/dio.dart';
import '../utils/constants.dart';
import '../utils/error_handler.dart';
import '../models/file_upload.dart';

class ApiService {
  late final Dio _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConstants.apiUrl,
      connectTimeout: AppConstants.connectTimeout,
      receiveTimeout: AppConstants.receiveTimeout,
      sendTimeout: AppConstants.sendTimeout,
    ));

    _setupInterceptors();
  }

  void _setupInterceptors() {
    // Request/Response logging
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      logPrint: (obj) => print('🌐 API: $obj'),
    ));

    // Error handling
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          print('🚀 ${options.method} ${options.path}');
          handler.next(options);
        },
        onResponse: (response, handler) {
          print('✅ ${response.statusCode} ${response.requestOptions.path}');
          handler.next(response);
        },
        onError: (error, handler) {
          print('❌ ${error.response?.statusCode} ${error.requestOptions.path}');
          ErrorHandler.logError(error);
          handler.next(error);
        },
      ),
    );
  }

  /// Get API configuration
  Future<ApiConfig> getConfig() async {
    try {
      print('📡 Fetching API config from: ${AppConstants.apiUrl}${AppConstants.configEndpoint}');
      
      final response = await _dio.get(AppConstants.configEndpoint);
      
      print('📄 Config response: ${response.data}');
      
      return ApiConfig.fromJson(response.data);
    } catch (e) {
      print('🚨 Config fetch failed: $e');
      throw ApiException.fromDioException(e as DioException);
    }
  }

  /// Test connection to API
  Future<bool> testConnection() async {
    try {
      final config = await getConfig();
      return config.success;
    } catch (e) {
      print('🔴 Connection test failed: $e');
      return false;
    }
  }

  /// Get API base URL for debugging
  String get baseUrl => _dio.options.baseUrl;
} 