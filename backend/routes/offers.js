const express = require('express');
const { getOffers, createOffer, updateOfferStatus } = require('../controllers/offerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getOffers)
  .post(authorize('trader', 'admin'), createOffer);

router.route('/:id')
  .put(updateOfferStatus);

module.exports = router;
