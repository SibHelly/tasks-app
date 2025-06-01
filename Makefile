# Makefile для управления Task Manager Application (Docker-версия)

# Файл использует .PHONY чтобы указать, что цели не являются файлами
.PHONY: up down build rebuild logs clean ps

### Основные команды управления контейнерами ###

# Запуск всех сервисов в фоновом режиме
up:
	docker-compose up -d

# Остановка и удаление всех контейнеров, сетей
down:
	docker-compose down

# Сборка всех сервисов
build:
	docker-compose build --no-cache frontend

# Пересборка и перезапуск всех сервисов (удобно после изменений в коде)
rebuild: down build up

# Просмотр логов всех сервисов в реальном времени
logs:
	docker-compose logs -f

# Очистка Docker системы (контейнеры, сети, volumes) - ОСТОРОЖНО: удаляет все неиспользуемые объекты!
clean:
	docker system prune -f

# Показать статус запущенных контейнеров
ps:
	docker-compose ps

### Команды для работы с фронтендом ###

# Просмотр логов фронтенда
frontend-logs:
	docker-compose logs -f frontend

# Вход в контейнер фронтенда (интерактивная сессия)
frontend-bash:
	docker-compose exec frontend sh

### Команды для работы с бэкендом ###

# Просмотр логов бэкенда
backend-logs:
	docker-compose logs -f backend

# Вход в контейнер бэкенда (интерактивная сессия)
backend-bash:
	docker-compose exec backend sh

### Команды для работы с базой данных ###

# Просмотр логов базы данных
db-logs:
	docker-compose logs -f database

# Вход в контейнер базы данных (интерактивная сессия)
db-bash:
	docker-compose exec database bash

# Подключение к MySQL в контейнере (интерактивный клиент)
db-connect:
	docker-compose exec database mysql -u root -psibhelly1837 plane_task_db

### Команды для управления миграциями ###

# Создание новой миграции (нужно указать имя через параметр name)
migrate-up:
	docker-compose exec backend ./migrate up

migrate-down:
	docker-compose exec backend ./migrate down

migrate-status:
	docker-compose exec backend ./migrate status