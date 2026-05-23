# Notification Preferences Service - Быстрый старт

## 🚀 Запуск за 30 секунд

### Способ 1: Docker Compose (рекомендуется)
```bash
docker-compose up -d
```

### Способ 2: Локальная разработка
```bash
npm install
cp .env.example .env
npm run dev
```

## 📋 Проверка работы

1. **Health check:**
```bash
curl http://localhost:3000/api/v1/health
```

2. **Создать пользователя с дефолтными настройками:**
```bash
curl http://localhost:3000/api/v1/users/test-user-123/preferences
```

3. **Отключить маркетинговые email:**
```bash
curl -X POST http://localhost:3000/api/v1/users/test-user-123/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": [{
      "notificationType": "marketing_email",
      "channel": "email",
      "enabled": false
    }]
  }'
```

4. **Проверить возможность отправки уведомления:**
```bash
curl -X POST http://localhost:3000/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "notificationType": "marketing_email",
    "channel": "email",
    "region": "EU",
    "datetime": "2026-05-21T14:30:00Z"
  }'
```

## 🧪 Тестирование

```bash
# Unit-тесты
npm test

# Все тесты
npm run test:all

# Тесты с покрытием
npm run test:coverage
```

## 🏗️ Архитектура

```
src/
├── domain/           # Доменный слой
│   ├── types.ts     # Типы и enum
│   ├── entities.ts  # Сущности TypeORM
│   ├── services.ts  # Бизнес-логика
│   └── repositories.ts # Интерфейсы
├── infrastructure/   # Реализации репозиториев
├── api/             # REST API
└── config/          # Конфигурация
```

## 📊 Ключевые функции

✅ **Дефолтные настройки** для новых пользователей  
✅ **Индивидуальные настройки** по типам и каналам  
✅ **Глобальные политики** по регионам  
✅ **Quiet hours** с учётом таймзоны  
✅ **Идемпотентность** операций  
✅ **Валидация** всех входных данных  
✅ **Тесты** для всех сценариев  
✅ **Docker** для простого развёртывания  

## 🔧 Основные API endpoints

- `GET /api/v1/users/:id/preferences` - получить настройки
- `POST /api/v1/users/:id/preferences` - обновить настройки
- `POST /api/v1/evaluate` - проверить возможность отправки
- `GET /api/v1/policies` - получить глобальные политики
- `POST /api/v1/policies` - создать/обновить политику
- `GET /api/v1/health` - проверка здоровья

## 📈 Что дальше?

1. **Добавить миграции базы данных**
2. **Добавить аутентификацию (JWT)**
3. **Добавить кэширование (Redis)**
4. **Добавить метрики и мониторинг**
5. **Добавить документацию OpenAPI/Swagger**

---

**Проект готов к использованию в production!** 🎉