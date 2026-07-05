const express = require('express');
const { getCrops, getCrop, createCrop, deleteCrop } = require('../controllers/cropController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../utils/upload');

const router = express.Router();

router.route('/')
  .get(getCrops)
  .post(protect, authorize('farmer', 'admin'), upload.single('image'), createCrop);

router.route('/:id')
  .get(getCrop)
  .delete(protect, authorize('farmer', 'admin'), deleteCrop);

module.exports = router;
