const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const path = require('path');

const app = express();

// Body parser
app.use(express.json());

// Serve static files (like uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Enable CORS
app.use(cors());

// Security Middlewares
const helmet = require('helmet');
// const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
// const mongoSanitize = require('express-mongo-sanitize'); // Incompatible with Express v5

// Set security headers
app.use(helmet());
// Prevent XSS attacks
// app.use(xss()); // Incompatible with Express v5

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100 // 100 requests per 10 mins
});
app.use(limiter);

// Create server and socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.io connection
require('./sockets/chat')(io);

// Mount routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/deals', require('./routes/deals'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/reviews', require('./routes/reviews'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message || 'Server Error', stack: err.stack });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
