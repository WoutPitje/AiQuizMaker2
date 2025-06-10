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
    return GestureDetector(
      onTap: !isUploading ? onUploadPressed : null,
      child: Container(
        width: double.infinity,
        constraints: const BoxConstraints(maxWidth: 700), // Match web max-width
        padding: const EdgeInsets.all(32), // Increased padding to match web
        decoration: BoxDecoration(
          color: const Color(0xFFF9FAFB), // gray-50 to match page background
          borderRadius: BorderRadius.circular(8), // Slightly reduced border radius
          border: Border.all(
            color: Colors.grey[300]!,
            width: 2,
            style: BorderStyle.none, // We'll use DashRect for dashed border
          ),
        ),
        child: CustomPaint(
        painter: DashedBorderPainter(
          color: Colors.grey[300]!,
          strokeWidth: 2,
          dashLength: 5,
          dashGap: 5,
        ),
        child: Container(
          padding: const EdgeInsets.all(2), // Small padding inside dashed border
          child: Column(
            children: [
              if (uploadedFile == null) ...[
                // Upload Icon - Match web design
                Container(
                  width: 48,
                  height: 48,
                  margin: const EdgeInsets.only(bottom: 16),
                  child: CustomPaint(
                    painter: UploadIconPainter(color: Colors.grey[400]!),
                  ),
                ),
                
                // Upload Text - Match web structure
                const Text(
                  'Upload your PDF file',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w500, // Slightly less bold
                    color: Color(0xFF111827), // gray-900
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Drag and drop your PDF file here, or click to browse',
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFF6B7280), // gray-500
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  'Maximum file size: $maxFileSize',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF9CA3AF), // gray-400
                  ),
                ),
                const SizedBox(height: 20),
                
                // Upload Progress Overlay - Match web design
                if (isUploading) ...[
                  Container(
                    margin: const EdgeInsets.only(top: 20),
                    child: Column(
                      children: [
                        // Spinning loader
                        Container(
                          width: 32,
                          height: 32,
                          margin: const EdgeInsets.only(bottom: 8),
                          child: const CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2563EB)), // blue-600
                          ),
                        ),
                        const Text(
                          'Uploading...',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF374151), // gray-700
                          ),
                        ),
                        const SizedBox(height: 8),
                        // Progress Bar
                        Container(
                          width: 192, // 48 * 4 (w-48 in Tailwind)
                          height: 8,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE5E7EB), // gray-200
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: FractionallySizedBox(
                            alignment: Alignment.centerLeft,
                            widthFactor: uploadProgress,
                            child: Container(
                              decoration: BoxDecoration(
                                color: const Color(0xFF2563EB), // blue-600
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${(uploadProgress * 100).toInt()}%',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF6B7280), // gray-500
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
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
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2), // red-50
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: const Color(0xFFFECACA)), // red-200
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.error, color: const Color(0xFFDC2626), size: 20), // red-600
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Upload Error',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF991B1B), // red-800
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              error!,
                              style: const TextStyle(
                                fontSize: 14,
                                color: Color(0xFFB91C1C), // red-700
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    ));
  }
}

// Custom painter for dashed border
class DashedBorderPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double dashLength;
  final double dashGap;

  DashedBorderPainter({
    required this.color,
    required this.strokeWidth,
    required this.dashLength,
    required this.dashGap,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    final path = Path()
      ..addRRect(RRect.fromRectAndRadius(
        Rect.fromLTWH(0, 0, size.width, size.height),
        const Radius.circular(8),
      ));

    _drawDashedPath(canvas, path, paint);
  }

  void _drawDashedPath(Canvas canvas, Path path, Paint paint) {
    final pathMetrics = path.computeMetrics();
    for (final pathMetric in pathMetrics) {
      double distance = 0.0;
      while (distance < pathMetric.length) {
        final nextDistance = distance + dashLength;
        final extractPath = pathMetric.extractPath(
          distance,
          nextDistance > pathMetric.length ? pathMetric.length : nextDistance,
        );
        canvas.drawPath(extractPath, paint);
        distance = nextDistance + dashGap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// Custom painter for upload icon to match web design
class UploadIconPainter extends CustomPainter {
  final Color color;

  UploadIconPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final path = Path();
    
    // Upload arrow
    path.moveTo(size.width * 0.5, size.height * 0.2);
    path.lineTo(size.width * 0.5, size.height * 0.75);
    
    // Arrow head
    path.moveTo(size.width * 0.35, size.height * 0.35);
    path.lineTo(size.width * 0.5, size.height * 0.2);
    path.lineTo(size.width * 0.65, size.height * 0.35);
    
    // Base line
    path.moveTo(size.width * 0.2, size.height * 0.8);
    path.lineTo(size.width * 0.8, size.height * 0.8);

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
} 