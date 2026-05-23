/**
 * Доменные типы для сервиса управления предпочтениями уведомлений
 */

/**
 * Типы уведомлений
 */
export enum NotificationType {
  TRANSACTIONAL_EMAIL = 'transactional_email',
  MARKETING_EMAIL = 'marketing_email',
  TRANSACTIONAL_SMS = 'transactional_sms',
  MARKETING_SMS = 'marketing_sms',
  TRANSACTIONAL_PUSH = 'transactional_push',
  MARKETING_PUSH = 'marketing_push',
  SECURITY_ALERT = 'security_alert',
  SYSTEM_ANNOUNCEMENT = 'system_announcement'
}

/**
 * Каналы доставки уведомлений
 */
export enum Channel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram'
}

/**
 * Регионы для глобальных политик
 */
export enum Region {
  EU = 'EU',
  US = 'US',
  ASIA = 'ASIA',
  GLOBAL = 'GLOBAL',
  RU = 'RU',
  UK = 'UK'
}

/**
 * Решение о разрешении отправки
 */
export enum Decision {
  ALLOW = 'allow',
  DENY = 'deny'
}

/**
 * Причины отказа в отправке
 */
export enum DenyReason {
  USER_DISABLED = 'user_disabled',
  QUIET_HOURS = 'quiet_hours',
  GLOBAL_POLICY = 'global_policy',
  CHANNEL_DISABLED = 'channel_disabled',
  NOTIFICATION_TYPE_DISABLED = 'notification_type_disabled'
}

/**
 * Интервал времени для quiet hours
 */
export interface TimeInterval {
  startHour: number; // 0-23
  endHour: number;   // 0-23
}

/**
 * Настройки quiet hours пользователя
 */
export interface QuietHoursSettings {
  enabled: boolean;
  timezone: string; // IANA timezone, например "Europe/Moscow"
  interval: TimeInterval;
  applyToNotificationTypes: NotificationType[];
}

/**
 * Предпочтение пользователя для конкретного типа уведомлений и канала
 */
export interface UserPreference {
  notificationType: NotificationType;
  channel: Channel;
  enabled: boolean;
  updatedAt: Date;
}

/**
 * Полные настройки пользователя
 */
export interface UserPreferences {
  userId: string;
  preferences: UserPreference[];
  quietHours?: QuietHoursSettings;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Глобальная политика
 */
export interface GlobalPolicy {
  id: string;
  notificationType: NotificationType;
  channel?: Channel; // если не указан, применяется ко всем каналам для этого типа
  region: Region;
  enabled: boolean; // false = запрещено
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Запрос на проверку возможности отправки
 */
export interface NotificationEvaluationRequest {
  userId: string;
  notificationType: NotificationType;
  channel: Channel;
  region: Region;
  datetime: Date;
}

/**
 * Результат проверки возможности отправки
 */
export interface NotificationEvaluationResult {
  decision: Decision;
  reason?: DenyReason;
  details?: string;
}

/**
 * Запрос на обновление предпочтений
 */
export interface UpdatePreferencesRequest {
  preferences?: {
    notificationType: NotificationType;
    channel: Channel;
    enabled: boolean;
  }[];
  quietHours?: {
    enabled: boolean;
    timezone: string;
    startHour: number;
    endHour: number;
    applyToNotificationTypes: NotificationType[];
  };
}

/**
 * Дефолтные настройки для новых пользователей
 */
export interface DefaultPreferences {
  notificationType: NotificationType;
  channel: Channel;
  enabled: boolean;
}