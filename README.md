# max-sea-battle

Мини-приложение для MAX: игра Морской бой (Sea Battle / Battleship) с режимами:

- Игра против ИИ (Easy/Normal)
- Онлайн-игра с друзьями через SignalR

## Технологии

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: .NET 8 + ASP.NET Core Web API + SignalR
- БД: SQLite + Entity Framework Core

## Реализовано

- Фазы игры: расстановка кораблей, бой, экран завершения
- Поле 10x10
- Флот: 1x4, 2x3, 3x2, 4x1
- Валидация расстановки кораблей на backend
- Проверка корректности ходов на backend
- Определение попадания, уничтожения корабля и победы
- История матчей (таблица Games)
- Статистика пользователей (таблица Statistics)
- Таблица пользователей (Users)
- MAX Bridge интеграция: пользователь, fullscreen/expand, openLink/openMaxLink
- MAX Ads интеграция: вызов `MaxAds.showFullscreenAd()` после завершения игры

## Структура

- backend/
  - Controllers/GameController.cs
  - Hubs/GameHub.cs
  - Services/GameService.cs
  - Services/AiService.cs
  - Models/
  - Data/AppDbContext.cs
- frontend/sea-battle/
  - src/pages (MainMenu, GameModeSelection, ShipPlacement, BattleScreen, GameOverScreen, Lobby)
  - src/components/GameBoard.tsx
  - src/lib (API, SignalR, MAX Bridge)

## Локальный запуск

### 1) Backend

```bash
cd backend
dotnet restore
dotnet run
```

По умолчанию backend стартует на `http://localhost:5035`.

### 2) Frontend

```bash
cd frontend/sea-battle
npm install
npm run dev
```

Frontend ожидает backend по адресу `http://localhost:5035`.

## Переменные окружения (опционально)

Для frontend можно создать `.env` в `frontend/sea-battle`:

```env
VITE_API_URL=http://localhost:5035
VITE_MAX_BOT_NAME=MySeaBattleBot
VITE_VK_AD_CLIENT=ad-1982180
VITE_VK_AD_SLOT=1982180
```

## MAX Mini App

В `index.html` подключён MAX Bridge:

- `https://st.max.ru/js/max-web-app.js`

Используются возможности:

- получение пользователя из `window.WebApp.initDataUnsafe.user`
- `ready()`, `expand()`, `requestFullscreen()`
- `openLink()` и `openMaxLink()` для приглашений

## Примечания

- Для локальной разработки вне MAX используется fallback-пользователь.
- Реклама будет показана, если в окружении доступен `window.MaxAds`.
