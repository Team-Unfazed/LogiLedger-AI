import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
  consignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consignment',
    required: true
  },
  bidderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bidderName: {
    type: String,
    required: true,
    trim: true
  },
  bidderCompany: {
    type: String,
    required: true,
    trim: true
  },
  bidderEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedDeliveryTime: {
    type: Number, // in days
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'awarded', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true
  },
  vehicleType: {
    type: String,
    trim: true
  },
  vehicleCapacity: {
    type: Number,
    min: 0
  },
  insurance: {
    type: Boolean,
    default: false
  },
  tracking: {
    type: Boolean,
    default: false
  },
  specialConditions: {
    type: String,
    trim: true
  },
  awardedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
bidSchema.index({ consignmentId: 1, status: 1 });
bidSchema.index({ bidderId: 1, status: 1 });
bidSchema.index({ createdAt: -1 });

// Ensure one bid per bidder per consignment
bidSchema.index({ consignmentId: 1, bidderId: 1 }, { unique: true });

export default mongoose.model('Bid', bidSchema); 