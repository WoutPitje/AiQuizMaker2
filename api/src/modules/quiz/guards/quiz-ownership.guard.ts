import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizEntity } from '../entities/quiz.entity';
import { QUIZ_OWNERSHIP_KEY } from '../decorators/quiz-ownership.decorator';

@Injectable()
export class QuizOwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(QuizEntity)
    private readonly quizRepository: Repository<QuizEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresOwnership = this.reflector.getAllAndOverride<boolean>(
      QUIZ_OWNERSHIP_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresOwnership) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const quizId = request.params.id || request.params.magicLink;

    if (!user || !quizId) {
      throw new ForbiddenException('User must be authenticated to access this resource');
    }

    // Find quiz by magic link or ID
    const quiz = await this.quizRepository.findOne({
      where: [
        { magicLink: quizId },
        { id: quizId }
      ],
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to access this quiz');
    }

    // Add quiz to request for use in controller
    request.quiz = quiz;

    return true;
  }
}