import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth';
import historyRouter from './routes/history';
import usersRouter from './routes/users';
import palletPositionsRouter from './routes/palletPositions';
import palletProductsRouter from './routes/palletProducts';
import productsRouter from './routes/products';
import palletActionLogsRouter from './routes/palletActionLogs';
import empresasRouter from './routes/empresas';
import pagosRouter from './routes/pagos'; // Importar el nuevo router
import { ApiError, UnauthorizedError } from './lib/errors';
import { env } from './lib/config';
import swaggerUi from 'swagger-ui-express';
import SwaggerParser from '@apidevtools/swagger-parser';
import { devAuthMiddleware } from './middleware/devAuth';
// Removed startCronJobs import

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  const port = env.PORT;

  app.set('trust proxy', true);
  app.use(express.json());
  app.use(cookieParser());

  const swaggerSpecPath = path.resolve(__dirname, './swagger/index.yaml');
  let swaggerSpec: Record<string, unknown>;
  try {
    swaggerSpec = (await SwaggerParser.bundle(swaggerSpecPath)) as Record<string, unknown>;
  } catch (e) {
    console.log(e);
    swaggerSpec = {
      openapi: '3.0.0',
      info: {
        title: 'API Documentation Error',
        version: '1.0.0',
        description: 'Failed to load API documentation.',
      },
      paths: {},
      components: {},
    };
  }

  app.use('/dev/', devAuthMiddleware, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api/auth', authRouter);
  app.use('/api/history', historyRouter);
  app.use('/api/users', usersRouter);
  // Removed chessAccessRouter, chessValidationRouter, syncRouter, reportsRouter, commercialRouter
  app.use('/api/pallet-positions', palletPositionsRouter);
  app.use('/api/pallet-products', palletProductsRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/pallet-action-logs', palletActionLogsRouter);
  app.use('/api/empresas', empresasRouter);
  app.use('/api/pagos', pagosRouter); // Usar el nuevo router
  app.get('/api/hello', (_req, res) => {
    res.json({ message: 'Hola desde el servidor Express!' });
  });

  if (env.NODE_ENV === 'development') {
    const vite = await import('vite');
    const viteDevMiddleware = (
      await vite.createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      })
    ).middlewares;
    app.use(viteDevMiddleware);
  } else {
    const clientBuildPath = path.resolve(__dirname, '../client');
    app.use(express.static(clientBuildPath));

    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(clientBuildPath, 'index.html'));
    });
  }

  // Removed startCronJobs call

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    // Specific handling for UnauthorizedError to reduce log verbosity for expected cases
    if (err instanceof UnauthorizedError) {
      console.log(`[API Error Handled] 401 Unauthorized: ${err.message}`);
      return res.status(err.statusCode).json({ message: err.message });
    }

    // For other ApiErrors, log details including stack trace
    if (err instanceof ApiError) {
      console.error('Global Error Handler caught an ApiError:');
      console.error('  Name:', err.name);
      console.error('  Message:', err.message);
      console.error('  Stack:', err.stack);
      console.log(`[API Error Handled] ${err.statusCode}: ${err.message}`);
      return res.status(err.statusCode).json({ message: err.message });
    }

    // For any other unexpected errors, log full details
    console.error('Global Error Handler caught an unexpected error:');
    console.error('  Name:', err.name);
    console.error('  Message:', err.message);
    console.error('  Stack:', err.stack);
    console.error('Ocurrió un error inesperado (no es un ApiError reconocido).');
    return res.status(500).json({ message: 'Error Interno del Servidor' });
  });

  app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  });
}

createServer();