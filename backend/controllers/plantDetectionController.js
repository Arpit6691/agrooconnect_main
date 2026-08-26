const PlantDetection = require('../models/PlantDetection');
const detector = require('../services/plantDiseaseDetector');
const fs = require('fs');
const path = require('path');

/**
 * Helper: Remove uploaded file on failure (cleanup)
 */
const cleanupFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('File cleanup error:', err.message);
  }
};

// @desc    Analyze a plant image for disease detection
// @route   POST /api/plant-detection
// @access  Private (Farmer only)
exports.analyzeImage = async (req, res) => {
  const uploadedFilePath = req.file ? req.file.path : null;

  try {
    // Validate that a file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image file'
      });
    }

    // Build the image URL using dynamic host
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

    // Run the detection service
    const result = await detector.detect({
      filename: req.file.filename,
      filePath: req.file.path,
      path: req.file.path,
      mimetype: req.file.mimetype
    });

    if (!result || !result.success) {
      cleanupFile(uploadedFilePath);
      return res.status(500).json({
        success: false,
        error: 'Disease detection analysis failed. Please try again.'
      });
    }

    // Save detection record to database
    const detection = await PlantDetection.create({
      farmerId: req.user.id,
      imageUrl,
      cropName: result.cropName,
      diseaseName: result.diseaseName,
      diseaseCategory: result.diseaseCategory || 'UNKNOWN',
      provider: result.provider || 'gemini',
      isMock: result.isMock || false,
      status: result.status,
      confidence: result.confidence,
      severity: result.severity,
      description: result.description,
      possibleCauses: result.possibleCauses,
      recommendedTreatment: result.recommendedTreatment,
      preventionTips: result.preventionTips,
      recommendations: result.recommendations,
      message: result.message
    });

    res.status(201).json({
      success: true,
      provider: result.provider,
      mock: result.isMock || false,
      data: detection
    });
  } catch (err) {
    // Clean up the uploaded file if DB save or detection fails
    cleanupFile(uploadedFilePath);
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all detection records for the logged-in farmer
// @route   GET /api/plant-detection
// @access  Private (Farmer only)
exports.getMyDetections = async (req, res) => {
  try {
    const detections = await PlantDetection.find({ farmerId: req.user.id })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: detections.length,
      data: detections
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get a single detection record
// @route   GET /api/plant-detection/:id
// @access  Private (Farmer only — own records only)
exports.getDetection = async (req, res) => {
  try {
    const detection = await PlantDetection.findById(req.params.id);

    if (!detection) {
      return res.status(404).json({ success: false, error: 'Detection record not found' });
    }

    // Ensure the farmer can only view their own records
    if (detection.farmerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this record' });
    }

    res.status(200).json({ success: true, data: detection });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete a detection record
// @route   DELETE /api/plant-detection/:id
// @access  Private (Farmer only — own records only)
exports.deleteDetection = async (req, res) => {
  try {
    const detection = await PlantDetection.findById(req.params.id);

    if (!detection) {
      return res.status(404).json({ success: false, error: 'Detection record not found' });
    }

    // Ensure the farmer can only delete their own records
    if (detection.farmerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this record' });
    }

    // Optionally remove the associated image file from disk
    if (detection.imageUrl) {
      const filename = detection.imageUrl.split('/uploads/')[1];
      if (filename) {
        const filePath = path.join(__dirname, '../public/uploads', filename);
        cleanupFile(filePath);
      }
    }

    await detection.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
