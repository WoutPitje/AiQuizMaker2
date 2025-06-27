import { SetMetadata } from '@nestjs/common';

export const QUIZ_OWNERSHIP_KEY = 'quiz_ownership';
export const QuizOwnership = () => SetMetadata(QUIZ_OWNERSHIP_KEY, true);