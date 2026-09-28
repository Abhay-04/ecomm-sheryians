import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';

const app = express();

// Needed behind a hosting proxy (e.g. Vercel) so rate limiting sees the real client IP.
if (env.isProduction) {
  app.set('trust proxy', 1);
}

app.use(
  cors({
    origin: env.clientUrl,
    // Allows the browser to send and receive the refresh token cookie.
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Makes sure MongoDB is connected before any route runs (needed on Vercel).
app.use(async (req, res, next) => {
  await connectDatabase(env.mongoUri);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
