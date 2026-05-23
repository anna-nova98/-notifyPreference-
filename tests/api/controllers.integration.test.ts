import request from 'supertest';
import express from 'express';
import { createRoutes } from '../../src/api/routes';
import { TestDataSource } from '../setup';
import { DefaultPreferenceEntity } from '../../src/domain/entities';
import { NotificationType, Channel, Region } from '../../src/domain/types';

describe('API Controllers', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/v1', createRoutes());
    
    // Заполняем дефолтные настройки
    const defaultRepo = TestDataSource.getRepository(DefaultPreferenceEntity);
    const defaultPreferences = [
      { notificationType: 'transactional_email', channel: 'email', enabled: true },
      { notificationType: 'marketing_email', channel: 'email', enabled: false },
      { notificationType: 'transactional_sms', channel: 'sms', enabled: true },
      { notificationType: 'marketing_sms', channel: 'sms', enabled: false },
    ];
    
    for (const pref of defaultPreferences) {
      const entity = defaultRepo.create({
        notificationType: pref.notificationType as any,
        channel: pref.channel as any,
        enabled: pref.enabled
      });
      await defaultRepo.save(entity);
    }
  });

  describe('Health Check', () => {
    test('GET /api/v1/health should return healthy status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('User Preferences', () => {
    const TEST_USER_ID = 'api-test-user-123';

    test('GET /api/v1/users/:id/preferences should return default preferences for new user', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${TEST_USER_ID}/preferences`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(TEST_USER_ID);
      expect(response.body.data.preferences).toHaveLength(4); // 4 дефолтных настройки
      
      // Проверяем дефолтные значения
      const transactionalEmail = response.body.data.preferences.find(
        (p: any) => p.notificationType === 'transactional_email' && p.channel === 'email'
      );
      expect(transactionalEmail.enabled).toBe(true);
      
      const marketingEmail = response.body.data.preferences.find(
        (p: any) => p.notificationType === 'marketing_email' && p.channel === 'email'
      );
      expect(marketingEmail.enabled).toBe(false);
    });

    test('POST /api/v1/users/:id/preferences should update user preferences', async () => {
      const updateData = {
        preferences: [
          {
            notificationType: NotificationType.MARKETING_EMAIL,
            channel: Channel.EMAIL,
            enabled: true
          }
        ]
      };
      
      const response = await request(app)
        .post(`/api/v1/users/${TEST_USER_ID}/preferences`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');
      
      // Проверяем, что настройки обновились
      const getResponse = await request(app)
        .get(`/api/v1/users/${TEST_USER_ID}/preferences`)
        .expect(200);
      
      const marketingEmail = getResponse.body.data.preferences.find(
        (p: any) => p.notificationType === 'marketing_email' && p.channel === 'email'
      );
      expect(marketingEmail.enabled).toBe(true);
    });

    test('POST /api/v1/users/:id/preferences should set quiet hours', async () => {
      const updateData = {
        quietHours: {
          enabled: true,
          timezone: 'Europe/Moscow',
          startHour: 22,
          endHour: 8,
          applyToNotificationTypes: [NotificationType.MARKETING_PUSH, NotificationType.MARKETING_EMAIL]
        }
      };
      
      const response = await request(app)
        .post(`/api/v1/users/${TEST_USER_ID}/preferences`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.quietHours).toBeDefined();
      expect(response.body.data.quietHours.enabled).toBe(true);
      expect(response.body.data.quietHours.timezone).toBe('Europe/Moscow');
    });

    test('POST /api/v1/users/:id/preferences should validate input', async () => {
      const invalidData = {
        preferences: [
          {
            notificationType: 'invalid_type', // Неверный тип
            channel: Channel.EMAIL,
            enabled: true
          }
        ]
      };
      
      const response = await request(app)
        .post(`/api/v1/users/${TEST_USER_ID}/preferences`)
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toBeDefined();
    });
  });

  describe('Notification Evaluation', () => {
    const TEST_USER_ID = 'eval-test-user-123';

    test('POST /api/v1/evaluate should allow notification by default', async () => {
      const requestData = {
        userId: TEST_USER_ID,
        notificationType: NotificationType.TRANSACTIONAL_EMAIL,
        channel: Channel.EMAIL,
        region: Region.US,
        datetime: '2026-05-21T14:30:00Z'
      };
      
      const response = await request(app)
        .post('/api/v1/evaluate')
        .send(requestData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.decision).toBe('allow');
    });

    test('POST /api/v1/evaluate should deny notification by global policy', async () => {
      // Сначала создаём глобальную политику
      await request(app)
        .post('/api/v1/policies')
        .send({
          notificationType: NotificationType.MARKETING_SMS,
          region: Region.EU,
          enabled: false,
          description: 'GDPR compliance',
          channel: Channel.SMS
        })
        .expect(200);
      
      const requestData = {
        userId: TEST_USER_ID,
        notificationType: NotificationType.MARKETING_SMS,
        channel: Channel.SMS,
        region: Region.EU,
        datetime: '2026-05-21T14:30:00Z'
      };
      
      const response = await request(app)
        .post('/api/v1/evaluate')
        .send(requestData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.decision).toBe('deny');
      expect(response.body.data.reason).toBe('global_policy');
    });

    test('POST /api/v1/evaluate should validate input', async () => {
      const invalidData = {
        userId: TEST_USER_ID,
        notificationType: 'invalid_type',
        channel: Channel.EMAIL,
        region: Region.US,
        datetime: 'invalid-date'
      };
      
      const response = await request(app)
        .post('/api/v1/evaluate')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('Global Policies', () => {
    test('GET /api/v1/policies should return empty list initially', async () => {
      const response = await request(app)
        .get('/api/v1/policies')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    test('POST /api/v1/policies should create new policy', async () => {
      const policyData = {
        notificationType: NotificationType.MARKETING_SMS,
        region: Region.EU,
        enabled: false,
        description: 'GDPR compliance',
        channel: Channel.SMS
      };
      
      const response = await request(app)
        .post('/api/v1/policies')
        .send(policyData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.notificationType).toBe(NotificationType.MARKETING_SMS);
      expect(response.body.data.region).toBe(Region.EU);
      expect(response.body.data.enabled).toBe(false);
      
      // Проверяем, что политика добавилась в список
      const getResponse = await request(app)
        .get('/api/v1/policies')
        .expect(200);
      
      expect(getResponse.body.data).toHaveLength(1);
      expect(getResponse.body.data[0].description).toBe('GDPR compliance');
    });

    test('POST /api/v1/policies should require required fields', async () => {
      const incompleteData = {
        region: Region.EU,
        enabled: false
        // Нет notificationType и description
      };
      
      const response = await request(app)
        .post('/api/v1/policies')
        .send(incompleteData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.error).toContain('required');
    });
  });
});