import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:file_picker/file_picker.dart';
import '../services/api_service.dart';
import '../models/file_upload.dart';

class FileUploadComposable extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  bool _isUploading = false;
  double _uploadProgress = 0.0;
  String? _uploadError;
  File? _uploadedFile;
  UploadedFile? _uploadedFileInfo;

  // Getters
  bool get isUploading => _isUploading;
  double get uploadProgress => _uploadProgress;
  String? get uploadError => _uploadError;
  File? get uploadedFile => _uploadedFile;
  UploadedFile? get uploadedFileInfo => _uploadedFileInfo;
  bool get hasUploadedFile => _uploadedFile != null;

  Future<void> selectAndUploadFile() async {
    try {
      _uploadError = null;
      notifyListeners();

      FilePickerResult? result;
      
      try {
        result = await FilePicker.platform.pickFiles(
          type: FileType.custom,
          allowedExtensions: ['pdf'],
          allowMultiple: false,
          allowCompression: false,
          withData: false,
          withReadStream: false,
          lockParentWindow: false,
        );
      } catch (e) {
        // Fallback approach
        result = await FilePicker.platform.pickFiles(
          type: FileType.any,
          allowMultiple: false,
          allowCompression: false,
          withData: false,
          withReadStream: false,
          lockParentWindow: false,
        );
      }

      if (result != null && result.files.isNotEmpty) {
        final pickedFile = result.files.first;
        
        // Validate file is PDF
        if (!pickedFile.name.toLowerCase().endsWith('.pdf') && 
            pickedFile.extension?.toLowerCase() != 'pdf') {
          _uploadError = '"${pickedFile.name}" is not a PDF file. Only PDF files are allowed.';
          notifyListeners();
          return;
        }
        
        if (pickedFile.path != null) {
          final file = File(pickedFile.path!);
          await uploadFile(file);
        } else {
          _uploadError = 'Unable to access the selected file. Please try again or select a different file.';
          notifyListeners();
        }
      }
    } catch (e) {
      _uploadError = 'File selection failed: ${e.toString()}';
      notifyListeners();
    }
  }

  Future<void> uploadFile(File file) async {
    try {
      _isUploading = true;
      _uploadProgress = 0.0;
      _uploadError = null;
      notifyListeners();

      final uploadResponse = await _apiService.uploadFile(
        file,
        onSendProgress: (sent, total) {
          _uploadProgress = total > 0 ? sent / total : 0.0;
          notifyListeners();
        },
      );

      if (uploadResponse.success && uploadResponse.file != null) {
        _uploadedFile = file;
        _uploadedFileInfo = uploadResponse.file;
        _isUploading = false;
        notifyListeners();
      } else {
        throw Exception(uploadResponse.error ?? 'Upload failed');
      }
    } catch (e) {
      _uploadError = 'Upload failed: ${e.toString()}';
      _isUploading = false;
      notifyListeners();
    }
  }

  void clearUploadedFile() {
    _uploadedFile = null;
    _uploadedFileInfo = null;
    _uploadError = null;
    _uploadProgress = 0.0;
    notifyListeners();
  }
} 