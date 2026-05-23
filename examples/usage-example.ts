/**
 * Пример использования Notification Preferences Service
 * 
 * Этот скрипт демонстрирует основные сценарии работы сервиса
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function runExamples() {
  console.log('=== Notification Preferences Service Examples ===\n');
  
  try {
    // 1. Проверка здоровья сервиса
    console.log('1. Health check:');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log(`   Status: ${healthResponse.data.status}`);
    console.log(`   Database: ${healthResponse.data.database}\n`);
    
    const userId = `test-user-${Date.now()}`;
    
    // 2. Получение дефолтных настроек для нового пользователя
    console.log('2. Getting default preferences for new user:');
    const preferencesResponse = await axios.get(`${API_BASE_URL}/users/${userId}/preferences`);
    console.log(`   User ID: ${preferencesResponse.data.data.userId}`);
    console.log(`   Number of preferences: ${preferencesResponse.data.data.preferences.length}`);
    
    // Показываем некоторые дефолтные настройки
    const transactionalEmail = preferencesResponse.data.data.preferences.find(
      (p: any) => p.notificationType === 'transactional_email' && p.channel === 'email'
    );
    const marketingEmail = preferencesResponse.data.data.preferences.find(
      (p: any) => p.notificationType === 'marketing_email' && p.channel === 'email'
    );
    
    console.log(`   Transactional email enabled: ${transactionalEmail.enabled}`);
    console.log(`   Marketing email enabled: ${marketingEmail.enabled}\n`);
    
    // 3. Отключение маркетинговых email
    console.log('3. Disabling marketing emails:');
    const updateResponse = await axios.post(`${API_BASE_URL}/users/${userId}/preferences`, {
      preferences: [{
        notificationType: 'marketing_email',
        channel: 'email',
        enabled: false
      }]
    });
    console.log(`   Update successful: ${updateResponse.data.success}\n`);
    
    // 4. Настройка quiet hours
    console.log('4. Setting quiet hours (22:00-08:00 Moscow time):');
    const quietHoursResponse = await axios.post(`${API_BASE_URL}/users/${userId}/preferences`, {
      quietHours: {
        enabled: true,
        timezone: 'Europe/Moscow',
        startHour: 22,
        endHour: 8,
        applyToNotificationTypes: ['marketing_push', 'marketing_email']
      }
    });
    console.log(`   Quiet hours enabled: ${quietHoursResponse.data.data.quietHours.enabled}`);
    console.log(`   Timezone: ${quietHoursResponse.data.data.quietHours.timezone}\n`);
    
    // 5. Проверка возможности отправки уведомления (разрешено)
    console.log('5. Checking if transactional email is allowed (should be allowed):');
    const eval1Response = await axios.post(`${API_BASE_URL}/evaluate`, {
      userId,
      notificationType: 'transactional_email',
      channel: 'email',
      region: 'US',
      datetime: '2026-05-21T14:30:00Z' // Дневное время
    });
    console.log(`   Decision: ${eval1Response.data.data.decision}`);
    console.log(`   Reason: ${eval1Response.data.data.reason || 'N/A'}\n`);
    
    // 6. Проверка возможности отправки уведомления (запрещено из-за quiet hours)
    console.log('6. Checking if marketing push is allowed during quiet hours (should be denied):');
    const eval2Response = await axios.post(`${API_BASE_URL}/evaluate`, {
      userId,
      notificationType: 'marketing_push',
      channel: 'push',
      region: 'US',
      datetime: '2026-05-21T20:30:00Z' // 23:30 Moscow time (в quiet hours)
    });
    console.log(`   Decision: ${eval2Response.data.data.decision}`);
    console.log(`   Reason: ${eval2Response.data.data.reason}`);
    console.log(`   Details: ${eval2Response.data.data.details}\n`);
    
    // 7. Создание глобальной политики
    console.log('7. Creating global policy (prohibiting marketing SMS in EU):');
    const policyResponse = await axios.post(`${API_BASE_URL}/policies`, {
      notificationType: 'marketing_sms',
      channel: 'sms',
      region: 'EU',
      enabled: false,
      description: 'GDPR compliance - marketing SMS prohibited in EU'
    });
    console.log(`   Policy created: ${policyResponse.data.success}`);
    console.log(`   Description: ${policyResponse.data.data.description}\n`);
    
    // 8. Проверка влияния глобальной политики
    console.log('8. Checking if marketing SMS is allowed in EU (should be denied by global policy):');
    const eval3Response = await axios.post(`${API_BASE_URL}/evaluate`, {
      userId,
      notificationType: 'marketing_sms',
      channel: 'sms',
      region: 'EU',
      datetime: '2026-05-21T14:30:00Z'
    });
    console.log(`   Decision: ${eval3Response.data.data.decision}`);
    console.log(`   Reason: ${eval3Response.data.data.reason}`);
    console.log(`   Details: ${eval3Response.data.data.details}\n`);
    
    // 9. Получение всех глобальных политик
    console.log('9. Getting all global policies:');
    const policiesResponse = await axios.get(`${API_BASE_URL}/policies`);
    console.log(`   Number of policies: ${policiesResponse.data.data.length}`);
    policiesResponse.data.data.forEach((policy: any, index: number) => {
      console.log(`   ${index + 1}. ${policy.description} (${policy.region})`);
    });
    
    console.log('\n=== All examples completed successfully ===');
    
  } catch (error: any) {
    console.error('Error running examples:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Запуск примеров
if (require.main === module) {
  console.log('Note: Make sure the service is running on http://localhost:3000');
  console.log('Run: npm run dev or docker-compose up\n');
  
  runExamples();
}

export { runExamples };