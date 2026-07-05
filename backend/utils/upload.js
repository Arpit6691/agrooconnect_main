const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save to public/uploads directory
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: function (req, file, cb) {
    // Generate unique filename: <random_hex>-<original_name>
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter (optional but good practice to ensure only images are uploaded)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image file.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = { upload };
