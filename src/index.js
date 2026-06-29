/**
 * src/index.js
 *
 * Application entry point.
 * Loads environment variables, configures Express, mounts routes,
 * and starts listening.
 */
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes        = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Global middleware ────────────────────────────────────────────────────────

// CORS: only allow requests from configured origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, curl, same-host)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin ${origin} is not allowed.`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Reject requests whose Content-Type is not application/json (except GET/HEAD)
app.use((req, res, next) => {
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    const ct = req.headers['content-type'] || '';
    if (!ct.includes('application/json')) {
      return res.status(415).json({
        status: 'error',
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Content-Type must be application/json.',
      });
    }
  }
  next();
});

// Parse JSON bodies; limit size to 50 KB to reduce DoS surface
app.use(express.json({ limit: '50kb' }));

// Global rate limit: 100 requests per 15 minutes per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please slow down.',
  },
}));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth',         authRoutes);
app.use('/api/appointments', appointmentRoutes);

// 404 handler for unrecognised routes
app.use((_req, res) => {
  res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'The requested endpoint does not exist.' });
});

// Global error handler (catches unexpected thrown errors)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Unhandled error]', err);
  res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'An unexpected error occurred.' });
});

// ─── Start server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`IntelliCare API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

module.exports = app; // exported for testing
