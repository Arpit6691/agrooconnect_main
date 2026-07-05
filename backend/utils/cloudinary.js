const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'mock_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'mock_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'mock_api_secret'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'agroconnect_crops',
    allowedFormats: ['jpeg', 'png', 'jpg'],
  },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
