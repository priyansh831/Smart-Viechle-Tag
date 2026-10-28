import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    pingInterval: 10000,
    pingTimeout: 5000
  });

  io.on('connection', (socket: Socket) => {
    // Join dashboard room to receive all live vehicle notifications
    socket.on('join:dashboard', (data?: { userId?: string }) => {
      socket.join('dashboard');
      if (data?.userId) {
        socket.join(`user_${data.userId}`);
      }
    });

    // Join specific vehicle tag room (bystander or owner monitoring specific tag)
    socket.on('join:tag', (tagId: string) => {
      if (tagId) {
        socket.join(`tag_${tagId}`);
      }
    });

    socket.on('leave:tag', (tagId: string) => {
      if (tagId) {
        socket.leave(`tag_${tagId}`);
      }
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Broadcast when a new emergency alert is submitted & processed by Gemini
 */
export function broadcastNewAlert(alert: any) {
  if (!io) return;
  // Broadcast to global dashboard
  io.to('dashboard').emit('alert:new', alert);

  // Broadcast to owner's specific room if associated
  if (alert.ownerId) {
    io.to(`user_${alert.ownerId}`).emit('alert:new', alert);
  }

  // Also broadcast to the tag room
  if (alert.tagId) {
    io.to(`tag_${alert.tagId}`).emit('alert:new', alert);
  }
}

/**
 * Broadcast when vehicle owner replies or updates status
 */
export function broadcastAlertReply(alert: any) {
  if (!io) return;
  io.to('dashboard').emit('alert:reply', alert);
  if (alert.tagId) {
    io.to(`tag_${alert.tagId}`).emit('alert:reply', alert);
  }
  if (alert.ownerId) {
    io.to(`user_${alert.ownerId}`).emit('alert:reply', alert);
  }
}

/**
 * Broadcast when alert status changes (e.g. acknowledged or resolved)
 */
export function broadcastAlertUpdate(alert: any) {
  if (!io) return;
  io.to('dashboard').emit('alert:update', alert);
  if (alert.tagId) {
    io.to(`tag_${alert.tagId}`).emit('alert:update', alert);
  }
  if (alert.ownerId) {
    io.to(`user_${alert.ownerId}`).emit('alert:update', alert);
  }
}
