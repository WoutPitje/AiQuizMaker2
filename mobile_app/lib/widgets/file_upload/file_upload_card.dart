import 'package:flutter/material.dart';
import 'dart:io';

class FileUploadCard extends StatelessWidget {
  final VoidCallback onUploadPressed;
  final bool isUploading;
  final double uploadProgress;
  final String? error;
  final File? uploadedFile;
  final String maxFileSize;

  const FileUploadCard({
    super.key,
    required this.onUploadPressed,
    required this.isUploading,
    required this.uploadProgress,
    required this.maxFileSize,
    this.error,
    this.uploadedFile,
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
        children: [
          if (uploadedFile == null) ...[
            Icon(
              Icons.cloud_upload_outlined,
              size: 48,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            const Text(
              'Upload your PDF file',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Maximum file size: $maxFileSize',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 20),
            if (isUploading) ...[
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              Text(
                '${(uploadProgress * 100).toInt()}% uploaded',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
            ] else
              ElevatedButton.icon(
                onPressed: onUploadPressed,
                icon: const Icon(Icons.upload_file),
                label: const Text('Select PDF File'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
          ] else ...[
            Icon(
              Icons.check_circle,
              size: 48,
              color: Colors.green[500],
            ),
            const SizedBox(height: 16),
            const Text(
              'File uploaded successfully!',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              uploadedFile!.path.split('/').last,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ],
          if (error != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red[200]!),
              ),
              child: Row(
                children: [
                  Icon(Icons.error, color: Colors.red[600], size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      error!,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.red[700],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
} 