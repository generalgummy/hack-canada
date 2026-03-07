const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { signToken, protect } = require('../middleware/auth');
const { uploadDocument } = require('../config/cloudinary');

// POST /api/auth/register
router.post('/register', uploadDocument.single('documentImage'), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      userType,
      phone,
      location,
      // Hunter fields
      hunterLicenseNumber,
      // Community fields
      communitySize,
      address,
      organizationType,
      // Supplier fields
      businessRegistrationNumber,
      businessName,
      supplyCategories,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Build user object
    const userData = {
      name,
      email,
      password,
      userType,
      phone,
      location,
    };

    // Attach Cloudinary image if uploaded
    if (req.file) {
      userData.documentImageUrl = req.file.path;
      userData.documentPublicId = req.file.filename;
    }

    // Add type-specific fields
    if (userType === 'hunter') {
      userData.hunterLicenseNumber = hunterLicenseNumber;
    } else if (userType === 'community') {
      userData.communitySize = communitySize;
      userData.address = address;
      userData.organizationType = organizationType;
    } else if (userType === 'supplier') {
      userData.businessRegistrationNumber = businessRegistrationNumber;
      userData.businessName = businessName;
      if (supplyCategories) {
        userData.supplyCategories =
          typeof supplyCategories === 'string'
            ? JSON.parse(supplyCategories)
            : supplyCategories;
      }
    }

    const user = await User.create(userData);

    const token = signToken(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ token, user: userResponse });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update lastSeen
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user', error: error.message });
  }
});

// PUT /api/auth/me
router.put('/me', protect, uploadDocument.single('documentImage'), async (req, res) => {
  try {
    const updates = { ...req.body };

    // Don't allow password update through this route
    delete updates.password;
    delete updates.userType;

    // Handle supply categories
    if (updates.supplyCategories && typeof updates.supplyCategories === 'string') {
      updates.supplyCategories = JSON.parse(updates.supplyCategories);
    }

    // Handle Cloudinary image update
    if (req.file) {
      updates.documentImageUrl = req.file.path;
      updates.documentPublicId = req.file.filename;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
});

module.exports = router;
