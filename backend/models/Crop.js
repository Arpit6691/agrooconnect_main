const mongoose = require('mongoose');

const CropSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cropName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  price: { type: Number, required: true },
  quality: { type: String, enum: ['Premium', 'Standard', 'Low'], default: 'Standard' },
  description: { type: String },
  images: [{ type: String }],
  location: { type: String, required: true },
  harvestDate: { type: Date },
  status: { type: String, enum: ['Available', 'Sold Out', 'Hidden'], default: 'Available' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Crop', CropSchema);
