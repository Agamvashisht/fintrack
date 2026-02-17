import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { config } from './config/env';
import { swaggerSpec } from './config/swagger';
import { logger } from './config/logger';
import { requestLogger } from './middleware/logger.middleware';
import { errorHandler, notFound } from './middleware/error.middleware';

import authRoutes from './routes/auth.routes';
import transactionRoutes from './routes/transaction.routes';
import { budgetRouter, categoryRouter } from './routes/budget.routes';

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: config.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: config.NODE_ENV === 'production',
  }),
);

app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts' },
});

app.use(limiter);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);

// API routes
const apiPrefix = `/api/${config.API_VERSION}`;

app.use(`${apiPrefix}/auth`, authLimiter, authRoutes);
app.use(`${apiPrefix}/transactions`, transactionRoutes);
app.use(`${apiPrefix}/budgets`, budgetRouter);
app.use(`${apiPrefix}/categories`, categoryRouter);

// Swagger documentation
if (config.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'FinTrack API Docs',
  }));
  logger.info(`📚 Swagger docs: http://localhost:${config.PORT}/api-docs`);
}

// Health check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: config.API_VERSION,
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;
