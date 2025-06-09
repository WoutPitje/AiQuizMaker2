import 'package:dio/dio.dart';

/// Custom exception for API-related errors
class ApiException implements Exception {
  final String message;
  final String? errorCode;
  final int? statusCode;
  final dynamic originalError;

  const ApiException(
    this.message, {
    this.errorCode,
    this.statusCode,
    this.originalError,
  });

  @override
  String toString() => 'ApiException: $message';

  /// Create ApiException from DioException
  factory ApiException.fromDioException(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
        return const ApiException(
          'Connection timeout. Please check your internet connection.',
          errorCode: 'CONNECTION_TIMEOUT',
        );
      case DioExceptionType.sendTimeout:
        return const ApiException(
          'Request timeout. Please try again.',
          errorCode: 'SEND_TIMEOUT',
        );
      case DioExceptionType.receiveTimeout:
        return const ApiException(
          'Response timeout. The server is taking too long to respond.',
          errorCode: 'RECEIVE_TIMEOUT',
        );
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final responseData = error.response?.data;
        
        if (responseData is Map<String, dynamic>) {
          final message = responseData['message'] ?? 'Unknown server error';
          final errorCode = responseData['error'] ?? 'SERVER_ERROR';
          
          return ApiException(
            message,
            errorCode: errorCode,
            statusCode: statusCode,
            originalError: error,
          );
        }
        
        return ApiException(
          _getStatusCodeMessage(statusCode),
          errorCode: 'HTTP_ERROR',
          statusCode: statusCode,
          originalError: error,
        );
      case DioExceptionType.cancel:
        return const ApiException(
          'Request was cancelled',
          errorCode: 'REQUEST_CANCELLED',
        );
      case DioExceptionType.connectionError:
        return const ApiException(
          'No internet connection. Please check your network settings.',
          errorCode: 'NO_INTERNET',
        );
      case DioExceptionType.unknown:
        return ApiException(
          'Network error: ${error.message ?? "Unknown error"}',
          errorCode: 'UNKNOWN_ERROR',
          originalError: error,
        );
      default:
        return ApiException(
          'Unexpected error occurred',
          errorCode: 'UNEXPECTED_ERROR',
          originalError: error,
        );
    }
  }

  static String _getStatusCodeMessage(int? statusCode) {
    switch (statusCode) {
      case 400:
        return 'Bad request. Please check your input.';
      case 401:
        return 'Unauthorized. Please log in again.';
      case 403:
        return 'Access forbidden. You don\'t have permission.';
      case 404:
        return 'Resource not found.';
      case 413:
        return 'File too large. Please choose a smaller file.';
      case 422:
        return 'Invalid file format. Please upload a PDF file.';
      case 429:
        return 'Too many requests. Please wait and try again.';
      case 500:
        return 'Internal server error. Please try again later.';
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.';
      case 503:
        return 'Service unavailable. Please try again later.';
      case 504:
        return 'Gateway timeout. The server is taking too long to respond.';
      default:
        return 'Server error (${statusCode ?? 'unknown'})';
    }
  }
}

/// Global error handler utility
class ErrorHandler {
  /// Convert any error to user-friendly message
  static String getErrorMessage(dynamic error) {
    if (error is ApiException) {
      return error.message;
    } else if (error is DioException) {
      return ApiException.fromDioException(error).message;
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }

  /// Get error code for logging/analytics
  static String? getErrorCode(dynamic error) {
    if (error is ApiException) {
      return error.errorCode;
    } else if (error is DioException) {
      return ApiException.fromDioException(error).errorCode;
    }
    return null;
  }

  /// Log error for debugging/analytics
  static void logError(dynamic error, [StackTrace? stackTrace]) {
    final errorMessage = getErrorMessage(error);
    final errorCode = getErrorCode(error);
    
    print('🚨 Error: $errorMessage');
    if (errorCode != null) {
      print('   Code: $errorCode');
    }
    if (stackTrace != null) {
      print('   Stack: $stackTrace');
    }
  }
} 