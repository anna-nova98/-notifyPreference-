import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { GlobalPolicyEntity } from '../domain/entities';
import { NotificationType, Channel, Region } from '../domain/types';

/**
 * Скрипт для заполнения начальных данных в базу
 */
async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Инициализируем подключение
    await AppDataSource.initialize();
    console.log('Database connected');
    
    const globalPolicyRepo = AppDataSource.getRepository(GlobalPolicyEntity);
    
    // Проверяем, есть ли уже данные
    const count = await globalPolicyRepo.count();
    
    if (count === 0) {
      console.log('Seeding global policies...');
      
      // Примеры глобальных политик
      const globalPolicies = [
        {
          notificationType: NotificationType.MARKETING_SMS,
          channel: Channel.SMS,
          region: Region.EU,
          enabled: false,
          description: 'GDPR compliance - marketing SMS prohibited in EU'
        },
        {
          notificationType: NotificationType.MARKETING_EMAIL,
          channel: Channel.EMAIL,
          region: Region.EU,
          enabled: true,
          description: 'Marketing emails allowed in EU with opt-in'
        },
        {
          notificationType: NotificationType.MARKETING_PUSH,
          region: Region.GLOBAL,
          enabled: true,
          description: 'Marketing push notifications allowed globally'
        },
        {
          notificationType: NotificationType.SECURITY_ALERT,
          region: Region.GLOBAL,
          enabled: true,
          description: 'Security alerts always allowed'
        }
      ];
      
      for (const policy of globalPolicies) {
        const entity = globalPolicyRepo.create(policy);
        await globalPolicyRepo.save(entity);
        console.log(`Created policy: ${policy.description}`);
      }
      
      console.log('Global policies seeded successfully');
    } else {
      console.log(`Database already has ${count} global policies, skipping seeding`);
    }
    
    await AppDataSource.destroy();
    console.log('Database connection closed');
    console.log('Seeding completed successfully');
    
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  }
}

// Запуск скрипта
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };