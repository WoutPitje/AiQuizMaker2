import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiService } from '../ai/ai.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('config')
@Controller()
export class ConfigController {
  constructor(private readonly aiService: AiService) {}

  @Public()
  @Get('languages')
  @ApiOperation({ summary: 'Get supported languages for quiz generation' })
  @ApiResponse({
    status: 200,
    description: 'List of supported languages',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        languages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
        count: { type: 'number' },
      },
    },
  })
  getSupportedLanguages() {
    try {
      const languages = this.aiService.getSupportedLanguages();

      return {
        success: true,
        languages,
        count: languages.length,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve supported languages',
        error: error.message,
      };
    }
  }

  @Public()
  @Get('config')
  @ApiOperation({ summary: 'Get application configuration' })
  @ApiResponse({
    status: 200,
    description: 'Application configuration',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        config: {
          type: 'object',
          properties: {
            maxPdfSize: { type: 'number' },
            maxPdfSizeMB: { type: 'number' },
            maxPagesPerPdf: { type: 'number' },
            defaultQuestionsPerPage: { type: 'number' },
            supportedLanguages: { type: 'array' },
            storage: { type: 'object' },
          },
        },
      },
    },
  })
  getConfig() {
    const maxSizeBytes = parseInt(process.env.MAX_PDF_SIZE || '104857600');
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));

    return {
      success: true,
      config: {
        maxPdfSize: maxSizeBytes,
        maxPdfSizeMB: maxSizeMB,
        maxPagesPerPdf: parseInt(process.env.MAX_PAGES_PER_PDF || '50'),
        defaultQuestionsPerPage: parseInt(
          process.env.DEFAULT_QUESTIONS_PER_PAGE || '2',
        ),
        supportedLanguages: this.aiService.getSupportedLanguages(),
        storage: {
          gcsEnabled: !!(
            process.env.UPLOADS_BUCKET && process.env.QUIZ_STORAGE_BUCKET
          ),
          uploadsBucket: process.env.UPLOADS_BUCKET
            ? '✓ Configured'
            : '✗ Missing',
          quizStorageBucket: process.env.QUIZ_STORAGE_BUCKET
            ? '✓ Configured'
            : '✗ Missing',
          gcpProjectId: process.env.GCP_PROJECT_ID
            ? '✓ Configured'
            : '✗ Missing',
        },
      },
    };
  }
}
