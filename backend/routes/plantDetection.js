const express = require('express');
const {
  analyzeImage,
  getMyDetections,
  getDetection,
  deleteDetection
} = require('../controllers/plantDetectionController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../utils/upload');

const router = express.Router();

// All routes require authentication + farmer role
router.use(protect);
router.use(authorize('farmer'));

router.route('/')
  .get(getMyDetections)
  .post(upload.single('image'), analyzeImage);

router.route('/:id')
  .get(getDetection)
  .delete(deleteDetection);

module.exports = router;
