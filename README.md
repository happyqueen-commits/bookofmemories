# Book of Memories (MVP)

Мемориально-архивный проект на Next.js + Prisma. Текущий MVP сфокусирован на **персонах** (Person): публичный каталог, карточка участника, публичная отправка материалов, модерация и админ-аутентификация.

## Что реализовано

- Публичные страницы: `/`, `/about`, `/memory`, `/memory/[slug]`, `/submit`, `/submission-status`.
- Каталог участников и карточки с фото.
- Публичная форма отправки материалов с модерацией.
- Upload изображений через `/api/upload`.
- Админ-аутентификация (только `MODERATOR`/`ADMIN`).
- Панель модерации `/admin`.
- Восстановление пароля: `/account/forgot-password` → `/account/reset-password?token=...`.

## MVP-ограничения

- Поток отправки/автопубликации приведён к честному состоянию: поддерживается только `targetEntityType = Person`.
- Модели `Story`, `ArchiveMaterial`, `ChronicleEvent` в схеме БД сохранены для будущих этапов, но не участвуют в текущем пользовательском submission-flow.

---

## Локальный запуск

1. Установить зависимости:

```bash
npm install
```

2. Создать `.env` на основе примера:

```bash
cp .env.example .env
```

3. Подготовить БД:

```bash
npm run prisma:generate
npx prisma migrate deploy
```

4. Заполнить демо-данными:

```bash
npm run prisma:seed
```

5. Запустить приложение:

```bash
npm run dev
```

---

## Переменные окружения

См. `.env.example`.

### Обязательные

- `DATABASE_URL` — строка подключения PostgreSQL.
- `AUTH_SECRET` — секрет Auth.js.

### Рекомендуемые

- `NEXTAUTH_URL` — базовый URL приложения (callback-и, reset-link).
- `APP_URL` — fallback для абсолютных ссылок (если `NEXTAUTH_URL` не задан).

### Опциональные

- `BLOB_READ_WRITE_TOKEN` — нужен для загрузки изображений в Vercel Blob.
- `PASSWORD_RESET_EMAIL_WEBHOOK_URL` — webhook для доставки reset-ссылок.

> В development без webhook reset-ссылка логируется сервером для QA.

---

## Prisma, миграции и seed

- Схема: `prisma/schema.prisma`.
- Миграции: `prisma/migrations/*`.
- Seed: `prisma/seed.ts`.

Команды:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

---

## Безопасность публичной отправки и upload

Реализовано:

- rate limit на публичную отправку (`submit`), upload (`/api/upload`) и lookup статуса;
- honeypot-поле в публичной форме;
- проверка формата URL и ограничение количества `photoUrls`;
- upload принимает только изображения допустимых mime/ext;
- upload дополнительно проверяет сигнатуру файла (magic bytes);
- ограничение размера файла (5MB).

---

## Модерация

`/admin` доступен только ролям `MODERATOR` и `ADMIN`.

- Фильтрация заявок по статусу;
- статусы: `pending`, `needs_revision`, `approved`, `rejected`;
- при `approved` заявка `Person` создаёт запись в `Person` и связывается с `Submission.targetEntityId`.

---

## Восстановление пароля

Поток:

1. Пользователь открывает `/account/forgot-password` и указывает email.
2. Генерируется raw-токен, в БД хранится только SHA-256 hash (`PasswordResetToken.tokenHash`).
3. Токен живёт 1 час (`expiresAt`).
4. Ссылка ведёт на существующий маршрут: `/account/reset-password?token=...`.
5. После успешной смены пароля токен помечается как использованный (`usedAt`) и повторно не применяется.

---

## Роли пользователей

- `ADMIN` — полный доступ к админке.
- `MODERATOR` — модерация заявок.
- `AUTHOR` — роль в модели сохранена, но вход в админский flow не разрешён.

Демо-учётки из seed:

- `moderator@book.local` / `moderator123`
- `admin@book.local` / `admin123`
