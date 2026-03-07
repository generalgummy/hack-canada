import { io } from 'socket.io-client';

// Backend socket URL — set via EXPO_PUBLIC_API_URL env var, defaults to localhost
const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    // connected
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
  });

  socket.on('disconnect', () => {
    // disconnected
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export default { connectSocket, disconnectSocket, getSocket };
