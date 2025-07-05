import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  consignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consignment',
    required: true
  },
  bidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  origin: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'in_transit', 'delivered', 'completed', 'cancelled'],
    default: 'assigned'
  },
  estimatedDeliveryDate: {
    type: Date,
    required: true
  },
  actualDeliveryDate: {
    type: Date
  },
  pickupDate: {
    type: Date
  },
  deliveryDate: {
    type: Date
  },
  invoiceAmount: {
    type: Number,
    min: 0
  },
  invoiceNumber: {
    type: String,
    trim: true
  },
  invoiceFile: {
    type: String, // URL to uploaded file
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentDate: {
    type: Date
  },
  trackingNumber: {
    type: String,
    trim: true
  },
  notes: {
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
jobSchema.index({ companyId: 1, status: 1 });
jobSchema.index({ transporterId: 1, status: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ createdAt: -1 });

export default mongoose.model('Job', jobSchema); 