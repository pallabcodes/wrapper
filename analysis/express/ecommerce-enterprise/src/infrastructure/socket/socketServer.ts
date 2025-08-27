import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '@/core/utils/logger';
import { env } from '@/core/config/env';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const setupSocketIO = (io: SocketIOServer): void => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      
      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('Client connected', { 
      socketId: socket.id, 
      userId: socket.userId,
      userRole: socket.userRole 
    });

    // Join user to their personal room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      
      // Join admin room if user is admin
      if (socket.userRole === 'ADMIN') {
        socket.join('admin');
      }
    }

    // Chat room functionality
    socket.on('join-chat', (roomId: string) => {
      socket.join(`chat:${roomId}`);
      logger.info('User joined chat room', { 
        socketId: socket.id, 
        userId: socket.userId, 
        roomId 
      });
    });

    socket.on('leave-chat', (roomId: string) => {
      socket.leave(`chat:${roomId}`);
      logger.info('User left chat room', { 
        socketId: socket.id, 
        userId: socket.userId, 
        roomId 
      });
    });

    socket.on('chat-message', (data: { roomId: string; message: string }) => {
      io.to(`chat:${data.roomId}`).emit('new-message', {
        userId: socket.userId,
        message: data.message,
        timestamp: new Date().toISOString()
      });
    });

    // Order updates
    socket.on('subscribe-order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      logger.info('User subscribed to order updates', { 
        socketId: socket.id, 
        userId: socket.userId, 
        orderId 
      });
    });

    // Inventory updates
    socket.on('subscribe-inventory', (productId: string) => {
      socket.join(`inventory:${productId}`);
      logger.info('User subscribed to inventory updates', { 
        socketId: socket.id, 
        userId: socket.userId, 
        productId 
      });
    });

    // Disconnect handling
    socket.on('disconnect', (reason) => {
      logger.info('Client disconnected', { 
        socketId: socket.id, 
        userId: socket.userId, 
        reason 
      });
    });
  });

  // Export socket server for use in other modules
  (global as any).socketIO = io;
};

// Helper functions for emitting events from other parts of the application
export const emitToUser = (userId: string, event: string, data: any): void => {
  const io = (global as any).socketIO;
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToRoom = (room: string, event: string, data: any): void => {
  const io = (global as any).socketIO;
  if (io) {
    io.to(room).emit(event, data);
  }
};

export const emitToAdmin = (event: string, data: any): void => {
  const io = (global as any).socketIO;
  if (io) {
    io.to('admin').emit(event, data);
  }
};

export const emitToAll = (event: string, data: any): void => {
  const io = (global as any).socketIO;
  if (io) {
    io.emit(event, data);
  }
};
