import express, { Express, NextFunction, Request, Response, Router } from 'express';
import { ApplicationContainer } from '../../infrastructure/dependency-injection/container';
import { AppError } from '../../domain/errors/AppError';

/**
 * Future REST API — keep controllers thin (call use cases only).
 */
export function createHttpApp(container: ApplicationContainer): Express {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', createApiRouter(container));
  app.use(errorMiddleware);

  return app;
}

function createApiRouter(container: ApplicationContainer): Router {
  const router = Router();

  router.post('/scrape', async (_req, res, next) => {
    try {
      const result = await container.scrapeHackerNews.execute();
      res.status(201).json({
        scrapeId: result.snapshot.id,
        scrapedAt: result.snapshot.scrapedAt,
        count: result.entries.length,
        entries: result.entries,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/entries/filter/:name', async (req, res, next) => {
    try {
      const result = await container.filterEntries.execute({
        filterName: req.params.name,
        fresh: req.query.fresh === 'true',
        userId: typeof req.query.userId === 'string' ? req.query.userId : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get('/history', async (req, res, next) => {
    try {
      const limit =
        typeof req.query.limit === 'string'
          ? Number.parseInt(req.query.limit, 10)
          : undefined;
      const result = await container.getUsageHistory.execute({ limit });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    const status = mapErrorStatus(error.code);
    res.status(status).json({ code: error.code, message: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Unexpected server error' });
}

function mapErrorStatus(code: string): number {
  switch (code) {
    case 'NOT_FOUND':
      return 404;
    case 'VALIDATION_ERROR':
      return 400;
    case 'SCRAPING_FAILED':
      return 502;
    default:
      return 500;
  }
}
