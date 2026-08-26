const Crop = require('../models/Crop');

// @desc    Get all crops
// @route   GET /api/crops
// @access  Public
exports.getCrops = async (req, res) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    
    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Parse back
    let queryObj = JSON.parse(queryStr);

    // If search parameter exists, add to query
    if (req.query.search) {
      queryObj.$or = [
        { cropName: { $regex: req.query.search, $options: 'i' } },
        { location: { $regex: req.query.search, $options: 'i' } },
        { category: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    query = Crop.find(queryObj).populate('farmerId', 'name rating avatar');

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Crop.countDocuments(queryObj);

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const crops = await query;

    // Pagination result
    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({ success: true, count: crops.length, pagination, data: crops });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single crop
// @route   GET /api/crops/:id
// @access  Public
exports.getCrop = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id).populate('farmerId', 'name rating avatar');

    if (!crop) {
      return res.status(404).json({ success: false, error: `Crop not found with id of ${req.params.id}` });
    }

    res.status(200).json({ success: true, data: crop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create new crop
// @route   POST /api/crops
// @access  Private (Farmer only)
exports.createCrop = async (req, res) => {
  try {
    // Add user to req.body
    req.body.farmerId = req.user.id;

    // Check if an image was uploaded
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      req.body.images = [`${baseUrl}/uploads/${req.file.filename}`];
    }

    const crop = await Crop.create(req.body);

    res.status(201).json({ success: true, data: crop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete a crop
// @route   DELETE /api/crops/:id
// @access  Private (Farmer only)
exports.deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ success: false, error: 'Crop not found' });
    }

    // Make sure user is crop owner
    if (crop.farmerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this crop' });
    }

    await crop.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
