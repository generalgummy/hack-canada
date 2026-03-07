const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sellerType: {
      type: String,
      enum: ['hunter', 'supplier'],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: ['meat', 'grains', 'rice', 'vegetables', 'dry_rations', 'other'],
    },
    description: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide quantity'],
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'lbs', 'units', 'cases'],
      default: 'kg',
    },
    pricePerUnit: {
      type: Number,
      default: 0,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      trim: true,
    },
    expirationDate: {
      type: Date,
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'fulfilled', 'expired', 'cancelled'],
      default: 'available',
    },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    interestedParties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    quantityReserved: {
      type: Number,
      default: 0,
    },
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: quantity available
listingSchema.virtual('quantityAvailable').get(function () {
  return this.quantity - this.quantityReserved;
});

// TTL index on expirationDate — MongoDB auto-removes expired docs
listingSchema.index({ expirationDate: 1 }, { expireAfterSeconds: 0 });

// Indexes for common queries
listingSchema.index({ status: 1, category: 1 });
listingSchema.index({ seller: 1 });
listingSchema.index({ location: 'text', title: 'text' });

module.exports = mongoose.model('Listing', listingSchema);
