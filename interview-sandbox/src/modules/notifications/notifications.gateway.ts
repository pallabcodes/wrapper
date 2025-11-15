import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const userId = payload.sub?.toString();
      if (userId) {
        this.connectedUsers.set(userId, client.id);
        client.data.userId = userId;
        this.logger.log(`User ${userId} connected with socket ${client.id}`);
        
        // Join user-specific room (use room instead of socketId for better scalability)
        client.join(`user:${userId}`);
        
        // Notify user they're connected
        client.emit('connected', { userId, timestamp: Date.now() });
      } else {
        client.disconnect();
      }
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`User ${userId} disconnected (socket ${client.id})`);
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string }) {
    if (data?.room) {
      client.join(data.room);
      this.logger.log(`Client ${client.id} joined room: ${data.room}`);
      return { event: 'joined-room', room: data.room };
    }
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string }) {
    if (data?.room) {
      client.leave(data.room);
      this.logger.log(`Client ${client.id} left room: ${data.room}`);
      return { event: 'left-room', room: data.room };
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', timestamp: Date.now() };
  }

  // Get online status of users
  @SubscribeMessage('get-online-status')
  handleGetOnlineStatus(@ConnectedSocket() client: Socket, @MessageBody() data: { userIds: string[] }) {
    const onlineStatus: Record<string, boolean> = {};
    
    if (data?.userIds && Array.isArray(data.userIds)) {
      data.userIds.forEach((userId) => {
        onlineStatus[userId] = this.connectedUsers.has(userId);
      });
    }
    
    return { event: 'online-status', status: onlineStatus };
  }

  // Subscribe to user's online status changes
  @SubscribeMessage('subscribe-user-status')
  handleSubscribeUserStatus(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    if (data?.userId) {
      client.join(`status:${data.userId}`);
      return { event: 'subscribed', userId: data.userId };
    }
  }

  // Method to send notification to a specific user
  // Uses rooms for better scalability (supports multiple devices per user)
  sendToUser(userId: string, event: string, data: unknown) {
    const room = `user:${userId}`;
    const isConnected = this.connectedUsers.has(userId);
    
    if (isConnected) {
      // Use room instead of socketId to support multiple devices
      const payload = typeof data === 'object' && data !== null
        ? { ...(data as Record<string, unknown>), timestamp: Date.now() }
        : { data, timestamp: Date.now() };
      
      this.server.to(room).emit(event, payload);
      this.logger.debug(`Sent ${event} to user ${userId}`);
    } else {
      this.logger.debug(`User ${userId} is not connected (event: ${event})`);
    }
  }

  // Method to send notification to a room
  sendToRoom(room: string, event: string, data: unknown) {
    this.server.to(room).emit(event, data);
  }

  // Method to broadcast to all connected users
  broadcast(event: string, data: unknown) {
    this.server.emit(event, data);
  }
}

