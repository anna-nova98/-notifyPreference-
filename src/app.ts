import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createRoutes } from './api/routes';
import { initializeDatabase, closeDatabase } from './config/database';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Класс приложения Notification Preferences Service
 */
export class NotificationPreferencesApp {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  /**
   * Настройка middleware
   */
  private configureMiddleware(): void {
    // Безопасность
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // Парсинг JSON
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Логирование
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan(process.env.MORGAN_FORMAT || 'combined'));
    }
    
    // Request ID для трассировки
    this.app.use((req, res, next) => {
      (req as any).requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      next();
    });
  }

  /**
   * Настройка роутов
   */
  private configureRoutes(): void {
    const routes = createRoutes();
    this.app.use('/api/v1', routes);
    
    // Корневой маршрут
    this.app.get('/', (req, res) => {
      res.json({
        service: 'Notification Preferences Service',
        version: '1.0.0',
        documentation: '/api/v1/health',
        endpoints: {
          health: 'GET /api/v1/health',
          getUserPreferences: 'GET /api/v1/users/:id/preferences',
          updateUserPreferences: 'POST /api/v1/users/:id/preferences',
          evaluateNotification: 'POST /api/v1/evaluate',
          getGlobalPolicies: 'GET /api/v1/policies',
          upsertGlobalPolicy: 'POST /api/v1/policies'
        }
      });
    });
  }

  /**
   * Настройка обработки ошибок
   */
  private configureErrorHandling(): void {
    // Обработка необработанных ошибок
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error(`[${(req as any).requestId}] Unhandled error:`, err);
      
      res.status(err.status || 500).json({
        error: 'Internal server error',
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Запуск приложения
   */
  async start(): Promise<void> {
    try {
      // Инициализация базы данных
      await initializeDatabase();
      
      // Запуск сервера
      this.app.listen(this.port, () => {
        console.log(`Notification Preferences Service started on port ${this.port}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`API available at http://localhost:${this.port}/api/v1`);
      });
      
      // Обработка graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      console.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  /**
   * Настройка graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, starting graceful shutdown...`);
      
      try {
        await closeDatabase();
        console.log('Database connection closed');
        
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };
    
    // Обработка сигналов завершения
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Обработка необработанных исключений
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      shutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }

  /**
   * Получение экземпляра Express приложения (для тестов)
   */
  getApp(): express.Application {
    return this.app;
  }
}

/**
 * Точка входа приложения
 */
if (require.main === module) {
  const app = new NotificationPreferencesApp();
  app.start().catch(console.error);
}