import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { QuizmakerService } from './quizmaker.service';
import { StorageService } from './storage.service';
import { PdfToQuizOptions } from './models/quiz.model';

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
export class QuizWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(QuizWebSocketGateway.name);
  private activeConnections = new Map<string, { socket: Socket; quizId?: string }>();

  constructor(
    private readonly quizmakerService: QuizmakerService,
    private readonly storageService: StorageService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.activeConnections.set(client.id, { socket: client });
    
    // Send connection confirmation
    client.emit('connection', {
      type: 'connection',
      message: 'WebSocket connected successfully',
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
  ) {
    const { filename, options = {} } = data;
    
    try {
      this.logger.log(`Starting quiz generation for client ${client.id}, file: ${filename}`);
      
      // Check if file exists
      const fileExists = await this.storageService.fileExists(filename, 'uploads');
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
      const quizStream = this.quizmakerService.pdfToQuizStream(filename, options);

      quizStream.subscribe({
        next: (eventData) => {
          // Send event to specific client
          client.emit('quiz-event', eventData);
        },
        error: (error) => {
          this.logger.error(`Quiz generation error for client ${client.id}:`, error);
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
      this.logger.error(`Failed to start quiz generation for client ${client.id}:`, error);
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