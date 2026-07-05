const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
  cropId: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', required: true },
  traderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offeredPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected', 'Countered', 'Expired', 'Cancelled'], default: 'Pending' },
  negotiationHistory: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    price: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Offer', OfferSchema);
