import cors from 'cors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';
import apiRoutes from './routes';
import { swaggerSpec } from './utils/swagger';

const app = express();

const allowedOrigins =
  config.corsOrigin === '*'
    ? true
    : config.corsOrigin.split(',').map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

const testerPath = path.resolve(process.cwd(), 'frontend');
app.use('/tester', express.static(testerPath));

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Financial Dashboard API is running',
    data: {
      docs: '/api/docs',
      basePath: '/api',
      tester: '/tester',
    },
  });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', apiRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: `${req.method} ${req.originalUrl} does not exist`,
  });
});

app.use(errorHandler);

export default app;
