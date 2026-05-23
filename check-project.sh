#!/bin/bash

echo "=== Проверка Notification Preferences Service ==="
echo

# Проверка TypeScript компиляции
echo "1. Проверка компиляции TypeScript..."
npm run build
if [ $? -eq 0 ]; then
    echo "✓ TypeScript компиляция успешна"
else
    echo "✗ Ошибка компиляции TypeScript"
    exit 1
fi

echo

# Проверка unit-тестов
echo "2. Запуск unit-тестов..."
npm test
if [ $? -eq 0 ]; then
    echo "✓ Unit-тесты прошли успешно"
else
    echo "✗ Ошибка в unit-тестах"
    exit 1
fi

echo

# Проверка структуры проекта
echo "3. Проверка структуры проекта..."
if [ -f "package.json" ] && [ -f "tsconfig.json" ] && [ -f "Dockerfile" ] && [ -f "docker-compose.yml" ] && [ -f "README.md" ]; then
    echo "✓ Основные файлы проекта присутствуют"
else
    echo "✗ Отсутствуют некоторые файлы проекта"
    exit 1
fi

echo

# Проверка исходного кода
echo "4. Проверка исходного кода..."
if [ -d "src/domain" ] && [ -d "src/infrastructure" ] && [ -d "src/api" ] && [ -d "tests" ]; then
    echo "✓ Структура каталогов корректна"
else
    echo "✗ Неправильная структура каталогов"
    exit 1
fi

echo

# Проверка зависимостей
echo "5. Проверка зависимостей..."
if [ -f "package-lock.json" ] || [ -f "yarn.lock" ]; then
    echo "✓ Зависимости установлены"
else
    echo "⚠ Зависимости не установлены. Запустите 'npm install'"
fi

echo

echo "=== Проект готов к использованию! ==="
echo
echo "Инструкции по запуску:"
echo "1. Docker Compose: docker-compose up -d"
echo "2. Локальная разработка: npm run dev"
echo "3. Тесты: npm test"
echo "4. Сборка: npm run build"
echo
echo "API будет доступно по адресу: http://localhost:3000"
echo "Документация API: http://localhost:3000/api/v1"