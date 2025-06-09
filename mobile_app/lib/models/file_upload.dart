class UploadedFile {
  final String filename;
  final String? originalname;
  final String? mimetype;
  final int size;
  final String path;
  final DateTime uploadedAt;

  UploadedFile({
    required this.filename,
    this.originalname,
    this.mimetype,
    required this.size,
    required this.path,
    required this.uploadedAt,
  });

  factory UploadedFile.fromJson(Map<String, dynamic> json) {
    return UploadedFile(
      filename: json['filename'] ?? '',
      originalname: json['originalname'],
      mimetype: json['mimetype'],
      size: json['size'] ?? 0,
      path: json['path'] ?? '',
      uploadedAt: DateTime.now(), // API doesn't return this, so use current time
    );
  }
}

class FileUploadResponse {
  final bool success;
  final String? message;
  final UploadedFile? file;
  final String? error;

  FileUploadResponse({
    required this.success,
    this.message,
    this.file,
    this.error,
  });

  factory FileUploadResponse.fromJson(Map<String, dynamic> json) {
    return FileUploadResponse(
      success: json['success'] ?? false,
      message: json['message'],
      file: json['file'] != null ? UploadedFile.fromJson(json['file']) : null,
      error: json['error'],
    );
  }
} 