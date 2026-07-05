const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', ReviewSchema);
