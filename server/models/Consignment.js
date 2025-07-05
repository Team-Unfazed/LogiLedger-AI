import mongoose from 'mongoose';

const consignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  goodsType: {
    type: String,
    enum: ['electronics', 'textiles', 'machinery', 'food', 'raw_materials', 'other'],
    required: true
  },
  origin: {
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    },
    fullAddress: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  destination: {
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    },
    fullAddress: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'awarded', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  awardedBidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid'
  },
  awardedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  awardedAmount: {
    type: Number,
    min: 0
  },
  awardedAt: {
    type: Date
  },
  bidCount: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  specialRequirements: {
    type: String,
    trim: true
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
consignmentSchema.index({ companyId: 1, status: 1 });
consignmentSchema.index({ status: 1, isPublic: 1 });
consignmentSchema.index({ createdAt: -1 });

export default mongoose.model('Consignment', consignmentSchema); 