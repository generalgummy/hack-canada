const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const { protect, restrictTo } = require('../middleware/auth');

// GET /api/users/dashboard — Role-specific dashboard stats
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const userType = req.user.userType;
    let stats = {};

    if (userType === 'hunter' || userType === 'supplier') {
      const activeListings = await Listing.countDocuments({
        seller: userId,
        status: 'available',
      });
      const totalOrders = await Order.countDocuments({ seller: userId });
      const pendingOrders = await Order.countDocuments({
        seller: userId,
        status: 'pending',
      });
      const deliveredOrders = await Order.countDocuments({
        seller: userId,
        status: 'delivered',
      });

      const recentOrders = await Order.find({ seller: userId })
        .populate('buyer', 'name location')
        .populate('listing', 'title')
        .sort({ createdAt: -1 })
        .limit(5);

      const recentListings = await Listing.find({ seller: userId })
        .sort({ createdAt: -1 })
        .limit(5);

      stats = {
        activeListings,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        recentOrders,
        recentListings,
      };
    } else if (userType === 'community') {
      const totalOrders = await Order.countDocuments({ buyer: userId });
      const pendingDeliveries = await Order.countDocuments({
        buyer: userId,
        status: { $in: ['pending', 'confirmed', 'in_transit'] },
      });
      const completedOrders = await Order.countDocuments({
        buyer: userId,
        status: 'delivered',
      });
      const availableListings = await Listing.countDocuments({
        status: 'available',
      });

      const recentOrders = await Order.find({ buyer: userId })
        .populate('seller', 'name location')
        .populate('listing', 'title category')
        .sort({ createdAt: -1 })
        .limit(5);

      stats = {
        totalOrders,
        pendingDeliveries,
        completedOrders,
        availableListings,
        recentOrders,
      };
    }

    res.json({ stats, userType });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard', error: error.message });
  }
});

// GET /api/users/nearby — Find nearby hunters/suppliers
router.get('/nearby', protect, restrictTo('community'), async (req, res) => {
  try {
    const { location } = req.query;
    const searchLocation = location || req.user.location;

    if (!searchLocation) {
      return res.status(400).json({ message: 'Please provide a location' });
    }

    const users = await User.find({
      userType: { $in: ['hunter', 'supplier'] },
      location: { $regex: searchLocation, $options: 'i' },
      isActive: true,
      _id: { $ne: req.user._id },
    }).select('name location userType isVerified businessName supplyCategories');

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to find users', error: error.message });
  }
});

// GET /api/users/:id — Public profile
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'name email phone location userType isVerified businessName supplyCategories organizationType communitySize lastSeen createdAt'
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
});

module.exports = router;
