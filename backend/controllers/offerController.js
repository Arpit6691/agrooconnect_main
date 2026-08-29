const Offer = require('../models/Offer');
const Deal = require('../models/Deal');
const Crop = require('../models/Crop');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendDealConfirmationEmails } = require('../services/emailService');

// @desc    Get all offers (for a farmer or trader)
// @route   GET /api/offers
// @access  Private
exports.getOffers = async (req, res) => {
  try {
    let query;
    if (req.user.role === 'farmer') {
      query = { farmerId: req.user.id };
    } else if (req.user.role === 'trader') {
      query = { traderId: req.user.id };
    } else {
      query = {}; // admin
    }

    const offers = await Offer.find(query)
      .populate('cropId', 'cropName price images unit quantity')
      .populate('traderId', 'name avatar phone email')
      .populate('farmerId', 'name avatar phone email')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: offers.length, data: offers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create new offer
// @route   POST /api/offers
// @access  Private (Trader)
exports.createOffer = async (req, res) => {
  try {
    req.body.traderId = req.user.id;
    const offer = await Offer.create(req.body);

    // Notify farmer
    await Notification.create({
      userId: req.body.farmerId,
      title: 'New Offer Received',
      message: `You have received a new offer of ₹${req.body.offeredPrice} for your crop.`,
      type: 'offer',
      link: '/farmer-dashboard'
    });

    res.status(201).json({ success: true, data: offer });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update offer status (Accept/Reject/Counter/Cancel)
// @route   PUT /api/offers/:id
// @access  Private
exports.updateOfferStatus = async (req, res) => {
  try {
    let offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    const isFarmer = offer.farmerId.toString() === req.user.id;
    const isTrader = offer.traderId.toString() === req.user.id;

    if (!isFarmer && !isTrader && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to update this offer' });
    }

    const { status, message, newPrice } = req.body;

    // Handle Counter Offer
    if (status === 'Countered') {
      offer.status = 'Countered';
      offer.offeredPrice = newPrice || offer.offeredPrice;
      offer.negotiationHistory.push({
        senderId: req.user.id,
        message: message || 'Counter offer sent',
        price: offer.offeredPrice
      });
    } else {
      offer.status = status;
      if (message) {
        offer.negotiationHistory.push({
          senderId: req.user.id,
          message,
          price: offer.offeredPrice
        });
      }
    }

    await offer.save();

    // Notifications
    const notifyUser = isFarmer ? offer.traderId : offer.farmerId;
    await Notification.create({
      userId: notifyUser,
      title: `Offer ${status}`,
      message: `Your offer has been ${status.toLowerCase()} by the ${isFarmer ? 'farmer' : 'trader'}.`,
      type: 'offer',
      link: isFarmer ? '/trader-dashboard' : '/farmer-dashboard'
    });

    // If accepted, create a Deal and send confirmation emails
    if (status === 'Accepted') {
      const deal = await Deal.create({
        cropId: offer.cropId,
        farmerId: offer.farmerId,
        traderId: offer.traderId,
        finalPrice: offer.offeredPrice,
        quantity: offer.quantity,
        totalAmount: offer.offeredPrice * offer.quantity
      });
      
      // Notify both parties about deal creation
      await Notification.create([{
        userId: offer.farmerId,
        title: 'New Deal Created',
        message: `Your offer was accepted and a new deal has been created.`,
        type: 'deal',
        link: '/farmer-dashboard'
      }, {
        userId: offer.traderId,
        title: 'New Deal Created',
        message: `Your offer was accepted and a new deal has been created.`,
        type: 'deal',
        link: '/trader-dashboard'
      }]);

      // Fetch related info and dispatch confirmation emails asynchronously (non-blocking)
      (async () => {
        try {
          const [crop, farmer, trader] = await Promise.all([
            Crop.findById(offer.cropId),
            User.findById(offer.farmerId),
            User.findById(offer.traderId)
          ]);

          // Diagnostic — visible in Render logs
          console.log('[EMAIL SERVICE] Pre-send check (offer accepted):', {
            dealId: deal._id,
            cropFound: !!crop,
            farmerFound: !!farmer,
            farmerEmail: farmer?.email || '(NO EMAIL)',
            traderFound: !!trader,
            traderEmail: trader?.email || '(NO EMAIL)',
            alreadySent: deal.confirmationEmailSent
          });

          if (crop && farmer && trader && !deal.confirmationEmailSent) {
            const emailResult = await sendDealConfirmationEmails({
              deal,
              crop,
              farmer,
              trader
            });

            if (emailResult.farmerSent || emailResult.traderSent) {
              await Deal.findByIdAndUpdate(deal._id, { confirmationEmailSent: true });
            }
          } else {
            console.warn('[EMAIL SERVICE] Skipped — missing data:', {
              crop: !!crop, farmer: !!farmer, trader: !!trader, alreadySent: deal.confirmationEmailSent
            });
          }
        } catch (emailErr) {
          console.error('[EMAIL SERVICE] Async confirmation email error:', emailErr.message);
        }
      })();
    }

    res.status(200).json({ success: true, data: offer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
