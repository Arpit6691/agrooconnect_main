const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Crop = require('./models/Crop');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const users = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'farmer',
  }
];

const crops = [
  {
    cropName: 'Premium Wheat',
    category: 'Grains',
    quantity: 500,
    price: 280,
    location: 'Kansas, USA',
    images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=500&q=80']
  },
  {
    cropName: 'Organic Corn',
    category: 'Vegetables',
    quantity: 1000,
    price: 150,
    location: 'Iowa, USA',
    images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=500&q=80']
  }
];

const importData = async () => {
  try {
    await User.deleteMany();
    await Crop.deleteMany();

    const createdUsers = await User.create(users);
    const farmerId = createdUsers[0]._id;

    const sampleCrops = crops.map(crop => {
      return { ...crop, farmerId };
    });

    await Crop.insertMany(sampleCrops);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

importData();
