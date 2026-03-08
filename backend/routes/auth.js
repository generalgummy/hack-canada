const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { signToken, protect } = require('../middleware/auth');
const { uploadDocument, uploadToCloudinary, getDocumentFolder } = require('../config/cloudinary');

// POST /api/auth/register
router.post('/register', (req, res, next) => {
  // If it's a multipart request, use multer; otherwise skip to next
  if (req.headers['content-type']?.includes('multipart')) {
    uploadDocument.single('documentImage')(req, res, next);
  } else {
    next();
  }
}, async (req, res) => {
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
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }

    // Also check email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
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
      try {
        const folder = getDocumentFolder(userType);
        const result = await uploadToCloudinary(req.file.buffer, folder);
        userData.documentImageUrl = result.secure_url;
        userData.documentPublicId = result.public_id;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        // Continue registration without image rather than failing
      }
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

    // Generate OTP and send to phone
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save({ validateBeforeSave: false });

    console.log(`\n📲 OTP for ${user.phone}: ${otp}\n`);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.otpExpires;

    res.status(201).json({ userId: user._id, phone: user.phone, message: 'OTP sent to your phone' });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field === 'phone' ? 'Phone number' : 'Email'} already registered` });
    }
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// POST /api/auth/login — Step 1: verify email + password, send OTP
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Admin users skip OTP — return token directly
    if (user.isAdmin) {
      user.lastSeen = new Date();
      await user.save({ validateBeforeSave: false });
      const token = signToken(user);
      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.otp;
      delete userResponse.otpExpires;
      return res.json({ token, user: userResponse, isAdmin: true });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save({ validateBeforeSave: false });

    console.log(`\n📲 OTP for ${user.phone}: ${otp}\n`);

    res.json({ userId: user._id, phone: user.phone, message: 'OTP sent to your phone' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// POST /api/auth/verify-otp — Step 2: verify OTP and return token
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'Please provide userId and OTP' });
    }

    const user = await User.findById(userId).select('+otp +otpExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ message: 'No OTP requested. Please login again.' });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Clear OTP and mark phone as verified
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isPhoneVerified = true;
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user);

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.otpExpires;

    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'OTP verification failed', error: error.message });
  }
});

// POST /api/auth/resend-otp — Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Please provide userId' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    console.log(`\n📲 Resent OTP for ${user.phone}: ${otp}\n`);

    res.json({ message: 'OTP resent to your phone' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
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

// PUT /api/auth/upload-document — upload document image after registration
router.put('/upload-document', protect, uploadDocument.single('documentImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No document image provided' });
    }

    const folder = getDocumentFolder(req.user.userType);
    const result = await uploadToCloudinary(req.file.buffer, folder);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        documentImageUrl: result.secure_url,
        documentPublicId: result.public_id,
      },
      { new: true }
    );

    console.log('✅ Document uploaded to Cloudinary');
    res.json({ user });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ message: 'Document upload failed', error: error.message });
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
      try {
        const folder = getDocumentFolder(req.user.userType);
        const result = await uploadToCloudinary(req.file.buffer, folder);
        updates.documentImageUrl = result.secure_url;
        updates.documentPublicId = result.public_id;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
      }
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
