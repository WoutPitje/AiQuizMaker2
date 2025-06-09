// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'file_upload.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UploadResponse _$UploadResponseFromJson(Map<String, dynamic> json) =>
    UploadResponse(
      success: json['success'] as bool,
      message: json['message'] as String,
      file: json['file'] == null
          ? null
          : UploadedFile.fromJson(json['file'] as Map<String, dynamic>),
      error: json['error'] as String?,
    );

Map<String, dynamic> _$UploadResponseToJson(UploadResponse instance) =>
    <String, dynamic>{
      'success': instance.success,
      'message': instance.message,
      'file': instance.file,
      'error': instance.error,
    };

UploadedFile _$UploadedFileFromJson(Map<String, dynamic> json) => UploadedFile(
  filename: json['filename'] as String,
  originalname: json['originalname'] as String,
  mimetype: json['mimetype'] as String,
  size: (json['size'] as num).toInt(),
  path: json['path'] as String,
);

Map<String, dynamic> _$UploadedFileToJson(UploadedFile instance) =>
    <String, dynamic>{
      'filename': instance.filename,
      'originalname': instance.originalname,
      'mimetype': instance.mimetype,
      'size': instance.size,
      'path': instance.path,
    };

ApiConfig _$ApiConfigFromJson(Map<String, dynamic> json) => ApiConfig(
  success: json['success'] as bool,
  config: ConfigData.fromJson(json['config'] as Map<String, dynamic>),
);

Map<String, dynamic> _$ApiConfigToJson(ApiConfig instance) => <String, dynamic>{
  'success': instance.success,
  'config': instance.config,
};

ConfigData _$ConfigDataFromJson(Map<String, dynamic> json) => ConfigData(
  maxPdfSize: (json['maxPdfSize'] as num).toInt(),
  maxPdfSizeMB: (json['maxPdfSizeMB'] as num).toInt(),
  maxPagesPerPdf: (json['maxPagesPerPdf'] as num).toInt(),
  defaultQuestionsPerPage: (json['defaultQuestionsPerPage'] as num).toInt(),
  supportedLanguages: (json['supportedLanguages'] as List<dynamic>)
      .map((e) => Language.fromJson(e as Map<String, dynamic>))
      .toList(),
);

Map<String, dynamic> _$ConfigDataToJson(ConfigData instance) =>
    <String, dynamic>{
      'maxPdfSize': instance.maxPdfSize,
      'maxPdfSizeMB': instance.maxPdfSizeMB,
      'maxPagesPerPdf': instance.maxPagesPerPdf,
      'defaultQuestionsPerPage': instance.defaultQuestionsPerPage,
      'supportedLanguages': instance.supportedLanguages,
    };

Language _$LanguageFromJson(Map<String, dynamic> json) =>
    Language(code: json['code'] as String, name: json['name'] as String);

Map<String, dynamic> _$LanguageToJson(Language instance) => <String, dynamic>{
  'code': instance.code,
  'name': instance.name,
};
