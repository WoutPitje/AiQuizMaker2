import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('quizzes')
@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Public()
  @Get(':magicLink')
  @ApiOperation({ summary: 'Get quiz by magic link' })
  @ApiParam({ name: 'magicLink', description: 'Quiz magic link identifier' })
  @ApiResponse({ status: 200, description: 'Quiz retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async getQuizByMagicLink(@Param('magicLink') magicLink: string) {
    try {
      const quiz = await this.quizService.getQuizByMagicLink(magicLink);

      if (!quiz) {
        return {
          success: false,
          message: 'Quiz not found',
          error: 'QUIZ_NOT_FOUND',
        };
      }

      return {
        success: true,
        quiz,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve quiz',
        error: error.message,
      };
    }
  }

  @Public()
  @Get(':quizId')
  async getQuiz(@Param('quizId') quizId: string) {
    try {
      const quiz = await this.quizService.getQuizById(quizId);

      if (!quiz) {
        return {
          success: false,
          message: 'Quiz not found',
          error: 'QUIZ_NOT_FOUND',
        };
      }

      return {
        success: true,
        quiz,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve quiz',
        error: error.message,
      };
    }
  }

  @Get()
  @ApiOperation({ summary: 'List all quizzes' })
  @ApiResponse({
    status: 200,
    description: 'List of quizzes retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        quizzes: { type: 'array' },
        total: { type: 'number' },
        count: { type: 'number' },
      },
    },
  })
  async listQuizzes() {
    try {
      const result = await this.quizService.listQuizzes();

      return {
        success: true,
        quizzes: result.quizzes,
        total: result.total,
        count: result.quizzes.length,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to list quizzes',
        error: error.message,
      };
    }
  }
}
