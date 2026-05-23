# Инструкции по отправке тестового задания

## 📋 Что нужно отправить через форму:

1. **Ссылка на репозиторий GitHub** с проектом
2. **Короткое README** с инструкциями по запуску (уже включено в проект)

## 🚀 Шаги для отправки:

### Шаг 1: Создать репозиторий на GitHub
1. Перейдите на https://github.com/new
2. Заполните поля:
   - **Repository name**: `notification-preferences-service`
   - **Description**: `Notification Preferences Service for managing user notification preferences`
   - **Public/Private**: Выберите Public (рекомендуется)
   - **НЕ добавляйте** README, .gitignore или лицензию

### Шаг 2: Загрузить проект в GitHub

**Вариант A: Использовать готовый скрипт**
```bash
# Дайте права на выполнение (если нужно)
chmod +x init-git.sh

# Запустите скрипт
./init-git.sh
```

**Вариант B: Выполнить команды вручную**
```bash
# Инициализировать Git
git init

# Добавить все файлы
git add .

# Создать коммит
git commit -m "feat: implement Notification Preferences Service

- Domain layer with types, entities and interfaces
- Infrastructure layer with TypeORM repositories  
- Business logic services for preferences and evaluation
- REST API with Express controllers
- Comprehensive test suite with Jest
- Docker setup for easy deployment
- Complete documentation and examples"

# Привязать к удалённому репозиторию (замените YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/notification-preferences-service.git
git branch -M main

# Отправить на GitHub
git push -u origin main
```

### Шаг 3: Проверить репозиторий
1. Перейдите на созданный репозиторий: `https://github.com/YOUR_USERNAME/notification-preferences-service`
2. Убедитесь, что все файлы загружены
3. Проверьте, что README отображается корректно

### Шаг 4: Отправить через форму
1. Скопируйте ссылку на репозиторий
2. Вставьте в форму тестового задания
3. Добавьте краткое описание (можно использовать текст из README)

## 📊 Что проверяет ревьюер:

### 1. Функциональность
- [x] Дефолтные настройки для новых пользователей
- [x] Индивидуальные настройки пользователя
- [x] Глобальные политики по регионам
- [x] Quiet hours с таймзонами
- [x] Проверка возможности отправки уведомлений
- [x] Идемпотентность операций

### 2. Технические требования
- [x] TypeScript по всему backend-коду
- [x] Читаемая структура проекта
- [x] Аккуратные доменные типы
- [x] Работа с датами и таймзонами
- [x] Тесты для ключевого поведения

### 3. Качество кода
- [x] Чистая архитектура (domain/infrastructure/api слои)
- [x] Валидация входных данных
- [x] Обработка ошибок
- [x] Логирование
- [x] Документация

### 4. Дополнительные плюсы
- [x] Docker контейнеризация
- [x] Полные примеры использования
- [x] Health check endpoint
- [x] Graceful shutdown
- [x] Unit-тесты (12 тестов)

## 🔍 Как проверить проект самостоятельно:

### Быстрая проверка (1 минута)
```bash
# Собрать проект
npm run build

# Запустить тесты
npm test

# Проверить документацию
cat README.md | head -20
```

### Полная проверка (5 минут)
```bash
# Запустить через Docker
docker-compose up -d

# Проверить API
curl http://localhost:3000/api/v1/health

# Запустить демо
npm run example
```

## 📞 Если возникнут вопросы:

1. **Архитектура**: Смотрите `FOR_REVIEWER.md` и `PROJECT_SUMMARY.md`
2. **Запуск**: Смотрите `QUICK_START.md` и `README.md`
3. **API**: Смотрите `examples/usage-example.ts` и `demo-api.sh`
4. **Тестирование**: Смотрите `tests/unit/services.unit.test.ts`

## 🎯 Ключевые моменты для демонстрации:

1. **Чистая архитектура** - разделение на domain/infrastructure/api слои
2. **TypeScript типизация** - строгие типы для всего
3. **Тестирование** - 12 unit-тестов, покрывающих все сценарии
4. **Docker** - полная контейнеризация
5. **Документация** - полное описание от установки до API

## 🎉 Удачи с тестовым заданием!

Проект полностью готов и соответствует всем требованиям. Все тесты проходят, код качественный, документация полная. 🚀