import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './common/config/config';
import { singleTenantMiddleware } from './common/middleware/singleTenant.middleware';
import { timezoneMiddleware } from './common/middleware/timezone.middleware';
import { errorHandler } from './common/middleware/errorHandler.middleware';

export function createApp(): Application {
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.clientOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Timezone',
        'Idempotency-Key',
      ],
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (config.node.env !== 'test') {
    app.use(morgan(config.node.env === 'production' ? 'combined' : 'dev'));
  }
  app.use(singleTenantMiddleware);

  app.use(timezoneMiddleware);

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: config.node.env,
    });
  });
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  app.use(errorHandler);

  return app;
}
