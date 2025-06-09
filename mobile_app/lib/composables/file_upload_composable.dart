import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:file_picker/file_picker.dart';
import '../services/api_service.dart';
import '../models/file_upload.dart';

class FileUploadComposable extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  bool _isUploading = false;
  double _uploadProgress = 0.0;
} 