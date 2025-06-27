import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { extname } from 'path';
import { StorageService } from '../storage/storage.service';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Upload PDF file for quiz generation (supports both authenticated and anonymous users)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        file: {
          type: 'object',
          properties: {
            filename: { type: 'string' },
            originalname: { type: 'string' },
            mimetype: { type: 'string' },
            size: { type: 'number' },
          },
        },
        storage: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or missing file',
  })
  @ApiResponse({ status: 413, description: 'File too large' })
  @UseInterceptors(
    FileInterceptor('file', {
      // No diskStorage - handle files in memory for GCS upload
      limits: {
        fileSize: parseInt(process.env.MAX_PDF_SIZE || '104857600'), // 100MB default
      },
      fileFilter: (req, file, cb) => {
        // Only allow PDF files
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF files are allowed'), false);
        }
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      return {
        success: false,
        message: 'No PDF file uploaded',
        error: 'FILE_NOT_PROVIDED',
      };
    }

    // Double-check the file type on the server side
    if (file.mimetype !== 'application/pdf') {
      return {
        success: false,
        message: 'Only PDF files are allowed',
        error: 'INVALID_FILE_TYPE',
      };
    }

    try {
      // Support both authenticated and anonymous users
      const userId = req.user?.id || null;
      
      // Generate unique filename with timestamp and user context
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const prefix = userId ? `user-${userId}` : 'anonymous';
      const filename = `${prefix}-${file.fieldname}-${uniqueSuffix}${ext}`;

      // Upload to proper storage (GCS in production, local in development)
      await this.storageService.uploadFile(filename, file.buffer, 'uploads');

      // Log file size for debugging
      const maxSizeBytes = parseInt(process.env.MAX_PDF_SIZE || '104857600');
      const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
      const storageType = await this.getStorageInfo();

      const userType = userId ? `user ${userId}` : 'anonymous user';
      console.log(`📁 File uploaded by ${userType}: ${file.originalname} -> ${filename}`);
      console.log(
        `📊 File size: ${Math.round(file.size / (1024 * 1024))}MB / ${maxSizeMB}MB max`,
      );
      console.log(`🗄️  Storage: ${storageType}`);

      return {
        success: true,
        message: 'PDF file uploaded successfully',
        file: {
          filename: filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
        storage: storageType,
      };
    } catch (error) {
      console.error('Failed to upload file:', error);
      return {
        success: false,
        message: 'Failed to upload file to storage',
        error: error.message,
      };
    }
  }

  private async getStorageInfo(): Promise<string> {
    const gcsEnabled =
      process.env.UPLOADS_BUCKET && process.env.QUIZ_STORAGE_BUCKET;
    return gcsEnabled ? 'Google Cloud Storage' : 'Local Storage';
  }
}
