const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    userType: {
      type: String,
      enum: ['hunter', 'community', 'supplier'],
      default: null, // Allow null for Auth0 users until they complete profile
    },
    phone: {
      type: String,
      required: [true, 'Please provide your phone number'],
      unique: true,
      trim: true,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      trim: true,
    },
    documentImageUrl: {
      type: String,
    },
    documentPublicId: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    
    // Auth0 Integration
    auth0Id: {
      type: String,
      sparse: true, // Allow null values, but enforce uniqueness where not null
      unique: true,
    },

    // Hunter-specific fields
    hunterLicenseNumber: {
      type: String,
      trim: true,
    },

    // Community-specific fields
    communitySize: {
      type: Number,
    },
    address: {
      type: String,
      trim: true,
    },
    organizationType: {
      type: String,
      enum: ['community', 'school', 'shelter', 'other'],
    },

    // Supplier-specific fields
    businessRegistrationNumber: {
      type: String,
      trim: true,
    },
    businessName: {
      type: String,
      trim: true,
    },
    supplyCategories: [
      {
        type: String,
        enum: ['meat', 'grains', 'rice', 'vegetables', 'dry_rations', 'other'],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
