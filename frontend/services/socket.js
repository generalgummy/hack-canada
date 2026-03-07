import { io } from 'socket.io-client';

// ⚠️ Change this to your backend URL (same as api.js)
const SOCKET_URL = 'https://e6ef-192-159-180-156.ngrok-free.app';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.log('Socket connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
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
