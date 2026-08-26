const mongoose = require('mongoose');

const PlantDetectionSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  cropName: {
    type: String,
    required: true
  },
  diseaseName: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Healthy', 'Diseased', 'Uncertain'],
    required: true
  },
  diseaseCategory: {
    type: String,
    enum: ['FUNGAL', 'BACTERIAL', 'VIRAL', 'PEST_RELATED', 'NUTRIENT_DEFICIENCY', 'HEALTHY', 'UNKNOWN'],
    default: 'UNKNOWN'
  },
  provider: {
    type: String,
    default: 'gemini'
  },
  isMock: {
    type: Boolean,
    default: false
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  severity: {
    type: String,
    enum: ['None', 'Low', 'Moderate', 'High'],
    default: 'None'
  },
  description: {
    type: String
  },
  possibleCauses: [{
    type: String
  }],
  recommendedTreatment: [{
    type: String
  }],
  preventionTips: [{
    type: String
  }],
  // For healthy plants
  recommendations: [{
    type: String
  }],
  message: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

PlantDetectionSchema.pre('save', function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('PlantDetection', PlantDetectionSchema);
