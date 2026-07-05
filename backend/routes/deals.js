const express = require('express');
const { 
  getDeals, getDeal, createDeal, 
  addTransport, confirmHandover, confirmReceive, 
  submitPayment, verifyPayment, rejectPayment,
  cancelDeal, disputeDeal,
  addDealComplaint, addDealReview 
} = require('../controllers/dealController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getDeals)
  .post(createDeal);

router.route('/:id')
  .get(getDeal);

router.post('/:id/transport', addTransport);
router.post('/:id/handover', confirmHandover);
router.post('/:id/receive', confirmReceive);
router.post('/:id/payment', submitPayment);
router.post('/:id/confirm-payment', verifyPayment);
router.post('/:id/reject-payment', rejectPayment);
router.post('/:id/cancel', cancelDeal);
router.post('/:id/dispute', disputeDeal);

router.route('/:id/complaint')
  .post(addDealComplaint);

router.route('/:id/review')
  .post(addDealReview);

module.exports = router;
