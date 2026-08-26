const Deal = require('../models/Deal');
const Complaint = require('../models/Complaint');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// @desc    Get all deals
// @route   GET /api/deals
// @access  Private
exports.getDeals = async (req, res) => {
  try {
    let query;
    if (req.user.role === 'farmer') {
      query = { farmerId: req.user.id };
    } else if (req.user.role === 'trader') {
      query = { traderId: req.user.id };
    } else {
      query = {}; // admin
    }

    const deals = await Deal.find(query)
      .populate('cropId', 'cropName price images category unit quantity')
      .populate('traderId', 'name avatar phone email businessName businessAddress rating')
      .populate('farmerId', 'name avatar phone email village district state rating')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: deals.length, data: deals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create new deal directly (Buy Now)
// @route   POST /api/deals
// @access  Private (Trader)
exports.createDeal = async (req, res) => {
  try {
    const { cropId, farmerId, finalPrice, quantity, paymentMethod } = req.body;
    
    const deal = await Deal.create({
      cropId,
      farmerId,
      traderId: req.user.id,
      finalPrice,
      quantity,
      paymentMethod: paymentMethod || 'Not Set'
    });

    // Notify farmer
    await Notification.create({
      userId: farmerId,
      title: 'New Deal Created (Direct Buy)',
      message: `A trader has directly bought your crop for ₹${finalPrice}. Payment Method: ${paymentMethod || 'Not Set'}.`,
      type: 'deal',
      link: `/deals/${deal._id}`
    });

    res.status(201).json({ success: true, data: deal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single deal
// @route   GET /api/deals/:id
// @access  Private
exports.getDeal = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate('cropId', 'cropName price images category unit quantity')
      .populate('traderId', 'name avatar phone email businessName businessAddress rating')
      .populate('farmerId', 'name avatar phone email village district state rating');

    if (!deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    res.status(200).json({ success: true, data: deal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Helper to add audit log
const addAudit = (deal, action, userId, details) => {
  if (!deal.auditLog) deal.auditLog = [];
  deal.auditLog.push({ action, timestamp: new Date(), user: userId, details });
};

// Helper to add status history
const addHistory = (deal, status, userId, note) => {
  if (!deal.statusHistory) deal.statusHistory = [];
  deal.statusHistory.push({ status, timestamp: new Date(), updatedBy: userId, note });
};

// @desc    Add transport details
// @route   POST /api/deals/:id/transport
// @access  Private
exports.addTransport = async (req, res) => {
  try {
    let deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found' });

    deal.transportation = {
      arrangedBy: req.body.arrangedBy,
      driverName: req.body.driverName,
      vehicleNumber: req.body.vehicleNumber,
      trackingId: req.body.trackingId,
      pickupDate: req.body.pickupDate,
      estimatedDelivery: req.body.estimatedDelivery,
      currentLocation: req.body.currentLocation || 'Dispatch Pending'
    };
    deal.status = 'Pickup Scheduled';
    
    addHistory(deal, 'Pickup Scheduled', req.user.id, 'Transportation arranged');
    addAudit(deal, 'TRANSPORT_ADDED', req.user.id, `Vehicle ${req.body.vehicleNumber} assigned`);
    
    await deal.save();
    res.status(200).json({ success: true, data: deal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Confirm crop handover
// @route   POST /api/deals/:id/handover
// @access  Private
exports.confirmHandover = async (req, res) => {
  try {
    let deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found' });

    deal.status = 'In Transit';
    deal.farmerConfirmation = true;
    
    addHistory(deal, 'In Transit', req.user.id, 'Crop handed over to transport');
    addAudit(deal, 'HANDOVER_CONFIRMED', req.user.id, 'Farmer confirmed handover');
    
    await deal.save();
    res.status(200).json({ success: true, data: deal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Confirm crop received
// @route   POST /api/deals/:id/receive
// @access  Private
exports.confirmReceive = async (req, res) => {
  try {
    let deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found' });

    deal.status = 'Delivered';
    if(deal.payment?.status !== 'Paid') {
        deal.status = 'Payment Pending';
    } else {
        deal.status = 'Completed';
    }
    deal.traderConfirmation = true;
    
    addHistory(deal, deal.status, req.user.id, 'Crop received by trader');
    addAudit(deal, 'RECEIPT_CONFIRMED', req.user.id, 'Trader confirmed delivery receipt');
    
    await deal.save();
    res.status(200).json({ success: true, data: deal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Submit payment proof
// @route   POST /api/deals/:id/payment
// @access  Private
exports.submitPayment = async (req, res) => {
  try {
    let deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found' });

    deal.payment = {
      status: 'Verification Pending',
      method: req.body.paymentMethod,
      transactionId: req.body.transactionId,
      proofUrl: req.body.proofUrl
    };
    
    if(deal.status === 'Delivered' || deal.status === 'Payment Pending') {
       deal.status = 'Payment Pending';
    }

    addHistory(deal, 'Payment Pending', req.user.id, 'Payment proof submitted');
    addAudit(deal, 'PAYMENT_SUBMITTED', req.user.id, `Payment via ${req.body.paymentMethod} submitted`);
    
    await deal.save();
    res.status(200).json({ success: true, data: deal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Verify payment
// @route   POST /api/deals/:id/confirm-payment
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    let deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found' });

    deal.payment.status = 'Paid';
    deal.payment.verifiedAt = new Date();
    
    if (deal.traderConfirmation) {
        deal.status = 'Completed';
        addHistory(deal, 'Completed', req.user.id, 'Deal completed');
    }
    
    addAudit(deal, 'PAYMENT_VERIFIED', req.user.id, 'Farmer verified payment');
    
    await deal.save();
    res.status(200).json({ success: true, data: deal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Reject payment claim
// @route   POST /api/deals/:id/reject-payment
// @access  Private
exports.rejectPayment = async (req, res) => {
  try {
    let deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found' });

    deal.payment.status = 'Failed';
    addAudit(deal, 'PAYMENT_REJECTED', req.user.id, 'Farmer rejected payment proof');
    
    await deal.save();
    res.status(200).json({ success: true, data: deal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Cancel deal
// @route   POST /api/deals/:id/cancel
// @access  Private
exports.cancelDeal = async (req, res) => {
  try {
    let deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found' });

    deal.status = 'Cancelled';
    deal.cancellationReason = req.body.reason;
    
    addHistory(deal, 'Cancelled', req.user.id, req.body.reason);
    addAudit(deal, 'DEAL_CANCELLED', req.user.id, `Reason: ${req.body.reason}`);
    
    await deal.save();
    res.status(200).json({ success: true, data: deal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Dispute deal
// @route   POST /api/deals/:id/dispute
// @access  Private
exports.disputeDeal = async (req, res) => {
  try {
    let deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found' });

    deal.status = 'Disputed';
    deal.disputeReason = req.body.reason;
    
    addHistory(deal, 'Disputed', req.user.id, req.body.reason);
    addAudit(deal, 'DEAL_DISPUTED', req.user.id, `Reason: ${req.body.reason}`);
    
    await deal.save();
    res.status(200).json({ success: true, data: deal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Add complaint
// @route   POST /api/deals/:id/complaint
// @access  Private
exports.addDealComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.create({
      userId: req.user.id,
      subject: `Deal #${req.params.id} - ${req.body.subject}`,
      description: req.body.description,
      status: 'Open'
    });
    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Add review
// @route   POST /api/deals/:id/review
// @access  Private
exports.addDealReview = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found' });

    const revieweeId = req.user.id === deal.farmerId.toString() ? deal.traderId : deal.farmerId;

    const review = await Review.create({
      dealId: deal._id,
      reviewerId: req.user.id,
      revieweeId: revieweeId,
      rating: req.body.rating,
      reviewText: req.body.reviewText
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create Razorpay Order
// @route   POST /api/deals/:id/create-razorpay-order
// @access  Private (Trader)
exports.createRazorpayOrder = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    if (deal.traderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const amount = (deal.finalPrice * deal.quantity) * 100; // Amount in paise
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_123',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_123'
    });

    const options = {
      amount, 
      currency: 'INR',
      receipt: 'receipt_order_' + deal._id
    };

    const order = await instance.orders.create(options);
    if (!order) {
      return res.status(500).json({ success: false, error: 'Some error occurred with Razorpay' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/deals/:id/verify-razorpay-payment
// @access  Private (Trader)
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_123';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, error: 'Payment verification failed' });
    }

    deal.payment.status = 'Paid';
    deal.payment.method = 'Online';
    deal.payment.razorpayOrderId = razorpayOrderId;
    deal.payment.razorpayPaymentId = razorpayPaymentId;
    deal.payment.razorpaySignature = razorpaySignature;
    deal.payment.verifiedAt = Date.now();
    deal.status = 'Completed';

    deal.statusHistory.push({
      status: 'Completed',
      timestamp: Date.now(),
      updatedBy: req.user.id,
      note: 'Online payment verified automatically.'
    });

    addAudit(deal, 'PAYMENT_VERIFIED_ONLINE', req.user.id, 'Razorpay online payment successful');

    await deal.save();

    await Notification.create({
      userId: deal.farmerId,
      title: 'Payment Received Online',
      message: `Trader has successfully paid online. Deal is now Completed.`,
      type: 'payment',
      link: `/deals/${deal._id}`
    });

    res.status(200).json({ success: true, deal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Start Mock Payment
// @route   POST /api/deals/:id/create-mock-payment
// @access  Private (Trader)
exports.createMockPayment = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    if (deal.traderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (deal.status !== 'Payment Pending' && deal.payment.status !== 'Pending') {
      return res.status(400).json({ success: false, error: 'Deal is not in a payment pending state' });
    }

    deal.payment.status = 'Processing';
    await deal.save();

    const timestamp = Date.now();
    const randomString = crypto.randomBytes(4).toString('hex').toUpperCase();
    const transactionId = `AGRO_TXN_${timestamp}_${randomString}`;

    res.status(200).json({
      success: true,
      transactionId,
      amount: deal.finalPrice * deal.quantity,
      status: 'Processing'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Complete Mock Payment
// @route   POST /api/deals/:id/complete-mock-payment
// @access  Private (Trader)
exports.completeMockPayment = async (req, res) => {
  try {
    const { success, transactionId, method } = req.body;
    const deal = await Deal.findById(req.params.id);
    
    if (!deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    if (deal.traderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (success) {
      deal.payment.status = 'Paid';
      deal.payment.method = method || 'Online';
      deal.payment.transactionId = transactionId;
      deal.payment.verifiedAt = Date.now();
      deal.status = 'Completed';

      deal.statusHistory.push({
        status: 'Completed',
        timestamp: Date.now(),
        updatedBy: req.user.id,
        note: 'Mock online payment successful.'
      });

      addAudit(deal, 'MOCK_PAYMENT_SUCCESS', req.user.id, `Payment via ${method || 'Online'} successful`);

      await Notification.create({
        userId: deal.farmerId,
        title: 'Payment Received Online (Mock)',
        message: `Trader has successfully paid ₹${deal.finalPrice * deal.quantity} online. Deal is now Completed.`,
        type: 'payment',
        link: `/deals/${deal._id}`
      });
    } else {
      deal.payment.status = 'Failed';
      addAudit(deal, 'MOCK_PAYMENT_FAILED', req.user.id, `Payment via ${method || 'Online'} failed`);
    }

    await deal.save();
    res.status(200).json({ success: true, deal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

