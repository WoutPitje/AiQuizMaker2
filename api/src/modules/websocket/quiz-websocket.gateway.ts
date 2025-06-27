import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { QuizService } from '../quiz/quiz.service';
import { StorageService } from '../storage/storage.service';
import { PdfToQuizOptions } from '../../models/quiz.model';
import { User } from '../auth/entities/user.entity';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { AuthWsMiddleware } from './middleware/auth-ws.middleware';
import { WsCurrentUser } from './decorators/ws-current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'https://localhost:3000',
      'https://quizai.nl',
      'https://www.quizai.nl',
      'https://api.quizai.nl',
      'https://www.api.quizai.nl',
    ],
    credentials: true,
  },
  namespace: '/quiz',
})
export class QuizWebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(QuizWebsocketGateway.name);
  private activeConnections = new Map<
    string,
    { socket: Socket; quizId?: string; user?: User | null }
  >();

  constructor(
    private readonly quizService: QuizService,
    private readonly storageService: StorageService,
    private readonly jwtService: JwtService,
    private readonly jwtStrategy: JwtStrategy,
  ) {}

  afterInit(server: Server) {
    server.use(AuthWsMiddleware(this.jwtService, this.jwtStrategy));
  }

  handleConnection(client: Socket) {
    const user = client.data?.user;
    this.logger.log(
      `Client connected: ${client.id}, User: ${user?.id || 'anonymous'}`,
    );
    this.activeConnections.set(client.id, {
      socket: client,
      user: user,
    });

    client.emit('connection', {
      type: 'connection',
      message: 'WebSocket connected successfully',
      authenticated: !!user,
      user: user ? { id: user.id, email: user.email } : null,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.activeConnections.delete(client.id);
  }

  @SubscribeMessage('generate-quiz')
  async handleGenerateQuiz(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { filename: string; options?: PdfToQuizOptions },
    @WsCurrentUser() user: User | null,
  ) {
    const { filename, options = {} } = data;

    try {
      this.logger.log(
        `Starting quiz generation for client ${client.id}, user: ${user?.id || 'anonymous'}, file: ${filename}`,
      );
      this.logger.log(`Quiz options:`, {
        ...options,
        questionTypes: options.questionTypes || ['multiple-choice'],
        quizType: options.quizType || 'multiple-choice',
        userId: user?.id,
      });

      // Add user ID to options for quiz association
      const quizOptions = {
        ...options,
        userId: user?.id,
      };

      // Check if file exists
      const fileExists = await this.storageService.fileExists(
        filename,
        'uploads',
      );
      if (!fileExists) {
        client.emit('quiz-error', {
          type: 'error',
          message: 'File not found',
          error: 'FILE_NOT_FOUND',
        });
        return;
      }

      // Update connection info
      const connection = this.activeConnections.get(client.id);
      if (connection) {
        connection.quizId = `quiz_${Date.now()}_${client.id}`;
      }

      // Start quiz generation stream
      const quizStream = this.quizService.pdfToQuizStream(
        filename,
        quizOptions,
      );

      quizStream.subscribe({
        next: (eventData) => {
          // Send event to specific client
          client.emit('quiz-event', eventData);
        },
        error: (error) => {
          this.logger.error(
            `Quiz generation error for client ${client.id}:`,
            error,
          );
          client.emit('quiz-error', {
            type: 'error',
            message: 'Quiz generation failed',
            error: error.message,
          });
        },
        complete: () => {
          this.logger.log(`Quiz generation completed for client ${client.id}`);
          client.emit('quiz-complete', {
            type: 'complete',
            message: 'Quiz generation finished',
          });
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to start quiz generation for client ${client.id}:`,
        error,
      );
      client.emit('quiz-error', {
        type: 'error',
        message: 'Failed to start quiz generation',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', {
      type: 'pong',
      timestamp: new Date().toISOString(),
    });
  }

  // Utility method to send message to all connected clients
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Utility method to send message to specific client
  sendToClient(clientId: string, event: string, data: any) {
    const connection = this.activeConnections.get(clientId);
    if (connection) {
      connection.socket.emit(event, data);
    }
  }

  // Get connection stats
  getConnectionStats() {
    return {
      totalConnections: this.activeConnections.size,
      activeQuizGenerations: Array.from(this.activeConnections.values()).filter(
        (conn) => conn.quizId,
      ).length,
    };
  }
}
