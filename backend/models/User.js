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
      required: [true, 'Please specify user type'],
      enum: ['hunter', 'community', 'supplier'],
    },
    phone: {
      type: String,
      trim: true,
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
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
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
