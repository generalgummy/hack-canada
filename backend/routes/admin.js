const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const Message = require('../models/Message');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require authentication + admin privileges
router.use(protect, adminOnly);

// ==========================================
// Dashboard Stats
// ==========================================
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      hunters,
      communities,
      suppliers,
      totalListings,
      activeListings,
      totalOrders,
      pendingOrders,
      totalMessages,
      recentUsers,
      recentListings,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ userType: 'hunter' }),
      User.countDocuments({ userType: 'community' }),
      User.countDocuments({ userType: 'supplier' }),
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'available' }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Message.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email userType createdAt isActive'),
      Listing.find().sort({ createdAt: -1 }).limit(5).populate('seller', 'name').select('title category status createdAt'),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('buyer', 'name').populate('seller', 'name').select('status totalPrice createdAt'),
    ]);

    res.json({
      users: { total: totalUsers, active: activeUsers, hunters, communities, suppliers },
      listings: { total: totalListings, active: activeListings },
      orders: { total: totalOrders, pending: pendingOrders },
      messages: { total: totalMessages },
      recent: { users: recentUsers, listings: recentListings, orders: recentOrders },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

// ==========================================
// User Management
// ==========================================

// GET all users (with search/filter)
router.get('/users', async (req, res) => {
  try {
    const { search, userType, page = 1, limit = 20 } = req.query;
    const query = {};

    if (userType) query.userType = userType;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-password -otp -otpExpires');

    const total = await User.countDocuments(query);

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// GET single user
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -otp -otpExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
});

// PUT update user info (admin can change name, email, phone, userType, isActive, etc.)
router.put('/users/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    // Don't let admin set password through this route (use reset-password)
    delete updates.password;
    delete updates.isAdmin; // Prevent privilege escalation through this route

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password -otp -otpExpires');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user, message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
});

// PUT reset user password
router.put('/users/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save({ validateBeforeSave: false });

    res.json({ message: `Password reset successfully for ${user.name}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
});

// DELETE user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isAdmin) return res.status(400).json({ message: 'Cannot delete an admin account' });

    // Also clean up user's listings and orders
    await Listing.deleteMany({ seller: user._id });
    await Order.deleteMany({ $or: [{ buyer: user._id }, { seller: user._id }] });
    await User.findByIdAndDelete(user._id);

    res.json({ message: `User "${user.name}" and related data deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

// ==========================================
// Listing Management
// ==========================================

// GET all listings
router.get('/listings', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const listings = await Listing.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('seller', 'name email userType');

    const total = await Listing.countDocuments(query);

    res.json({ listings, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch listings', error: error.message });
  }
});

// DELETE listing
router.delete('/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    // Cancel related pending orders
    await Order.updateMany(
      { listing: listing._id, status: 'pending' },
      { status: 'cancelled' }
    );

    await Listing.findByIdAndDelete(listing._id);
    res.json({ message: `Listing "${listing.title}" deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete listing', error: error.message });
  }
});

// ==========================================
// Order Management
// ==========================================

// GET all orders
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .populate('listing', 'title');

    const total = await Order.countDocuments(query);

    res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// ==========================================
// Admin Messaging (contact any user)
// ==========================================
router.post('/message', async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    if (!recipientId || !content) {
      return res.status(400).json({ message: 'recipientId and content are required' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

    // Create a chat room ID (sorted user IDs)
    const ids = [req.user._id.toString(), recipientId].sort();
    const roomId = `${ids[0]}_${ids[1]}`;

    const message = await Message.create({
      roomId,
      sender: req.user._id,
      content,
      messageType: 'text',
      readBy: [req.user._id],
    });

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name userType');

    res.status(201).json({ message: populatedMessage, roomId });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
});

module.exports = router;
