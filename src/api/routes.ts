import { Router, Request, Response } from 'express';
import { 
  UserPreferencesController, 
  NotificationEvaluationController, 
  GlobalPoliciesController,
  HealthController 
} from './controllers';

/**
 * Создание и настройка роутеров
 */
export function createRoutes(): Router {
  const router = Router();
  
  // Контроллеры
  const userPrefsController = new UserPreferencesController();
  const evaluationController = new NotificationEvaluationController();
  const policiesController = new GlobalPoliciesController();
  const healthController = new HealthController();
  
  // Middleware для логирования запросов
  router.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
  
  // Health check
  router.get('/health', healthController.checkHealth.bind(healthController));
  
  // User preferences routes
  router.get('/users/:id/preferences', userPrefsController.getPreferences.bind(userPrefsController));
  router.post('/users/:id/preferences', userPrefsController.updatePreferences.bind(userPrefsController));
  
  // Notification evaluation routes
  router.post('/evaluate', evaluationController.evaluate.bind(evaluationController));
  
  // Global policies routes
  router.get('/policies', policiesController.getPolicies.bind(policiesController));
  router.post('/policies', policiesController.upsertPolicy.bind(policiesController));
  
  // 404 handler - обрабатываем все необработанные маршруты
  router.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      error: 'Route not found',
      path: req.url
    });
  });
  
  // Error handler
  router.use((error: any, req: Request, res: Response, next: any) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  });
  
  return router;
}