import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // In browser, connect to current host/port automatically
    socket = io({
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('⚡ Socket.IO connected with ID:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('⚡ Socket.IO disconnected:', reason);
    });
  }

  return socket;
}
