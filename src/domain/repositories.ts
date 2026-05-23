import { 
  NotificationType, 
  Channel, 
  Region, 
  UserPreference, 
  UserPreferences, 
  QuietHoursSettings,
  GlobalPolicy,
  DefaultPreferences,
  NotificationEvaluationRequest,
  NotificationEvaluationResult
} from './types';

/**
 * Интерфейс репозитория для работы с предпочтениями пользователей
 */
export interface IUserPreferencesRepository {
  /**
   * Получить все предпочтения пользователя
   */
  getUserPreferences(userId: string): Promise<UserPreferences | null>;

  /**
   * Создать или обновить предпочтение пользователя
   */
  upsertUserPreference(
    userId: string, 
    notificationType: NotificationType, 
    channel: Channel, 
    enabled: boolean
  ): Promise<UserPreference>;

  /**
   * Получить конкретное предпочтение пользователя
   */
  getUserPreference(
    userId: string, 
    notificationType: NotificationType, 
    channel: Channel
  ): Promise<UserPreference | null>;

  /**
   * Установить настройки quiet hours для пользователя
   */
  setQuietHours(userId: string, settings: QuietHoursSettings): Promise<QuietHoursSettings>;

  /**
   * Получить настройки quiet hours пользователя
   */
  getQuietHours(userId: string): Promise<QuietHoursSettings | null>;

  /**
   * Создать дефолтные настройки для нового пользователя
   */
  createDefaultPreferences(userId: string): Promise<UserPreferences>;
}

/**
 * Интерфейс репозитория для работы с глобальными политиками
 */
export interface IGlobalPoliciesRepository {
  /**
   * Получить все глобальные политики
   */
  getAllPolicies(): Promise<GlobalPolicy[]>;

  /**
   * Получить политику для конкретного типа, канала и региона
   */
  getPolicy(
    notificationType: NotificationType, 
    channel: Channel | undefined, 
    region: Region
  ): Promise<GlobalPolicy | null>;

  /**
   * Создать или обновить политику
   */
  upsertPolicy(policy: Omit<GlobalPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<GlobalPolicy>;
}

/**
 * Интерфейс репозитория для работы с дефолтными настройками
 */
export interface IDefaultPreferencesRepository {
  /**
   * Получить все дефолтные настройки
   */
  getAllDefaults(): Promise<DefaultPreferences[]>;

  /**
   * Получить дефолтную настройку для типа и канала
   */
  getDefault(
    notificationType: NotificationType, 
    channel: Channel
  ): Promise<DefaultPreferences | null>;

  /**
   * Создать или обновить дефолтную настройку
   */
  upsertDefault(defaultPref: Omit<DefaultPreferences, 'id' | 'createdAt' | 'updatedAt'>): Promise<DefaultPreferences>;
}

/**
 * Интерфейс сервиса для проверки возможности отправки уведомлений
 */
export interface INotificationEvaluationService {
  /**
   * Проверить возможность отправки уведомления
   */
  evaluateNotification(request: NotificationEvaluationRequest): Promise<NotificationEvaluationResult>;
}