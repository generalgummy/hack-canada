const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// GET /api/chat — List all chat rooms for current user
router.get('/', protect, async (req, res) => {
  try {
    // Find all orders where user is buyer or seller
    const orders = await Order.find({
      $or: [{ buyer: req.user._id }, { seller: req.user._id }],
      chatRoomId: { $exists: true, $ne: null },
    })
      .populate('listing', 'title category')
      .populate('buyer', 'name')
      .populate('seller', 'name')
      .select('chatRoomId listing buyer seller status');

    // For each order/room, get last message and unread count
    const chatRooms = await Promise.all(
      orders.map(async (order) => {
        const lastMessage = await Message.findOne({ roomId: order.chatRoomId })
          .sort({ createdAt: -1 })
          .populate('sender', 'name');

        const unreadCount = await Message.countDocuments({
          roomId: order.chatRoomId,
          readBy: { $ne: req.user._id },
          sender: { $ne: req.user._id },
        });

        const otherParty =
          order.buyer._id.toString() === req.user._id.toString()
            ? order.seller
            : order.buyer;

        return {
          roomId: order.chatRoomId,
          orderId: order._id,
          listingTitle: order.listing?.title || 'Unknown Listing',
          listingCategory: order.listing?.category,
          otherParty,
          orderStatus: order.status,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                senderName: lastMessage.sender?.name,
                timestamp: lastMessage.createdAt,
              }
            : null,
          unreadCount,
        };
      })
    );

    // Sort by last message timestamp
    chatRooms.sort((a, b) => {
      const aTime = a.lastMessage?.timestamp || 0;
      const bTime = b.lastMessage?.timestamp || 0;
      return new Date(bTime) - new Date(aTime);
    });

    res.json({ chatRooms });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chats', error: error.message });
  }
});

// GET /api/chat/:roomId — Load message history
router.get('/:roomId', protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is a member of this chat room
    const order = await Order.findOne({
      chatRoomId: roomId,
      $or: [{ buyer: req.user._id }, { seller: req.user._id }],
    });

    if (!order) {
      return res.status(403).json({ message: 'Not a member of this chat room' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ roomId, isDeleted: false })
      .populate('sender', 'name userType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        roomId,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } }
    );

    const total = await Message.countDocuments({ roomId, isDeleted: false });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
});

module.exports = router;
