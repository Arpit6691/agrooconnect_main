const Review = require('../models/Review');
const User = require('../models/User');

exports.createReview = async (req, res) => {
  try {
    req.body.reviewerId = req.user.id;
    const review = await Review.create(req.body);

    // Calculate new average rating for reviewee
    const stats = await Review.aggregate([
      { $match: { revieweeId: review.revieweeId } },
      { $group: { _id: '$revieweeId', averageRating: { $avg: '$rating' } } }
    ]);

    if (stats.length > 0) {
      await User.findByIdAndUpdate(review.revieweeId, { rating: Math.round(stats[0].averageRating * 10) / 10 });
    }

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ revieweeId: req.params.userId }).populate('reviewerId', 'name avatar');
    res.status(200).json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
