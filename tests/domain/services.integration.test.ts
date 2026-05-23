import { 
  NotificationType, 
  Channel, 
  Region, 
  Decision, 
  DenyReason 
} from '../../src/domain/types';
import { 
  UserPreferencesService, 
  GlobalPoliciesService, 
  NotificationEvaluationService 
} from '../../src/domain/services';
import { 
  UserPreferencesRepository, 
  GlobalPoliciesRepository, 
  DefaultPreferencesRepository 
} from '../../src/infrastructure/repositories';
import { TestDataSource } from '../setup';

describe('Domain Services', () => {
  let userPrefsRepo: UserPreferencesRepository;
  let globalPoliciesRepo: GlobalPoliciesRepository;
  let defaultPrefsRepo: DefaultPreferencesRepository;
  let userPrefsService: UserPreferencesService;
  let globalPoliciesService: GlobalPoliciesService;
  let evaluationService: NotificationEvaluationService;

  const TEST_USER_ID = 'test-user-123';
  const TEST_USER_ID_2 = 'test-user-456';

  beforeAll(() => {
    userPrefsRepo = new UserPreferencesRepository(TestDataSource);
    globalPoliciesRepo = new GlobalPoliciesRepository(TestDataSource);
    defaultPrefsRepo = new DefaultPreferencesRepository(TestDataSource);
    
    userPrefsService = new UserPreferencesService(userPrefsRepo, defaultPrefsRepo);
    globalPoliciesService = new GlobalPoliciesService(globalPoliciesRepo);
    evaluationService = new NotificationEvaluationService(
      userPrefsRepo,
      globalPoliciesRepo,
      defaultPrefsRepo
    );
  });

  describe('UserPreferencesService', () => {
    test('should create default preferences for new user', async () => {
      const preferences = await userPrefsService.getUserPreferences(TEST_USER_ID);
      
      expect(preferences).toBeDefined();
      expect(preferences.userId).toBe(TEST_USER_ID);
      expect(preferences.preferences).toHaveLength(6); // 6 дефолтных настроек
      
      // Проверяем, что транзакционные включены, маркетинговые выключены
      const transactionalEmail = preferences.preferences.find(
        p => p.notificationType === NotificationType.TRANSACTIONAL_EMAIL && p.channel === Channel.EMAIL
      );
      expect(transactionalEmail?.enabled).toBe(true);
      
      const marketingEmail = preferences.preferences.find(
        p => p.notificationType === NotificationType.MARKETING_EMAIL && p.channel === Channel.EMAIL
      );
      expect(marketingEmail?.enabled).toBe(false);
    });

    test('should update user preferences', async () => {
      // Сначала получаем дефолтные настройки
      await userPrefsService.getUserPreferences(TEST_USER_ID_2);
      
      // Обновляем предпочтение
      const updates = [{
        notificationType: NotificationType.MARKETING_EMAIL,
        channel: Channel.EMAIL,
        enabled: true
      }];
      
      const results = await userPrefsService.updatePreferences(TEST_USER_ID_2, updates);
      
      expect(results).toHaveLength(1);
      expect(results[0].notificationType).toBe(NotificationType.MARKETING_EMAIL);
      expect(results[0].channel).toBe(Channel.EMAIL);
      expect(results[0].enabled).toBe(true);
      
      // Проверяем, что настройки сохранились
      const updatedPrefs = await userPrefsService.getUserPreferences(TEST_USER_ID_2);
      const marketingEmail = updatedPrefs.preferences.find(
        p => p.notificationType === NotificationType.MARKETING_EMAIL && p.channel === Channel.EMAIL
      );
      expect(marketingEmail?.enabled).toBe(true);
    });

    test('should set quiet hours for user', async () => {
      const quietHours = await userPrefsService.setQuietHours(
        TEST_USER_ID,
        true,
        'Europe/Moscow',
        22,
        8,
        [NotificationType.MARKETING_PUSH, NotificationType.MARKETING_EMAIL]
      );
      
      expect(quietHours.enabled).toBe(true);
      expect(quietHours.timezone).toBe('Europe/Moscow');
      expect(quietHours.interval.startHour).toBe(22);
      expect(quietHours.interval.endHour).toBe(8);
      expect(quietHours.applyToNotificationTypes).toContain(NotificationType.MARKETING_PUSH);
      
      // Проверяем, что настройки сохранились
      const userPrefs = await userPrefsService.getUserPreferences(TEST_USER_ID);
      expect(userPrefs.quietHours).toBeDefined();
      expect(userPrefs.quietHours?.enabled).toBe(true);
    });

    test('should throw error for invalid hours', async () => {
      await expect(
        userPrefsService.setQuietHours(
          TEST_USER_ID,
          true,
          'Europe/Moscow',
          25, // Неверный час
          8,
          [NotificationType.MARKETING_PUSH]
        )
      ).rejects.toThrow('Hours must be between 0 and 23');
    });
  });

  describe('GlobalPoliciesService', () => {
    test('should create and retrieve global policy', async () => {
      const policy = await globalPoliciesService.upsertPolicy(
        NotificationType.MARKETING_SMS,
        Region.EU,
        false,
        'GDPR compliance',
        Channel.SMS
      );
      
      expect(policy.notificationType).toBe(NotificationType.MARKETING_SMS);
      expect(policy.region).toBe(Region.EU);
      expect(policy.channel).toBe(Channel.SMS);
      expect(policy.enabled).toBe(false);
      expect(policy.description).toBe('GDPR compliance');
      
      // Проверяем получение всех политик
      const allPolicies = await globalPoliciesService.getAllPolicies();
      expect(allPolicies).toHaveLength(1);
      expect(allPolicies[0].notificationType).toBe(NotificationType.MARKETING_SMS);
    });

    test('should check if notification is allowed by global policy', async () => {
      // Создаём политику, запрещающую маркетинговые SMS в EU
      await globalPoliciesService.upsertPolicy(
        NotificationType.MARKETING_SMS,
        Region.EU,
        false,
        'GDPR compliance',
        Channel.SMS
      );
      
      // Проверяем запрещённую комбинацию
      const isAllowed1 = await globalPoliciesService.isAllowedByGlobalPolicy(
        NotificationType.MARKETING_SMS,
        Channel.SMS,
        Region.EU
      );
      expect(isAllowed1).toBe(false);
      
      // Проверяем разрешённую комбинацию (другой регион)
      const isAllowed2 = await globalPoliciesService.isAllowedByGlobalPolicy(
        NotificationType.MARKETING_SMS,
        Channel.SMS,
        Region.US
      );
      expect(isAllowed2).toBe(true);
      
      // Проверяем другой тип уведомлений в том же регионе
      const isAllowed3 = await globalPoliciesService.isAllowedByGlobalPolicy(
        NotificationType.TRANSACTIONAL_SMS,
        Channel.SMS,
        Region.EU
      );
      expect(isAllowed3).toBe(true);
    });
  });

  describe('NotificationEvaluationService', () => {
    test('should allow notification by default', async () => {
      const request = {
        userId: TEST_USER_ID,
        notificationType: NotificationType.TRANSACTIONAL_EMAIL,
        channel: Channel.EMAIL,
        region: Region.US,
        datetime: new Date('2026-05-21T14:30:00Z')
      };
      
      const result = await evaluationService.evaluateNotification(request);
      
      expect(result.decision).toBe(Decision.ALLOW);
      expect(result.reason).toBeUndefined();
    });

    test('should deny notification by global policy', async () => {
      // Создаём запрещающую политику
      await globalPoliciesService.upsertPolicy(
        NotificationType.MARKETING_SMS,
        Region.EU,
        false,
        'GDPR compliance',
        Channel.SMS
      );
      
      const request = {
        userId: TEST_USER_ID,
        notificationType: NotificationType.MARKETING_SMS,
        channel: Channel.SMS,
        region: Region.EU,
        datetime: new Date('2026-05-21T14:30:00Z')
      };
      
      const result = await evaluationService.evaluateNotification(request);
      
      expect(result.decision).toBe(Decision.DENY);
      expect(result.reason).toBe(DenyReason.GLOBAL_POLICY);
      expect(result.details).toContain('Global policy prohibits');
    });

    test('should deny notification by user preference', async () => {
      // Создаём пользователя и отключаем маркетинговые email
      await userPrefsService.getUserPreferences(TEST_USER_ID_2);
      await userPrefsService.updatePreferences(TEST_USER_ID_2, [{
        notificationType: NotificationType.MARKETING_EMAIL,
        channel: Channel.EMAIL,
        enabled: false
      }]);
      
      const request = {
        userId: TEST_USER_ID_2,
        notificationType: NotificationType.MARKETING_EMAIL,
        channel: Channel.EMAIL,
        region: Region.US,
        datetime: new Date('2026-05-21T14:30:00Z')
      };
      
      const result = await evaluationService.evaluateNotification(request);
      
      expect(result.decision).toBe(Decision.DENY);
      expect(result.reason).toBe(DenyReason.USER_DISABLED);
      expect(result.details).toContain('User has disabled');
    });

    test('should deny notification during quiet hours', async () => {
      // Устанавливаем quiet hours с 22:00 до 8:00 для маркетинговых пушей
      await userPrefsService.setQuietHours(
        TEST_USER_ID,
        true,
        'Europe/Moscow',
        22,
        8,
        [NotificationType.MARKETING_PUSH]
      );
      
      // Время 23:30 в Moscow time (20:30 UTC)
      const request = {
        userId: TEST_USER_ID,
        notificationType: NotificationType.MARKETING_PUSH,
        channel: Channel.PUSH,
        region: Region.US,
        datetime: new Date('2026-05-21T20:30:00Z') // 23:30 Moscow
      };
      
      const result = await evaluationService.evaluateNotification(request);
      
      expect(result.decision).toBe(Decision.DENY);
      expect(result.reason).toBe(DenyReason.QUIET_HOURS);
      expect(result.details).toContain('quiet hours');
    });

    test('should allow transactional notification during quiet hours', async () => {
      // Устанавливаем quiet hours только для маркетинговых
      await userPrefsService.setQuietHours(
        TEST_USER_ID,
        true,
        'Europe/Moscow',
        22,
        8,
        [NotificationType.MARKETING_PUSH, NotificationType.MARKETING_EMAIL]
      );
      
      // Транзакционное уведомление должно быть разрешено
      const request = {
        userId: TEST_USER_ID,
        notificationType: NotificationType.TRANSACTIONAL_PUSH,
        channel: Channel.PUSH,
        region: Region.US,
        datetime: new Date('2026-05-21T20:30:00Z') // 23:30 Moscow
      };
      
      const result = await evaluationService.evaluateNotification(request);
      
      expect(result.decision).toBe(Decision.ALLOW);
    });
  });
});