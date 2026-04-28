# Mini Telegram Clone - Secure Version

Веб-приложение для обмена сообщениями с акцентом на безопасность и приватность.

## 📋 Описание

Проект представляет собой клон Telegram с базовым функционалом чата, реализованный на стеке **FastAPI** (backend) и **React** (frontend). Приложение поддерживает аутентификацию, создание чатов, обмен сообщениями в реальном времени через WebSocket, а также включает механизмы безопасности (rate limiting, CORS, security headers).

---

## 🚀 Основные возможности

### Реализовано
- ✅ Аутентификация пользователей (JWT)
- ✅ Создание и управление чатами
- ✅ Обмен сообщениями в реальном времени (WebSocket)
- ✅ Статусы сообщений (доставлено/прочитано)
- ✅ Детали в списке чатов (последнее сообщение, время, аватары)
- ✅ Переход на PostgreSQL
- ✅ Rate limiting для защиты от злоупотреблений
- ✅ Security headers (CORS, XSS, Clickjacking protection)

### В разработке
- 🔄 Отправка файлов/изображений
- 🔄 Поиск сообщений
- 🔄 Редактирование/удаление сообщений
- 🔄 Ответ на сообщения (как в Telegram)
- 🔄 Пагинация сообщений
- 🔄 Индикатор "печатает..."
- 🔄 Эмодзи реакции
- 🔄 Групповые чаты
- 🔄 Уведомления (push/browser)

---

## 🛠️ Технологический стек

### Backend
- **FastAPI** — современный веб-фреймворк на Python
- **SQLAlchemy** — ORM для работы с базой данных
- **PostgreSQL** — основная СУБД (через `psycopg2-binary`)
- **SQLite** — резервная БД для разработки
- **Pydantic** — валидация данных
- **Passlib + bcrypt** — хеширование паролей
- **python-jose** — работа с JWT токенами
- **SlowAPI** — rate limiting
- **WebSockets** — реальное время

### Frontend
- **React 19** — UI библиотека
- **Vite** — сборщик проектов
- **TanStack Query (React Query)** — управление серверным состоянием
- **Axios** — HTTP клиент
- **Emoji Picker React** — выбор эмодзи
- **JS Cookie** — работа с cookie

---

## 📦 Установка и запуск

### Требования
- Python 3.9+
- Node.js 18+
- PostgreSQL (для production) или SQLite (для разработки)

### Backend

```bash
cd backend

# Создание виртуального окружения
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows

# Установка зависимостей
pip install -r requirements.txt

# Создание файла .env
cp .env.example .env
# Отредактируйте .env и укажите необходимые переменные:
# SECRET_KEY=your_secret_key_here
# DATABASE_URL=postgresql://user:password@localhost/dbname
# ENVIRONMENT=development
# DEBUG=True

# Запуск сервера
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend будет доступен по адресу: `http://localhost:8000`

Документация API: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для production
npm run build

# Предпросмотр production сборки
npm run preview
```

Frontend будет доступен по адресу: `http://localhost:5173`

---

## 🔐 Безопасность

Приложение включает следующие механизмы защиты:

- **JWT Authentication** — токены доступа с истечением срока
- **Rate Limiting** — ограничение запросов (5 запросов в минуту на login)
- **CORS** — строгая политика кросс-доменных запросов
- **Security Headers**:
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security` (в production)
  - `Content-Security-Policy`
- **Валидация входных данных** через Pydantic
- **Хеширование паролей** через bcrypt

---

## 📁 Структура проекта

```
/workspace
├── backend/
│   ├── main.py              # Точка входа FastAPI
│   ├── config.py            # Конфигурация и настройки
│   ├── db.py                # Подключение к БД
│   ├── models.py            # Модели SQLAlchemy
│   ├── schemas.py           # Pydantic схемы
│   ├── auth.py              # Логика аутентификации
│   ├── routers/
│   │   ├── auth.py          # Маршруты аутентификации
│   │   ├── chats/           # Маршруты чатов
│   │   ├── messages/        # Маршруты сообщений
│   │   └── ws/              # WebSocket маршруты
│   ├── utils/
│   │   └── db_helpers.py    # Вспомогательные функции БД
│   ├── uploads/             # Загруженные файлы
│   └── requirements.txt     # Python зависимости
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Главный компонент
│   │   ├── main.jsx         # Точка входа React
│   │   ├── api/             # API клиенты
│   │   ├── components/      # React компоненты
│   │   ├── pages/           # Страницы приложения
│   │   └── hooks/           # Кастомные хуки
│   ├── public/              # Статические файлы
│   ├── package.json         # Node.js зависимости
│   └── vite.config.js       # Конфигурация Vite
├── todo.md                  # План развития проекта
├── issues.txt               # Список известных проблем
└── README.md                # Этот файл
```

---

## 🔧 Конфигурация

### Переменные окружения (Backend)

Создайте файл `.env` в директории `backend/`:

```env
# Обязательные
SECRET_KEY=your_super_secret_key_here

# Опциональные
DATABASE_URL=sqlite:///./chat.db
# Для PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname

ENVIRONMENT=development
DEBUG=True
LOG_LEVEL=INFO

# CORS
ALLOWED_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]

# Rate Limiting
RATE_LIMIT_ENABLED=True
LOGIN_RATE_LIMIT=5/minute

# JWT
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

---

## 🧪 Тестирование

```bash
# Backend (pytest)
cd backend
pytest

# Frontend (Jest/Vitest)
cd frontend
npm test
```

---

## 📝 Планы развития

Следующие приоритетные задачи (см. `todo.md`):

1. ✅ Переход на PostgreSQL
2. ✅ Статусы сообщений
3. ✅ Детали в списке чатов
4. ⏳ Пагинация сообщений
5. ⏳ Валидация и санитизация данных
6. ⏳ Docker контейнеризация
7. ⏳ Покрытие тестами

Полный список задач и приоритетов см. в файле [todo.md](todo.md).

---

## 🐛 Известные проблемы

- Неверное отображение времени в чате (частично устранено)
- Проблемы с фоном сообщений в светлой теме
- Группировка сообщений с одинаковым временем
- Предпросмотр последнего сообщения не вмещается
- Отсутствие настроек уведомлений
- Нет кнопки выбора эмодзи

Подробности в файле [issues.txt](issues.txt).

---

## 📄 Лицензия

MIT

---

## 👥 Авторы

Проект разработан как учебный пример безопасного веб-приложения для обмена сообщениями.

---

## 📞 Контакты

Для вопросов и предложений создавайте issue в репозитории.
