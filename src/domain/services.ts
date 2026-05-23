import { 
  NotificationType, 
  Channel, 
  Region, 
  Decision, 
  DenyReason,
  NotificationEvaluationRequest, 
  NotificationEvaluationResult,
  UserPreference,
  QuietHoursSettings,
  GlobalPolicy,
  DefaultPreferences
} from './types';
import { 
  IUserPreferencesRepository, 
  IGlobalPoliciesRepository, 
  IDefaultPreferencesRepository,
  INotificationEvaluationService
} from './repositories';
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';

/**
 * Сервис для проверки возможности отправки уведомлений
 */
export class NotificationEvaluationService implements INotificationEvaluationService {
  constructor(
    private userPrefsRepo: IUserPreferencesRepository,
    private globalPoliciesRepo: IGlobalPoliciesRepository,
    private defaultPrefsRepo: IDefaultPreferencesRepository
  ) {}

  async evaluateNotification(request: NotificationEvaluationRequest): Promise<NotificationEvaluationResult> {
    const { userId, notificationType, channel, region, datetime } = request;

    // 1. Проверка глобальных политик
    const globalPolicy = await this.globalPoliciesRepo.getPolicy(notificationType, channel, region);
    if (globalPolicy && !globalPolicy.enabled) {
      return {
        decision: Decision.DENY,
        reason: DenyReason.GLOBAL_POLICY,
        details: `Global policy prohibits ${notificationType} in ${region} region`
      };
    }

    // 2. Получение предпочтений пользователя
    const userPreference = await this.userPrefsRepo.getUserPreference(userId, notificationType, channel);
    
    // 3. Если нет пользовательских настроек, используем дефолтные
    let isEnabled: boolean;
    if (userPreference) {
      isEnabled = userPreference.enabled;
    } else {
      const defaultPref = await this.defaultPrefsRepo.getDefault(notificationType, channel);
      isEnabled = defaultPref?.enabled ?? true; // По умолчанию разрешено
    }

    if (!isEnabled) {
      return {
        decision: Decision.DENY,
        reason: DenyReason.USER_DISABLED,
        details: `User has disabled ${notificationType} via ${channel}`
      };
    }

    // 4. Проверка quiet hours
    const quietHours = await this.userPrefsRepo.getQuietHours(userId);
    if (quietHours?.enabled && this.isWithinQuietHours(datetime, quietHours)) {
      const appliesToType = quietHours.applyToNotificationTypes.includes(notificationType);
      if (appliesToType) {
        return {
          decision: Decision.DENY,
          reason: DenyReason.QUIET_HOURS,
          details: `Notification falls within quiet hours (${quietHours.interval.startHour}:00-${quietHours.interval.endHour}:00 ${quietHours.timezone})`
        };
      }
    }

    // 5. Все проверки пройдены
    return {
      decision: Decision.ALLOW,
      details: 'All checks passed'
    };
  }

  /**
   * Проверяет, попадает ли время в quiet hours с учётом таймзоны
   */
  private isWithinQuietHours(datetime: Date, quietHours: QuietHoursSettings): boolean {
    try {
      // Конвертируем время в таймзону пользователя
      // Получаем час в таймзоне пользователя
      const userHour = parseInt(formatInTimeZone(datetime, quietHours.timezone, 'HH'));
      
      // Проверяем интервал (учитываем, что интервал может переходить через полночь)
      const { startHour, endHour } = quietHours.interval;
      
      if (startHour <= endHour) {
        // Обычный интервал в пределах одного дня
        return userHour >= startHour && userHour < endHour;
      } else {
        // Интервал переходит через полночь
        return userHour >= startHour || userHour < endHour;
      }
    } catch (error) {
      // В случае ошибки с таймзоной считаем, что не в quiet hours
      console.error(`Error checking quiet hours: ${error}`);
      return false;
    }
  }
}

/**
 * Сервис для управления предпочтениями пользователей
 */
export class UserPreferencesService {
  constructor(
    private userPrefsRepo: IUserPreferencesRepository,
    private defaultPrefsRepo: IDefaultPreferencesRepository
  ) {}

  /**
   * Получить полные настройки пользователя
   */
  async getUserPreferences(userId: string) {
    let preferences = await this.userPrefsRepo.getUserPreferences(userId);
    
    if (!preferences) {
      // Создаём дефолтные настройки для нового пользователя
      preferences = await this.userPrefsRepo.createDefaultPreferences(userId);
    }
    
    return preferences;
  }

  /**
   * Обновить предпочтения пользователя
   */
  async updatePreferences(
    userId: string, 
    updates: { 
      notificationType: NotificationType; 
      channel: Channel; 
      enabled: boolean;
    }[]
  ) {
    const results: UserPreference[] = [];
    
    for (const update of updates) {
      const result = await this.userPrefsRepo.upsertUserPreference(
        userId, 
        update.notificationType, 
        update.channel, 
        update.enabled
      );
      results.push(result);
    }
    
    return results;
  }

  /**
   * Установить quiet hours для пользователя
   */
  async setQuietHours(
    userId: string, 
    enabled: boolean, 
    timezone: string, 
    startHour: number, 
    endHour: number,
    applyToNotificationTypes: NotificationType[]
  ) {
    // Валидация часов
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
      throw new Error('Hours must be between 0 and 23');
    }
    
    // Валидация таймзоны (упрощённая)
    if (!timezone || timezone.trim() === '') {
      throw new Error('Timezone is required');
    }
    
    const settings: QuietHoursSettings = {
      enabled,
      timezone,
      interval: { startHour, endHour },
      applyToNotificationTypes
    };
    
    return await this.userPrefsRepo.setQuietHours(userId, settings);
  }
}

/**
 * Сервис для управления глобальными политиками
 */
export class GlobalPoliciesService {
  constructor(private globalPoliciesRepo: IGlobalPoliciesRepository) {}

  /**
   * Получить все политики
   */
  async getAllPolicies() {
    return await this.globalPoliciesRepo.getAllPolicies();
  }

  /**
   * Создать или обновить политику
   */
  async upsertPolicy(
    notificationType: NotificationType,
    region: Region,
    enabled: boolean,
    description: string,
    channel?: Channel
  ) {
    return await this.globalPoliciesRepo.upsertPolicy({
      notificationType,
      channel,
      region,
      enabled,
      description
    });
  }

  /**
   * Проверить, разрешена ли отправка по глобальным политикам
   */
  async isAllowedByGlobalPolicy(
    notificationType: NotificationType,
    channel: Channel,
    region: Region
  ): Promise<boolean> {
    const policy = await this.globalPoliciesRepo.getPolicy(notificationType, channel, region);
    
    // Если есть политика для конкретного канала
    if (policy) {
      return policy.enabled;
    }
    
    // Проверяем политику для всех каналов этого типа
    const typePolicy = await this.globalPoliciesRepo.getPolicy(notificationType, undefined, region);
    if (typePolicy) {
      return typePolicy.enabled;
    }
    
    // Если политик нет - разрешено по умолчанию
    return true;
  }
}