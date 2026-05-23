import { DataSource } from 'typeorm';
import { UserPreferenceEntity, UserQuietHoursEntity, GlobalPolicyEntity, DefaultPreferenceEntity } from '../domain/entities';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Конфигурация подключения к PostgreSQL
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'notification_preferences',
  synchronize: process.env.DB_SYNCHRONIZE === 'true' || true, // В продакшене false
  logging: process.env.DB_LOGGING === 'true' || false,
  entities: [
    UserPreferenceEntity,
    UserQuietHoursEntity,
    GlobalPolicyEntity,
    DefaultPreferenceEntity
  ],
  migrations: [],
  subscribers: [],
});

/**
 * Инициализация подключения к базе данных
 */
export async function initializeDatabase(): Promise<DataSource> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connection established');
      
      // Инициализируем дефолтные настройки
      await seedDefaultPreferences();
    }
    return AppDataSource;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}

/**
 * Заполнение дефолтных настроек
 */
async function seedDefaultPreferences(): Promise<void> {
  const defaultRepo = AppDataSource.getRepository(DefaultPreferenceEntity);
  const count = await defaultRepo.count();
  
  if (count === 0) {
    console.log('Seeding default preferences...');
    
    const defaultPreferences = [
      // Транзакционные уведомления включены по умолчанию
      { notificationType: 'transactional_email', channel: 'email', enabled: true },
      { notificationType: 'transactional_sms', channel: 'sms', enabled: true },
      { notificationType: 'transactional_push', channel: 'push', enabled: true },
      
      // Маркетинговые уведомления выключены по умолчанию
      { notificationType: 'marketing_email', channel: 'email', enabled: false },
      { notificationType: 'marketing_sms', channel: 'sms', enabled: false },
      { notificationType: 'marketing_push', channel: 'push', enabled: false },
      
      // Системные уведомления включены по умолчанию
      { notificationType: 'security_alert', channel: 'email', enabled: true },
      { notificationType: 'security_alert', channel: 'push', enabled: true },
      { notificationType: 'system_announcement', channel: 'email', enabled: true },
      { notificationType: 'system_announcement', channel: 'in_app', enabled: true },
    ];
    
    for (const pref of defaultPreferences) {
      const entity = defaultRepo.create({
        notificationType: pref.notificationType as any,
        channel: pref.channel as any,
        enabled: pref.enabled
      });
      await defaultRepo.save(entity);
    }
    
    console.log('Default preferences seeded successfully');
  }
}

/**
 * Закрытие подключения к базе данных
 */
export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
}