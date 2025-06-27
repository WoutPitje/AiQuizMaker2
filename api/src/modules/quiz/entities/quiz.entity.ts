import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('quizzes')
export class QuizEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'magic_link' })
  magicLink: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ name: 'source_filename', nullable: true })
  sourceFilename?: string;

  @Column({ name: 'total_questions', default: 0 })
  totalQuestions: number;

  @Column({ name: 'total_pages', default: 0 })
  totalPages: number;

  @Column({ length: 10, default: 'en' })
  language: string;

  @Column({ length: 20, default: 'mixed' })
  difficulty: string;

  @Column('jsonb', { name: 'quiz_data' })
  quizData: any;

  @Column('jsonb', { nullable: true })
  metadata?: any;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
