const express = require('express');
const { createReview, getReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createReview);
router.get('/:userId', getReviews);

module.exports = router;
