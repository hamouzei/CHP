import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import authRoutes from './routes/auth';
import assessmentRoutes from './routes/assessments';
import referenceRoutes from './routes/reference';
import dashboardRoutes from './routes/dashboard';
import reportRoutes from './routes/reports';
import userRoutes from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;

// --------------- Middleware ---------------
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow any Vercel preview/production deployment URL (*.vercel.app)
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --------------- API Routes ---------------
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/assessments', assessmentRoutes);
app.use('/api/v1/reference', referenceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1', reportRoutes);           // mounts /assessments/:id/reports/*
app.use('/api/v1', userRoutes);             // mounts /users and /organizations

// --------------- Health Check ---------------
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --------------- Global Error Handler ---------------
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
});

// --------------- Start Server ---------------
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✅ CHP Maturity API server running on http://localhost:${PORT}`);
    console.log(`📚 API base: http://localhost:${PORT}/api/v1`);
  });
}

export default app;
