require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const Message = require('./models/Message');
const User = require('./models/User');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Northern Harvest API is running' });
});

// ==========================================
// Socket.io Authentication Middleware
// ==========================================
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name userType');
    if (!user) {
      return next(new Error('User not found'));
    }
    socket.user = { id: user._id.toString(), name: user.name, userType: user.userType };
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

// Track online users
const onlineUsers = new Map();

// ==========================================
// Socket.io Event Handlers
// ==========================================
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.name} (${socket.user.id})`);

  // Track online status
  onlineUsers.set(socket.user.id, socket.id);
  io.emit('user_online', { userId: socket.user.id, isOnline: true });

  // Update lastSeen
  User.findByIdAndUpdate(socket.user.id, { lastSeen: new Date() }).catch(() => {});

  // Join Room
  socket.on('join_room', ({ roomId }) => {
    socket.join(roomId);
    socket.emit('room_joined', { roomId });
    console.log(`${socket.user.name} joined room: ${roomId}`);
  });

  // Leave Room
  socket.on('leave_room', ({ roomId }) => {
    socket.leave(roomId);
    console.log(`${socket.user.name} left room: ${roomId}`);
  });

  // Send Message
  socket.on('send_message', async ({ roomId, content }) => {
    try {
      const message = await Message.create({
        roomId,
        sender: socket.user.id,
        content,
        messageType: 'text',
        readBy: [socket.user.id],
      });

      const populatedMessage = await Message.findById(message._id).populate(
        'sender',
        'name userType'
      );

      // Broadcast to all room members
      io.to(roomId).emit('receive_message', populatedMessage);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing Indicator
  socket.on('typing', ({ roomId, isTyping }) => {
    socket.to(roomId).emit('user_typing', {
      userId: socket.user.id,
      name: socket.user.name,
      isTyping,
    });
  });

  // Mark Read
  socket.on('mark_read', async ({ roomId }) => {
    try {
      await Message.updateMany(
        {
          roomId,
          sender: { $ne: socket.user.id },
          readBy: { $ne: socket.user.id },
        },
        { $addToSet: { readBy: socket.user.id } }
      );

      io.to(roomId).emit('messages_read', {
        roomId,
        userId: socket.user.id,
      });
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.name}`);
    onlineUsers.delete(socket.user.id);
    io.emit('user_online', { userId: socket.user.id, isOnline: false });
    User.findByIdAndUpdate(socket.user.id, { lastSeen: new Date() }).catch(() => {});
  });
});

// ==========================================
// Start Server
// ==========================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🌾 Northern Harvest server running on port ${PORT}`);
});
