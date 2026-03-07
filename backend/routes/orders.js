const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const { protect, restrictTo } = require('../middleware/auth');

// POST /api/orders — Place order (community only)
router.post('/', protect, restrictTo('community'), async (req, res) => {
  try {
    const { listingId, quantityRequested, deliveryAddress, notes } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listing.status !== 'available') {
      return res.status(400).json({ message: 'Listing is no longer available' });
    }

    const available = listing.quantity - listing.quantityReserved;
    if (quantityRequested > available) {
      return res.status(400).json({
        message: `Only ${available} ${listing.unit} available`,
      });
    }

    // Generate chatRoomId
    const chatRoomId = `order_${listing._id}_${req.user._id}`;

    const totalPrice = listing.isFree ? 0 : listing.pricePerUnit * quantityRequested;

    const order = await Order.create({
      listing: listing._id,
      buyer: req.user._id,
      seller: listing.seller,
      quantityRequested,
      unit: listing.unit,
      totalPrice,
      deliveryAddress: deliveryAddress || req.user.address,
      notes,
      chatRoomId,
      status: 'pending',
    });

    // Reserve quantity on listing
    listing.quantityReserved += quantityRequested;
    if (listing.quantityReserved >= listing.quantity) {
      listing.status = 'reserved';
    }
    await listing.save();

    await order.populate('listing', 'title category images');
    await order.populate('buyer', 'name location');
    await order.populate('seller', 'name location');

    res.status(201).json({ order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

// GET /api/orders/mine — All orders for current user
router.get('/mine', protect, async (req, res) => {
  try {
    const { status, role } = req.query;

    let filter = {};
    if (req.user.userType === 'community') {
      filter.buyer = req.user._id;
    } else {
      // For hunter/supplier, show orders where they're the seller
      if (role === 'buyer') {
        filter.buyer = req.user._id;
      } else {
        filter.seller = req.user._id;
      }
    }

    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('listing', 'title category images pricePerUnit unit')
      .populate('buyer', 'name location organizationType')
      .populate('seller', 'name location userType')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// GET /api/orders/:id — Single order
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('listing', 'title category description images pricePerUnit unit quantity')
      .populate('buyer', 'name location phone organizationType')
      .populate('seller', 'name location phone userType');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only buyer or seller can view
    const userId = req.user._id.toString();
    if (
      order.buyer._id.toString() !== userId &&
      order.seller._id.toString() !== userId
    ) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
});

// PUT /api/orders/:id/status — Update order status (seller only)
router.put('/:id/status', protect, restrictTo('hunter', 'supplier'), async (req, res) => {
  try {
    const { status, note, estimatedDelivery } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the seller can update order status' });
    }

    // Validate status transitions
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['in_transit', 'cancelled'],
      in_transit: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from ${order.status} to ${status}`,
      });
    }

    order.status = status;
    if (note) order._statusNote = note; // passed to pre-save hook
    if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
    if (status === 'delivered') order.deliveredAt = new Date();

    // If cancelled, restore quantity on listing
    if (status === 'cancelled') {
      const listing = await Listing.findById(order.listing);
      if (listing) {
        listing.quantityReserved = Math.max(
          0,
          listing.quantityReserved - order.quantityRequested
        );
        if (listing.status === 'reserved') listing.status = 'available';
        await listing.save();
      }
    }

    // If delivered, mark listing fulfilled if all quantity delivered
    if (status === 'delivered') {
      const listing = await Listing.findById(order.listing);
      if (listing && listing.quantityReserved >= listing.quantity) {
        listing.status = 'fulfilled';
        await listing.save();
      }
    }

    await order.save();

    await order.populate('listing', 'title category');
    await order.populate('buyer', 'name location');
    await order.populate('seller', 'name location');

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
});

// DELETE /api/orders/:id — Cancel order (community/buyer only)
router.delete('/:id', protect, restrictTo('community'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending orders' });
    }

    // Restore quantity on listing
    const listing = await Listing.findById(order.listing);
    if (listing) {
      listing.quantityReserved = Math.max(
        0,
        listing.quantityReserved - order.quantityRequested
      );
      if (listing.status === 'reserved') listing.status = 'available';
      await listing.save();
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ message: 'Order cancelled', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
});

module.exports = router;
