const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadListingImages } = require('../config/cloudinary');

// GET /api/listings — Browse all available listings
router.get('/', protect, async (req, res) => {
  try {
    const { category, location, status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    else filter.status = 'available';
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const listings = await Listing.find(filter)
      .populate('seller', 'name location isVerified userType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Listing.countDocuments(filter);

    res.json({
      listings,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch listings', error: error.message });
  }
});

// GET /api/listings/mine — Seller's own listings
router.get('/mine', protect, restrictTo('hunter', 'supplier'), async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ listings });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch listings', error: error.message });
  }
});

// GET /api/listings/:id — Single listing
router.get('/:id', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name location isVerified userType phone')
      .populate('interestedParties', 'name location organizationType');
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json({ listing });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch listing', error: error.message });
  }
});

// POST /api/listings — Create listing
router.post(
  '/',
  protect,
  restrictTo('hunter', 'supplier'),
  uploadListingImages.array('images', 4),
  async (req, res) => {
    try {
      const {
        title,
        category,
        description,
        quantity,
        unit,
        pricePerUnit,
        isFree,
        location,
        expirationDate,
        availableFrom,
        tags,
      } = req.body;

      const listingData = {
        seller: req.user._id,
        sellerType: req.user.userType,
        title,
        category,
        description,
        quantity: parseFloat(quantity),
        unit,
        pricePerUnit: parseFloat(pricePerUnit) || 0,
        isFree: isFree === 'true' || isFree === true,
        location: location || req.user.location,
        expirationDate,
        availableFrom,
      };

      // Handle image uploads
      if (req.files && req.files.length > 0) {
        listingData.images = req.files.map((file) => ({
          url: file.path,
          publicId: file.filename,
        }));
      }

      // Handle tags
      if (tags) {
        listingData.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      }

      const listing = await Listing.create(listingData);
      await listing.populate('seller', 'name location isVerified userType');

      res.status(201).json({ listing });
    } catch (error) {
      console.error('Create listing error:', error);
      res.status(500).json({ message: 'Failed to create listing', error: error.message });
    }
  }
);

// PUT /api/listings/:id — Update listing (owner only)
router.put('/:id', protect, uploadListingImages.array('images', 4), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    const updates = { ...req.body };

    // Handle numeric fields
    if (updates.quantity) updates.quantity = parseFloat(updates.quantity);
    if (updates.pricePerUnit) updates.pricePerUnit = parseFloat(updates.pricePerUnit);
    if (updates.isFree !== undefined) updates.isFree = updates.isFree === 'true' || updates.isFree === true;

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));
      updates.images = [...(listing.images || []), ...newImages];
    }

    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = JSON.parse(updates.tags);
    }

    const updatedListing = await Listing.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('seller', 'name location isVerified userType');

    res.json({ listing: updatedListing });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update listing', error: error.message });
  }
});

// DELETE /api/listings/:id — Remove listing (owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    await Listing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Listing removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete listing', error: error.message });
  }
});

// POST /api/listings/:id/interest — Community expresses interest
router.post('/:id/interest', protect, restrictTo('community'), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if already interested
    if (listing.interestedParties.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already expressed interest' });
    }

    listing.interestedParties.push(req.user._id);
    await listing.save();

    res.json({ message: 'Interest expressed', listing });
  } catch (error) {
    res.status(500).json({ message: 'Failed to express interest', error: error.message });
  }
});

module.exports = router;
