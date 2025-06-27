import { Controller, Get, Param, Request, UseGuards, Delete, Put, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuizOwnership } from './decorators/quiz-ownership.decorator';
import { QuizOwnershipGuard } from './guards/quiz-ownership.guard';

@ApiTags('quizzes')
@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List current user\'s quizzes' })
  @ApiResponse({
    status: 200,
    description: 'List of user quizzes retrieved successfully',
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
  async listMyQuizzes(@Request() req) {
    try {
      const userId = req.user.id;
      const result = await this.quizService.listQuizzesByUser(userId);

      return {
        success: true,
        quizzes: result.quizzes,
        total: result.total,
        count: result.quizzes.length,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to list user quizzes',
        error: error.message,
      };
    }
  }

  @Public()
  @Get('limit-check')
  @ApiOperation({ summary: 'Check quiz generation limits for current user' })
  @ApiResponse({
    status: 200,
    description: 'Quiz limit information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        allowed: { type: 'boolean' },
        current: { type: 'number' },
        limit: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async checkQuizLimit(@Request() req) {
    try {
      const userId = req.user?.id || null;
      const limitCheck = await this.quizService.checkQuizLimit(userId);

      return {
        success: true,
        ...limitCheck,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to check quiz limits',
        error: error.message,
      };
    }
  }

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


  @Public()
  @Get()
  @ApiOperation({ summary: 'List all public quizzes' })
  @ApiResponse({
    status: 200,
    description: 'List of public quizzes retrieved successfully',
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
      const result = await this.quizService.listPublicQuizzes();

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

  @Delete(':id')
  @UseGuards(JwtAuthGuard, QuizOwnershipGuard)
  @QuizOwnership()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a quiz (owner only)' })
  @ApiParam({ name: 'id', description: 'Quiz ID or magic link' })
  @ApiResponse({ status: 200, description: 'Quiz deleted successfully' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  @ApiResponse({ status: 403, description: 'Not authorized to delete this quiz' })
  async deleteQuiz(@Param('id') id: string, @Request() req) {
    try {
      const quiz = req.quiz; // Added by QuizOwnershipGuard
      const success = await this.quizService.deleteQuizByMagicLink(quiz.magicLink);

      if (!success) {
        return {
          success: false,
          message: 'Failed to delete quiz',
          error: 'DELETE_FAILED',
        };
      }

      return {
        success: true,
        message: 'Quiz deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete quiz',
        error: error.message,
      };
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, QuizOwnershipGuard)
  @QuizOwnership()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update quiz metadata (owner only)' })
  @ApiParam({ name: 'id', description: 'Quiz ID or magic link' })
  @ApiResponse({ status: 200, description: 'Quiz updated successfully' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  @ApiResponse({ status: 403, description: 'Not authorized to update this quiz' })
  async updateQuiz(
    @Param('id') id: string,
    @Body() updateData: { title?: string; description?: string },
    @Request() req,
  ) {
    try {
      const quiz = req.quiz; // Added by QuizOwnershipGuard
      const updatedQuiz = await this.quizService.updateQuizMetadata(quiz.magicLink, updateData);

      return {
        success: true,
        message: 'Quiz updated successfully',
        quiz: updatedQuiz,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update quiz',
        error: error.message,
      };
    }
  }

  @Patch(':id/visibility')
  @UseGuards(JwtAuthGuard, QuizOwnershipGuard)
  @QuizOwnership()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle quiz visibility (owner only)' })
  @ApiParam({ name: 'id', description: 'Quiz ID or magic link' })
  @ApiResponse({ status: 200, description: 'Quiz visibility updated successfully' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  @ApiResponse({ status: 403, description: 'Not authorized to modify this quiz' })
  async toggleQuizVisibility(
    @Param('id') id: string,
    @Body() visibilityData: { isPublic: boolean },
    @Request() req,
  ) {
    try {
      const quiz = req.quiz; // Added by QuizOwnershipGuard
      const updatedQuiz = await this.quizService.updateQuizVisibility(
        quiz.magicLink,
        visibilityData.isPublic,
      );

      return {
        success: true,
        message: 'Quiz visibility updated successfully',
        quiz: updatedQuiz,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update quiz visibility',
        error: error.message,
      };
    }
  }
}
