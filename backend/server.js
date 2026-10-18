require("node:dns/promises").setServers(["1.1.1.1","8.8.8.8"]);
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const { getStorageMode } = require('./utils/imageStorage');
console.log(`📷 Image storage: ${getStorageMode()}`);

const app = express();

// ─── Trust proxy (Vercel / Render sit behind reverse proxies) ───────────────
app.set('trust proxy', 1);

// ─── Security Headers (Helmet) ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://*.cloudinary.com", "https://img.youtube.com", "https://i.ytimg.com"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
    },
  },
  crossOriginEmbedderPolicy: false, // allow Cloudinary images
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow CORS image loading
}));

// ─── Global Rate Limiter ────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// ─── NoSQL Injection Protection ─────────────────────────────────────────────
app.use(mongoSanitize());

// ─── HTTP Parameter Pollution Protection ────────────────────────────────────
app.use(hpp());

// ─── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = new Set([
  'https://parthcraft12.vercel.app',
  'https://www.parthcraft12.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
]);

if (process.env.FRONTEND_URL) {
  const cleanFront = process.env.FRONTEND_URL.trim().replace(/\/$/, '');
  allowedOrigins.add(cleanFront);
}

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.has(cleanOrigin)) return callback(null, origin);
    // Allow any Vercel domain (*.vercel.app)
    if (/\.vercel\.app$/.test(cleanOrigin)) return callback(null, origin);
    if (origin.startsWith('http://localhost:')) return callback(null, origin);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200,
}));

// ─── Body Parsers (with size limits) ────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/community', require('./routes/communityRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

app.get('/', (req, res) =>
  res.json({ message: '🎨 ParthCraft12 API is running', status: 'ok' })
);

app.get(['/health', '/healthz'], (req, res) =>
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() })
);

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// ─── Global Error Handler (prevents leaking internals) ──────────────────────
app.use((err, req, res, _next) => {
  // Handle invalid ObjectIds gracefully
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  console.error('Unhandled error:', err);
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Something went wrong. Please try again.'
    : err.message || 'Internal server error';
  res.status(statusCode).json({ message });
});

const startEmailDigestCron = require('./jobs/emailDigestCron');
startEmailDigestCron();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

