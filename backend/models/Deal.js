const mongoose = require('mongoose');

const DealSchema = new mongoose.Schema({
  cropId: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', required: true },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  traderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  finalPrice: { type: Number, required: true },
  totalAmount: { type: Number },
  quantity: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Accepted', 'Processing', 'Pickup Scheduled', 'In Transit', 'Delivered', 'Payment Pending', 'Completed', 'Cancelled', 'Disputed'], 
    default: 'Accepted' 
  },
  
  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String }
  }],

  transportation: {
    arrangedBy: { type: String, enum: ['Farmer', 'Trader', 'Platform', 'Not Set'], default: 'Not Set' },
    driverName: { type: String },
    vehicleNumber: { type: String },
    trackingId: { type: String },
    currentLocation: { type: String },
    pickupDate: { type: Date },
    estimatedDelivery: { type: Date }
  },

  payment: {
    status: { type: String, enum: ['Pending', 'Verification Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
    method: { type: String, enum: ['Cash', 'Bank Transfer', 'UPI', 'Not Set'], default: 'Not Set' },
    transactionId: { type: String },
    proofUrl: { type: String },
    verifiedAt: { type: Date }
  },

  farmerConfirmation: { type: Boolean, default: false },
  traderConfirmation: { type: Boolean, default: false },

  auditLog: [{
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    details: { type: String }
  }],

  cancellationReason: { type: String },
  disputeReason: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware to automatically push to statusHistory and auditLog on creation
DealSchema.pre('save', function(next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: 'Accepted',
      timestamp: new Date(),
      note: 'Deal originally accepted'
    });
    this.auditLog.push({
      action: 'DEAL_CREATED',
      timestamp: new Date(),
      details: 'Deal initialized in Accepted state'
    });
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Deal', DealSchema);
