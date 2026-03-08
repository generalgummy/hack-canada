import { io } from 'socket.io-client';

// Backend socket URL — set via EXPO_PUBLIC_API_URL env var, defaults to ngrok URL
const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://maile-inoculable-ares.ngrok-free.dev') + '/api';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  // Use the base API_URL, but replace 'https' with 'wss' and remove '/api' for socket connection
  const SOCKET_URL = API_URL.replace(/^http/, 'ws').replace(/\/api$/, '');

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
