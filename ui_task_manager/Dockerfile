# Используем более легкий образ для сборки
FROM node:18-alpine AS builder

WORKDIR /app

# 1. Копируем только файлы, необходимые для установки зависимостей
COPY package.json package-lock.json ./

# 2. Устанавливаем зависимости с очисткой кэша
RUN npm ci --omit=dev --legacy-peer-deps && \
    npm cache clean --force

# 3. Копируем исходный код
COPY . .

# 4. Сборка с ограничением памяти (важно для 1 ГБ RAM!)
ENV NODE_OPTIONS="--max-old-space-size=512"
RUN npm run build

# 5. Финальный образ
FROM node:18-alpine

# Устанавливаем serve без кэша
RUN npm install -g serve@14.2.0 && \
    npm cache clean --force

# Создаем non-root пользователя
RUN addgroup -g 1001 -S reactgroup && \
    adduser -S reactuser -u 1001 -G reactgroup

WORKDIR /app

# Копируем собранное приложение
COPY --from=builder --chown=reactuser:reactgroup /app/build ./build

USER reactuser

EXPOSE 3000

# Оптимизированный healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:3000 || exit 1

# Запуск с более безопасными параметрами
CMD ["serve", "-s", "build", "-l", "3000", "--no-port-switching"]