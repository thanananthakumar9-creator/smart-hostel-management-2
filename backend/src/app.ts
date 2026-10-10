import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/authRoutes';
import outpassRoutes from './routes/outpassRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import issueRoutes from './routes/issueRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';
import { getActiveDbType } from './database/db';

export const app = express();

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/outpasses', outpassRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: getActiveDbType(),
  });
});

// Serve frontend build if present
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
const altDistPath = path.resolve(__dirname, '../../../frontend/dist');
const activeDist = fs.existsSync(frontendDistPath) ? frontendDistPath : (fs.existsSync(altDistPath) ? altDistPath : null);

if (activeDist) {
  app.use(express.static(activeDist));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(activeDist, 'index.html'));
  });
}

// 404 Route handler for API
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.path} not found.`,
  });
});

// Centralized error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Application Error:', err);
  const status = err.status || 500;
  const message = err.message || 'An unexpected error occurred. Please try again.';
  res.status(status).json({
    success: false,
    message,
  });
});
