import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { 
  UserPreferenceEntity, 
  UserQuietHoursEntity, 
  GlobalPolicyEntity, 
  DefaultPreferenceEntity 
} from '../src/domain/entities';

/**
 * Тестовая база данных для интеграционных тестов
 */
export const TestDataSource = new DataSource({
  type: 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  username: process.env.TEST_DB_USERNAME || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  database: process.env.TEST_DB_DATABASE || 'notification_preferences_test',
  synchronize: true,
  dropSchema: true,
  logging: false,
  entities: [
    UserPreferenceEntity,
    UserQuietHoursEntity,
    GlobalPolicyEntity,
    DefaultPreferenceEntity
  ],
});

/**
 * Глобальная настройка перед всеми тестами
 */
beforeAll(async () => {
  try {
    if (!TestDataSource.isInitialized) {
      await TestDataSource.initialize();
      console.log('Test database initialized');
    }
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }
});

/**
 * Глобальная очистка после всех тестов
 */
afterAll(async () => {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
    console.log('Test database destroyed');
  }
});

/**
 * Очистка базы данных перед каждым тестом
 */
beforeEach(async () => {
  if (TestDataSource.isInitialized) {
    const entities = TestDataSource.entityMetadatas;
    
    for (const entity of entities) {
      const repository = TestDataSource.getRepository(entity.name);
      await repository.clear();
    }
    
    // Заполняем дефолтные настройки
    const defaultRepo = TestDataSource.getRepository(DefaultPreferenceEntity);
    const defaultPreferences = [
      { notificationType: 'transactional_email', channel: 'email', enabled: true },
      { notificationType: 'marketing_email', channel: 'email', enabled: false },
      { notificationType: 'transactional_sms', channel: 'sms', enabled: true },
      { notificationType: 'marketing_sms', channel: 'sms', enabled: false },
      { notificationType: 'transactional_push', channel: 'push', enabled: true },
      { notificationType: 'marketing_push', channel: 'push', enabled: false },
    ];
    
    for (const pref of defaultPreferences) {
      const entity = defaultRepo.create({
        notificationType: pref.notificationType as any,
        channel: pref.channel as any,
        enabled: pref.enabled
      });
      await defaultRepo.save(entity);
    }
  }
});