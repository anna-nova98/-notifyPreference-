# Инструкции по коммитам в GitHub

## Инициализация Git репозитория

1. Создайте новый репозиторий на GitHub:
   - Зайдите на GitHub.com
   - Нажмите "+" → "New repository"
   - Название: `notification-preferences-service`
   - Описание: `Notification Preferences Service for managing user notification preferences`
   - Public/Private: на ваш выбор
   - Не добавляйте README, .gitignore или лицензию (мы уже создали их)

2. Инициализируйте локальный Git репозиторий:
```bash
git init
git add .
git commit -m "Initial commit: Notification Preferences Service"
```

3. Привяжите удалённый репозиторий:
```bash
git remote add origin https://github.com/YOUR_USERNAME/notification-preferences-service.git
git branch -M main
git push -u origin main
```

## Структура коммитов

Рекомендуемая структура коммитов для этого проекта:

### Коммит 1: Базовая структура проекта
```
git add package.json tsconfig.json .gitignore .env.example
git commit -m "feat: initial project setup with TypeScript and dependencies"
```

### Коммит 2: Доменный слой
```
git add src/domain/
git commit -m "feat: add domain layer with types, entities and interfaces"
```

### Коммит 3: Инфраструктурный слой
```
git add src/infrastructure/ src/config/database.ts
git commit -m "feat: add infrastructure layer with TypeORM repositories"
```

### Коммит 4: Доменные сервисы
```
git add src/domain/services.ts
git commit -m "feat: implement domain services with business logic"
```

### Коммит 5: API слой
```
git add src/api/ src/app.ts src/index.ts
git commit -m "feat: add API layer with Express controllers and routes"
```

### Коммит 6: Тесты
```
git add tests/ jest.config.js
git commit -m "test: add unit and integration tests for domain and API"
```

### Коммит 7: Docker и документация
```
git add Dockerfile docker-compose.yml README.md examples/
git commit -m "docs: add Docker setup, README and usage examples"
```

### Коммит 8: Скрипты и утилиты
```
git add src/scripts/ package-examples.json COMMIT_INSTRUCTIONS.md
git commit -m "chore: add seed script and commit instructions"
```

## Альтернативный вариант: один коммит со всей структурой
```
git add .
git commit -m "feat: implement Notification Preferences Service

- Domain layer with types, entities and interfaces
- Infrastructure layer with TypeORM repositories  
- Business logic services for preferences and evaluation
- REST API with Express controllers
- Comprehensive test suite with Jest
- Docker setup for easy deployment
- Complete documentation and examples"
```

## Проверка работы приложения

Перед коммитом убедитесь, что проект собирается и тесты проходят:

```bash
# Проверка типов
npm run type-check

# Сборка
npm run build

# Запуск тестов
npm test

# Запуск в режиме разработки (в другом терминале)
npm run dev
```

## Публикация на GitHub

После коммитов:
```bash
# Первый пуш
git push origin main

# Или если уже делали пуш
git push
```

## Создание тегов версий

Для семантического версионирования:
```bash
# Создание тега v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0: Initial implementation of Notification Preferences Service"

# Пуш тегов
git push origin --tags
```

## Дополнительные команды

### Просмотр истории коммитов
```bash
git log --oneline --graph --decorate
```

### Отмена последнего коммита (локально)
```bash
git reset --soft HEAD~1
```

### Обновление удалённого репозитория после изменений
```bash
git pull origin main
git add .
git commit -m "Update: brief description"
git push
```

## Рекомендации по сообщениям коммитов

Используйте conventional commits:
- `feat:` - новая функциональность
- `fix:` - исправление бага
- `docs:` - изменения в документации
- `test:` - добавление или изменение тестов
- `chore:` - обновление зависимостей, конфигурации
- `refactor:` - рефакторинг кода без изменения функциональности
- `style:` - форматирование, пробелы, точки с запятой

Пример хорошего сообщения:
```
feat: add notification evaluation service

- Implement NotificationEvaluationService with business logic
- Add support for global policies and quiet hours
- Include comprehensive test coverage
- Add validation with Zod schemas
```