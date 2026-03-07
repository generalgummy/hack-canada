const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quantityRequested: {
      type: Number,
      required: [true, 'Please specify quantity'],
      min: 1,
    },
    unit: {
      type: String,
      enum: ['kg', 'lbs', 'units', 'cases'],
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
    deliveryAddress: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    estimatedDelivery: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    chatRoomId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-append to statusHistory on status change
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: this._statusNote || `Status changed to ${this.status}`,
    });
  }
  next();
});

orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ seller: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
