import { Request, Response } from 'express';
import { 
  NotificationType, 
  Channel, 
  Region, 
  UpdatePreferencesRequest,
  NotificationEvaluationRequest
} from '../domain/types';
import { 
  UserPreferencesService, 
  GlobalPoliciesService, 
  NotificationEvaluationService 
} from '../domain/services';
import { 
  UserPreferencesRepository, 
  GlobalPoliciesRepository, 
  DefaultPreferencesRepository 
} from '../infrastructure/repositories';
import { AppDataSource } from '../config/database';
import { z } from 'zod';

/**
 * Валидационные схемы для API
 */
const UpdatePreferencesSchema = z.object({
  preferences: z.array(z.object({
    notificationType: z.nativeEnum(NotificationType),
    channel: z.nativeEnum(Channel),
    enabled: z.boolean()
  })).optional(),
  quietHours: z.object({
    enabled: z.boolean(),
    timezone: z.string().min(1),
    startHour: z.number().min(0).max(23),
    endHour: z.number().min(0).max(23),
    applyToNotificationTypes: z.array(z.nativeEnum(NotificationType))
  }).optional()
});

const EvaluateNotificationSchema = z.object({
  userId: z.string().min(1),
  notificationType: z.nativeEnum(NotificationType),
  channel: z.nativeEnum(Channel),
  region: z.nativeEnum(Region),
  datetime: z.string().datetime()
});

/**
 * Базовый контроллер с общими методами
 */
export class BaseController {
  protected handleError(res: Response, error: any, message: string = 'Internal server error'): void {
    console.error(`Error: ${error.message}`, error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      });
    } else {
      res.status(500).json({
        error: message,
        details: error.message
      });
    }
  }
}

/**
 * Контроллер для управления предпочтениями пользователей
 */
export class UserPreferencesController extends BaseController {
  private userPrefsService: UserPreferencesService;
  private defaultPrefsRepo: DefaultPreferencesRepository;

  constructor() {
    super();
    const userPrefsRepo = new UserPreferencesRepository(AppDataSource);
    this.defaultPrefsRepo = new DefaultPreferencesRepository(AppDataSource);
    this.userPrefsService = new UserPreferencesService(userPrefsRepo, this.defaultPrefsRepo);
  }

  /**
   * Получить предпочтения пользователя
   */
  async getPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id as string;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }
      
      const preferences = await this.userPrefsService.getUserPreferences(userId);
      
      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get user preferences');
    }
  }

  /**
   * Обновить предпочтения пользователя
   */
  async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id as string;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }
      
      const validationResult = UpdatePreferencesSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation error',
          details: validationResult.error.issues
        });
        return;
      }
      
      const data = validationResult.data;
      const results: any = {};
      
      // Обновляем предпочтения если есть
      if (data.preferences && data.preferences.length > 0) {
        const updatedPrefs = await this.userPrefsService.updatePreferences(userId, data.preferences);
        results.preferences = updatedPrefs;
      }
      
      // Обновляем quiet hours если есть
      if (data.quietHours) {
        const { enabled, timezone, startHour, endHour, applyToNotificationTypes } = data.quietHours;
        const quietHours = await this.userPrefsService.setQuietHours(
          userId, enabled, timezone, startHour, endHour, applyToNotificationTypes
        );
        results.quietHours = quietHours;
      }
      
      // Получаем обновлённые настройки
      const updatedPreferences = await this.userPrefsService.getUserPreferences(userId);
      
      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: updatedPreferences
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to update preferences');
    }
  }
}

/**
 * Контроллер для проверки возможности отправки уведомлений
 */
export class NotificationEvaluationController extends BaseController {
  private evaluationService: NotificationEvaluationService;

  constructor() {
    super();
    const userPrefsRepo = new UserPreferencesRepository(AppDataSource);
    const globalPoliciesRepo = new GlobalPoliciesRepository(AppDataSource);
    const defaultPrefsRepo = new DefaultPreferencesRepository(AppDataSource);
    this.evaluationService = new NotificationEvaluationService(
      userPrefsRepo,
      globalPoliciesRepo,
      defaultPrefsRepo
    );
  }

  /**
   * Проверить возможность отправки уведомления
   */
  async evaluate(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = EvaluateNotificationSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation error',
          details: validationResult.error.issues
        });
        return;
      }
      
      const data = validationResult.data;
      const request: NotificationEvaluationRequest = {
        ...data,
        datetime: new Date(data.datetime)
      };
      
      const result = await this.evaluationService.evaluateNotification(request);
      
      // Логируем решение
      console.log(`Notification evaluation: ${result.decision} for user ${data.userId}, type ${data.notificationType}, reason: ${result.reason || 'allowed'}`);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to evaluate notification');
    }
  }
}

/**
 * Контроллер для управления глобальными политиками
 */
export class GlobalPoliciesController extends BaseController {
  private policiesService: GlobalPoliciesService;

  constructor() {
    super();
    const globalPoliciesRepo = new GlobalPoliciesRepository(AppDataSource);
    this.policiesService = new GlobalPoliciesService(globalPoliciesRepo);
  }

  /**
   * Получить все глобальные политики
   */
  async getPolicies(req: Request, res: Response): Promise<void> {
    try {
      const policies = await this.policiesService.getAllPolicies();
      
      res.json({
        success: true,
        data: policies
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get global policies');
    }
  }

  /**
   * Создать или обновить глобальную политику
   */
  async upsertPolicy(req: Request, res: Response): Promise<void> {
    try {
      const { notificationType, channel, region, enabled, description } = req.body;
      
      if (!notificationType || !region || !description) {
        res.status(400).json({ 
          error: 'notificationType, region and description are required' 
        });
        return;
      }
      
      const policy = await this.policiesService.upsertPolicy(
        notificationType,
        region,
        enabled !== undefined ? enabled : false,
        description,
        channel
      );
      
      res.json({
        success: true,
        message: 'Policy updated successfully',
        data: policy
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to update policy');
    }
  }
}

/**
 * Контроллер для проверки здоровья сервиса
 */
export class HealthController extends BaseController {
  /**
   * Проверка здоровья сервиса
   */
  async checkHealth(req: Request, res: Response): Promise<void> {
    try {
      const dbStatus = AppDataSource.isInitialized ? 'connected' : 'disconnected';
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        uptime: process.uptime()
      });
    } catch (error) {
      this.handleError(res, error, 'Health check failed');
    }
  }
}