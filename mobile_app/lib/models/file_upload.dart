import 'package:json_annotation/json_annotation.dart';

part 'file_upload.g.dart';

@JsonSerializable()
class UploadResponse {
  final bool success;
  final String message;
  final UploadedFile? file;
  final String? error;

  const UploadResponse({
    required this.success,
    required this.message,
    this.file,
    this.error,
  });

  factory UploadResponse.fromJson(Map<String, dynamic> json) => _$UploadResponseFromJson(json);
  Map<String, dynamic> toJson() => _$UploadResponseToJson(this);
}

@JsonSerializable()
class UploadedFile {
  final String filename;
  final String originalname;
  final String mimetype;
  final int size;
  final String path;

  const UploadedFile({
    required this.filename,
    required this.originalname,
    required this.mimetype,
    required this.size,
    required this.path,
  });

  factory UploadedFile.fromJson(Map<String, dynamic> json) => _$UploadedFileFromJson(json);
  Map<String, dynamic> toJson() => _$UploadedFileToJson(this);
  
  String get sizeInMB => '${(size / (1024 * 1024)).toStringAsFixed(1)} MB';
}

@JsonSerializable()
class ApiConfig {
  final bool success;
  final ConfigData config;

  const ApiConfig({
    required this.success,
    required this.config,
  });

  factory ApiConfig.fromJson(Map<String, dynamic> json) => _$ApiConfigFromJson(json);
  Map<String, dynamic> toJson() => _$ApiConfigToJson(this);
}

@JsonSerializable()
class ConfigData {
  final int maxPdfSize;
  final int maxPdfSizeMB;
  final int maxPagesPerPdf;
  final int defaultQuestionsPerPage;
  final List<Language> supportedLanguages;

  const ConfigData({
    required this.maxPdfSize,
    required this.maxPdfSizeMB,
    required this.maxPagesPerPdf,
    required this.defaultQuestionsPerPage,
    required this.supportedLanguages,
  });

  factory ConfigData.fromJson(Map<String, dynamic> json) => _$ConfigDataFromJson(json);
  Map<String, dynamic> toJson() => _$ConfigDataToJson(this);
}

@JsonSerializable()
class Language {
  final String code;
  final String name;

  const Language({
    required this.code,
    required this.name,
  });

  factory Language.fromJson(Map<String, dynamic> json) => _$LanguageFromJson(json);
  Map<String, dynamic> toJson() => _$LanguageToJson(this);
} 