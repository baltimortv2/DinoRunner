# DinoRunner — руководство для разработки

Этот файл для разработчиков. В продакшн не включается.

## Структура
- `backend/` — Node.js + Express. Статика в `backend/public`.
- Точка входа фронта: `backend/public/js/main.js`.
- Сервисы фронта подключены тегами в `backend/public/index.html`:
  - `js/services/connectionMonitor.js` → `window.ConnectionMonitor`
  - `js/services/telegramAuth.js` → `window.telegramAuthService`

## Локальный запуск
```
cd backend
cp env.example .env
npm install
npm run dev
```
Откройте http://localhost:3001

## CSP
В `src/app.js` включён Helmet CSP. Для разработки разрешены blob:, wss:, https:, telegram.org, а также 'unsafe-inline' и 'unsafe-eval'.

## Нюансы
- Не импортируйте сервисы как ES-модули из `main.js` — они уже подключены через `<script>` в `index.html`.
- Спрайты кладём в `backend/public/Sprites`. Серверный `deploy.sh` копирует из корневой `Sprites/` при деплое.

## CI/CD (GitHub Actions)
Workflow: `.github/workflows/deploy.yml`
Секреты (Settings → Secrets and variables → Actions):
- `SSH_HOST` = 109.172.89.107
- `SSH_PORT` = 22
- `SSH_USER` = root
- `SSH_KEY`  = приватный ключ (пара к `~/.ssh/github_deploy.pub` на сервере)

Серверный скрипт: `/var/www/dinorunner/deploy.sh` — git pull/clone, deps, PM2 restart.
