const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const { signToken, protect } = require('../middleware/auth');
const { uploadDocument, uploadToCloudinary, getDocumentFolder } = require('../config/cloudinary');

const auth0Domain = process.env.AUTH0_DOMAIN || 'dev-aq644xrnfatz30d7.us.auth0.com';
const auth0ClientId = process.env.AUTH0_CLIENT_ID || 'o5vVpDqIsPH0zIwCP6prstxN40Uh5Ukq';
const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET || 'Z5XL3OQoYLGlMO3NVd5lqL_aGM4Kx8NWhsKRom7LdcujYWdBLblGSy9Y_ZS1s3Cq';
const redirectUrl = process.env.AUTH0_REDIRECT_URL || 'exp://localhost:19000/callback';

/**
 * POST /api/auth/auth0/callback
 * Exchange Auth0 authorization code for tokens
 */
router.post('/auth0/callback', async (req, res) => {
  try {
    const { code, connection, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code required' });
    }

    if (!redirectUri) {
      return res.status(400).json({ message: 'Redirect URI required' });
    }

    console.log('🔐 Auth0 callback: exchanging code for token');
    console.log('🔐 Using redirect_uri:', redirectUri);

    // Exchange authorization code for tokens
    const tokenResponse = await axios.post(`https://${auth0Domain}/oauth/token`, {
      client_id: auth0ClientId,
      client_secret: auth0ClientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const { access_token, id_token } = tokenResponse.data;

    // Get user info from Auth0
    const userInfoResponse = await axios.get(`https://${auth0Domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const auth0User = userInfoResponse.data;
    console.log('🔐 Auth0 user info:', { email: auth0User.email, name: auth0User.name, sub: auth0User.sub });

    // Find or create user in MongoDB
    let user = await User.findOne({ email: auth0User.email });
    let isNewUser = false;

    if (!user) {
      // Create new user from Auth0 info
      // NOTE: userType is intentionally NOT set for new Auth0 users
      // They must complete their profile first
      const userData = {
        name: auth0User.name || auth0User.email,
        email: auth0User.email,
        password: 'auth0_' + auth0User.sub, // Placeholder password (not used for Auth0)
        // userType is NOT SET - user must complete profile first
        phone: auth0User.phone_number || 'auth0_' + auth0User.sub, // Placeholder phone
        auth0Id: auth0User.sub,
        isPhoneVerified: false, // Auth0 email is verified, but we need phone verification
        documentImageUrl: auth0User.picture, // Use Auth0 profile picture
      };

      user = await User.create(userData);
      isNewUser = true;
      console.log('✅ New user created from Auth0:', user._id);
    } else {
      // Update existing user with Auth0 info if needed
      if (!user.auth0Id) {
        user.auth0Id = auth0User.sub;
        if (!user.documentImageUrl && auth0User.picture) {
          user.documentImageUrl = auth0User.picture;
        }
        await user.save();
      }
    }

    // Generate JWT token
    const token = signToken(user);

    const userResponse = user.toObject();
    delete userResponse.password;
    // Add flag to indicate if this is a new user who needs profile completion
    userResponse.isNewUser = isNewUser;

    res.json({
      token,
      user: userResponse,
      message: 'Auth0 authentication successful',
    });
  } catch (error) {
    console.error('❌ Auth0 callback error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      stack: error.stack,
    });
    res.status(500).json({
      message: 'Auth0 authentication failed',
      error: error.message,
      details: error.response?.data,
    });
  }
});

/**
 * POST /api/auth/auth0/passwordless/start
 * Start passwordless authentication flow
 */
router.post('/auth0/passwordless/start', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }

    console.log('🔐 Starting Auth0 passwordless flow for:', email);

    // Call Auth0 passwordless API
    const response = await axios.post(`https://${auth0Domain}/passwordless/start`, {
      client_id: auth0ClientId,
      connection: 'email', // Email connection for passwordless
      email,
      send: 'code', // Send OTP code
    });

    console.log('✅ Passwordless challenge sent');

    res.json({
      message: 'Passwordless challenge sent to email',
      data: response.data,
    });
  } catch (error) {
    console.error('Passwordless start error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to start passwordless flow',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/auth0/passwordless/verify
 * Verify passwordless OTP
 */
router.post('/auth0/passwordless/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP required' });
    }

    console.log('🔐 Verifying passwordless OTP for:', email);

    // Exchange OTP for tokens
    const tokenResponse = await axios.post(`https://${auth0Domain}/oauth/token`, {
      client_id: auth0ClientId,
      client_secret: auth0ClientSecret,
      username: email,
      otp,
      realm: 'email', // Passwordless email realm
      grant_type: 'http://auth0.com/oauth/grant-type/passwordless/otp',
      scope: 'openid profile email',
    });

    const { id_token } = tokenResponse.data;

    // Decode JWT to get user info (without verification for now)
    const parts = id_token.split('.');
    const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    console.log('✅ Passwordless OTP verified for:', decoded.email);

    // Find or create user
    let user = await User.findOne({ email: decoded.email });

    if (!user) {
      const userData = {
        name: decoded.name || decoded.email,
        email: decoded.email,
        password: 'auth0_passwordless_' + decoded.sub,
        userType: 'hunter', // Default
        phone: 'auth0_' + decoded.sub,
        auth0Id: decoded.sub,
        isPhoneVerified: true,
      };

      user = await User.create(userData);
      console.log('✅ New passwordless user created:', user._id);
    } else if (!user.auth0Id) {
      user.auth0Id = decoded.sub;
      user.isPhoneVerified = true;
      await user.save();
    }

    // Generate our JWT token
    const token = signToken(user);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      token,
      user: userResponse,
      message: 'Passwordless authentication successful',
    });
  } catch (error) {
    console.error('Passwordless verify error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'OTP verification failed',
      error: error.message,
    });
  }
});

/**
 * PUT /api/auth/complete-profile
 * Complete Auth0 user profile with additional information
 */
router.put('/complete-profile', protect, uploadDocument.single('documentImage'), async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      userType,
      location,
      phone,
      hunterLicenseNumber,
      organizationType,
      communitySize,
      address,
      businessName,
      businessRegistrationNumber,
    } = req.body;

    console.log('🔐 Completing profile for user:', userId);
    console.log('📝 Profile data received:', { userType, location, phone, organizationType, communitySize, address, businessName, businessRegistrationNumber });

    // Validate required fields
    if (!userType) {
      console.warn('❌ Validation failed: userType missing');
      return res.status(400).json({ message: 'User type is required' });
    }
    if (!phone) {
      console.warn('❌ Validation failed: phone missing');
      return res.status(400).json({ message: 'Phone number is required' });
    }
    if (!location) {
      console.warn('❌ Validation failed: location missing');
      return res.status(400).json({ message: 'Location is required' });
    }

    const updateData = {
      userType,
      location,
      phone: phone.trim(),
      isPhoneVerified: true, // Mark as verified when completing profile
    };

    // Add type-specific fields
    if (userType === 'hunter') {
      if (!hunterLicenseNumber) {
        console.warn('❌ Validation failed: hunterLicenseNumber missing for hunter');
        return res.status(400).json({ message: 'Hunter license number is required' });
      }
      updateData.hunterLicenseNumber = hunterLicenseNumber.trim();
    } else if (userType === 'community') {
      console.log('👥 Validating community fields:', { organizationType, communitySize, address });
      if (!organizationType || !communitySize || !address) {
        console.warn('❌ Validation failed: missing community fields', { organizationType, communitySize, address });
        return res.status(400).json({ message: 'Organization type, community size, and address are required for community' });
      }
      updateData.organizationType = organizationType;
      updateData.communitySize = parseInt(communitySize) || 0;
      updateData.address = address.trim();
    } else if (userType === 'supplier') {
      console.log('🏭 Validating supplier fields:', { businessName, businessRegistrationNumber, address });
      if (!businessName || !businessRegistrationNumber || !address) {
        console.warn('❌ Validation failed: missing supplier fields', { businessName, businessRegistrationNumber, address });
        return res.status(400).json({ message: 'Business name, registration number, and address are required for supplier' });
      }
      updateData.businessName = businessName.trim();
      updateData.businessRegistrationNumber = businessRegistrationNumber.trim();
      updateData.address = address.trim();
    }

    // Handle document image upload
    if (req.file) {
      try {
        console.log('📸 Uploading document image...');
        const folder = getDocumentFolder(userType);
        const result = await uploadToCloudinary(req.file.buffer, folder);
        updateData.documentImageUrl = result.secure_url;
        updateData.documentPublicId = result.public_id;
        console.log('✅ Document image uploaded:', result.public_id);
      } catch (uploadError) {
        console.error('Document upload error:', uploadError.message);
        return res.status(500).json({
          message: 'Failed to upload document image',
          error: uploadError.message,
        });
      }
    }

    // Update user
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

    console.log('✅ Profile completed for user:', user._id);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      user: userResponse,
      message: 'Profile completed successfully',
    });
  } catch (error) {
    console.error('Complete profile error:', error.message);
    res.status(500).json({
      message: 'Failed to complete profile',
      error: error.message,
    });
  }
});

module.exports = router;
