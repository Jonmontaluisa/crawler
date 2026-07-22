// Run with: npm run server
import { createContainer } from '../../infrastructure/dependency-injection/container';
import { createHttpApp } from './createHttpApp';

async function main(): Promise<void> {
  const container = await createContainer();
  const app = createHttpApp(container);
  const port = container.config.httpPort;

  const server = app.listen(port, () => {
    console.log(`HN crawler HTTP API listening on http://localhost:${port}`);
    console.log(
      'Routes: POST /api/scrape, GET /api/entries/filter/:name, GET /api/history',
    );
  });

  function shutdown(): void {
    server.close(() => {
      void container.dispose().then(() => process.exit(0));
    });
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

void main();
