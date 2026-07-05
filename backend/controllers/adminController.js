const User = require('../models/User');
const Crop = require('../models/Crop');
const Deal = require('../models/Deal');
const Complaint = require('../models/Complaint');

// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalListings = await Crop.countDocuments();
    const totalDeals = await Deal.countDocuments();
    
    // Revenue aggregation
    const revenueData = await Deal.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, totalRevenue: { $sum: "$finalPrice" } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalListings,
        totalDeals,
        totalRevenue
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Block/Unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
exports.toggleUserBlock = async (req, res) => {
  try {
    // Requires a 'isBlocked' field in User model (skipped for brevity unless explicitly requested, we can use role='blocked' or add isBlocked dynamically)
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    // Dummy toggle logic
    user.role = user.role === 'blocked' ? 'farmer' : 'blocked';
    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
