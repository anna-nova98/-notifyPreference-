# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Собираем TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Копируем зависимости и собранное приложение
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Меняем владельца файлов
RUN chown -R nodejs:nodejs /app

USER nodejs

# Открываем порт
EXPOSE 3000

# Команда запуска
CMD ["node", "dist/index.js"]